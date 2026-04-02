"""
Admin service: aggregation queries for dashboard metrics.
"""

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import case, cast, desc, Float, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics_log import AnalyticsLog
from app.models.conversation import Conversation, Message, MessageRole
from app.models.error_log import ErrorLog
from app.models.usage_metric import UsageMetric
from app.models.user import User
from app.schemas.admin import (
    AcceptanceMetrics,
    AnalyticsLogSchema,
    ErrorLogSchema,
    LatencyPoint,
    LatencyTimeSeries,
    MetricsSummary,
    PaginatedResponse,
    UsageBreakdown,
    UsageBreakdownItem,
)

logger = logging.getLogger(__name__)


async def get_metrics_summary(db: AsyncSession) -> MetricsSummary:
    """Aggregate high-level metrics for the admin dashboard."""
    now = datetime.now(timezone.utc)
    day_ago = now - timedelta(hours=24)

    # Total conversations
    total_conversations_result = await db.execute(
        select(func.count(Conversation.id))
    )
    total_conversations = total_conversations_result.scalar() or 0

    # Total messages
    total_messages_result = await db.execute(
        select(func.count(Message.id))
    )
    total_messages = total_messages_result.scalar() or 0

    # Total users
    total_users_result = await db.execute(
        select(func.count(User.id))
    )
    total_users = total_users_result.scalar() or 0

    # Active users in last 24h
    active_users_result = await db.execute(
        select(func.count(func.distinct(UsageMetric.user_id))).where(
            UsageMetric.created_at >= day_ago
        )
    )
    active_users_24h = active_users_result.scalar() or 0

    # Average latency
    avg_latency_result = await db.execute(
        select(func.avg(AnalyticsLog.latency_ms))
    )
    avg_latency_ms = float(avg_latency_result.scalar() or 0)

    # Total tokens used
    total_tokens_result = await db.execute(
        select(func.sum(UsageMetric.tokens_used))
    )
    total_tokens_used = total_tokens_result.scalar() or 0

    # Total cost estimate
    total_cost_result = await db.execute(
        select(func.sum(UsageMetric.cost_estimate))
    )
    total_cost_estimate = float(total_cost_result.scalar() or Decimal("0"))

    # Error rate (errors in last 24h / total requests in last 24h)
    error_count_result = await db.execute(
        select(func.count(ErrorLog.id)).where(ErrorLog.created_at >= day_ago)
    )
    error_count = error_count_result.scalar() or 0

    request_count_result = await db.execute(
        select(func.count(AnalyticsLog.id)).where(AnalyticsLog.created_at >= day_ago)
    )
    request_count = request_count_result.scalar() or 1
    error_rate = round(error_count / max(request_count, 1), 4)

    # Acceptance rate
    acceptance_result = await db.execute(
        select(
            func.count(Message.id).filter(Message.accepted.isnot(None)).label("total_rated"),
            func.count(Message.id).filter(Message.accepted == True).label("accepted"),
        )
    )
    row = acceptance_result.one()
    total_rated = row.total_rated or 0
    accepted = row.accepted or 0
    acceptance_rate = round(accepted / max(total_rated, 1), 4) if total_rated > 0 else None

    return MetricsSummary(
        total_conversations=total_conversations,
        total_messages=total_messages,
        total_users=total_users,
        active_users_24h=active_users_24h,
        avg_latency_ms=round(avg_latency_ms, 2),
        total_tokens_used=total_tokens_used,
        total_cost_estimate=round(total_cost_estimate, 2),
        error_rate=error_rate,
        acceptance_rate=acceptance_rate,
    )


async def get_latency_timeseries(
    db: AsyncSession, hours: int = 24
) -> LatencyTimeSeries:
    """Get latency time series data grouped by hour."""
    since = datetime.now(timezone.utc) - timedelta(hours=hours)

    stmt = (
        select(
            func.date_trunc("hour", AnalyticsLog.created_at).label("hour"),
            func.avg(AnalyticsLog.latency_ms).label("avg_latency"),
            func.percentile_cont(0.95)
            .within_group(AnalyticsLog.latency_ms)
            .label("p95_latency"),
            func.count(AnalyticsLog.id).label("request_count"),
        )
        .where(AnalyticsLog.created_at >= since)
        .group_by(text("hour"))
        .order_by(text("hour"))
    )
    result = await db.execute(stmt)
    rows = result.all()

    points = [
        LatencyPoint(
            timestamp=row.hour,
            avg_latency_ms=round(float(row.avg_latency or 0), 2),
            p95_latency_ms=round(float(row.p95_latency or 0), 2),
            request_count=row.request_count,
        )
        for row in rows
    ]

    overall_avg = sum(p.avg_latency_ms for p in points) / max(len(points), 1)
    overall_p95 = max((p.p95_latency_ms for p in points), default=0)

    return LatencyTimeSeries(
        points=points,
        overall_avg=round(overall_avg, 2),
        overall_p95=round(overall_p95, 2),
    )


async def get_usage_breakdown(db: AsyncSession) -> UsageBreakdown:
    """Get usage breakdown by user, endpoint, and day."""

    # By user
    by_user_stmt = (
        select(
            User.display_name.label("label"),
            func.count(UsageMetric.id).label("count"),
            func.coalesce(func.sum(UsageMetric.tokens_used), 0).label("tokens"),
            func.coalesce(func.sum(UsageMetric.cost_estimate), 0).label("cost"),
        )
        .join(User, User.id == UsageMetric.user_id)
        .group_by(User.display_name)
        .order_by(desc("tokens"))
        .limit(20)
    )
    by_user_result = await db.execute(by_user_stmt)
    by_user = [
        UsageBreakdownItem(
            label=row.label,
            count=row.count,
            tokens=int(row.tokens),
            cost=round(float(row.cost), 4),
        )
        for row in by_user_result.all()
    ]

    # By endpoint
    by_endpoint_stmt = (
        select(
            UsageMetric.endpoint.label("label"),
            func.count(UsageMetric.id).label("count"),
            func.coalesce(func.sum(UsageMetric.tokens_used), 0).label("tokens"),
            func.coalesce(func.sum(UsageMetric.cost_estimate), 0).label("cost"),
        )
        .where(UsageMetric.endpoint.isnot(None))
        .group_by(UsageMetric.endpoint)
        .order_by(desc("count"))
    )
    by_endpoint_result = await db.execute(by_endpoint_stmt)
    by_endpoint = [
        UsageBreakdownItem(
            label=row.label or "unknown",
            count=row.count,
            tokens=int(row.tokens),
            cost=round(float(row.cost), 4),
        )
        for row in by_endpoint_result.all()
    ]

    # By day (last 30 days)
    since = datetime.now(timezone.utc) - timedelta(days=30)
    by_day_stmt = (
        select(
            func.date_trunc("day", UsageMetric.created_at).label("day"),
            func.count(UsageMetric.id).label("count"),
            func.coalesce(func.sum(UsageMetric.tokens_used), 0).label("tokens"),
            func.coalesce(func.sum(UsageMetric.cost_estimate), 0).label("cost"),
        )
        .where(UsageMetric.created_at >= since)
        .group_by(text("day"))
        .order_by(text("day"))
    )
    by_day_result = await db.execute(by_day_stmt)
    by_day = [
        UsageBreakdownItem(
            label=str(row.day.date()) if row.day else "unknown",
            count=row.count,
            tokens=int(row.tokens),
            cost=round(float(row.cost), 4),
        )
        for row in by_day_result.all()
    ]

    return UsageBreakdown(by_user=by_user, by_endpoint=by_endpoint, by_day=by_day)


async def get_acceptance_metrics(db: AsyncSession) -> AcceptanceMetrics:
    """Get feedback/acceptance metrics."""
    stmt = select(
        func.count(Message.id).filter(Message.accepted.isnot(None)).label("total_rated"),
        func.count(Message.id).filter(Message.accepted == True).label("accepted"),
        func.count(Message.id).filter(Message.accepted == False).label("rejected"),
    )
    result = await db.execute(stmt)
    row = result.one()

    total_rated = row.total_rated or 0
    accepted = row.accepted or 0
    rejected = row.rejected or 0
    rate = round(accepted / max(total_rated, 1), 4) if total_rated > 0 else 0.0

    return AcceptanceMetrics(
        total_rated=total_rated,
        accepted=accepted,
        rejected=rejected,
        acceptance_rate=rate,
    )


async def get_error_logs(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    severity: Optional[str] = None,
    resolved: Optional[bool] = None,
) -> PaginatedResponse:
    """Get paginated error logs with optional filters."""
    stmt = select(ErrorLog).order_by(desc(ErrorLog.created_at))
    count_stmt = select(func.count(ErrorLog.id))

    if severity:
        stmt = stmt.where(ErrorLog.severity == severity)
        count_stmt = count_stmt.where(ErrorLog.severity == severity)
    if resolved is not None:
        stmt = stmt.where(ErrorLog.resolved == resolved)
        count_stmt = count_stmt.where(ErrorLog.resolved == resolved)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    items = [
        ErrorLogSchema(
            id=log.id,
            error_type=log.error_type,
            error_message=log.error_message,
            stack_trace=log.stack_trace,
            severity=log.severity.value,
            resolved=log.resolved,
            conversation_id=log.conversation_id,
            created_at=log.created_at,
        )
        for log in logs
    ]

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def get_analytics_logs(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 50,
    analysis_type: Optional[str] = None,
    data_source: Optional[str] = None,
) -> PaginatedResponse:
    """Get paginated analytics logs with optional filters."""
    stmt = select(AnalyticsLog).order_by(desc(AnalyticsLog.created_at))
    count_stmt = select(func.count(AnalyticsLog.id))

    if analysis_type:
        stmt = stmt.where(AnalyticsLog.analysis_type == analysis_type)
        count_stmt = count_stmt.where(AnalyticsLog.analysis_type == analysis_type)
    if data_source:
        stmt = stmt.where(AnalyticsLog.data_source == data_source)
        count_stmt = count_stmt.where(AnalyticsLog.data_source == data_source)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    items = [
        AnalyticsLogSchema(
            id=log.id,
            conversation_id=log.conversation_id,
            message_id=log.message_id,
            analysis_type=log.analysis_type,
            data_source=log.data_source,
            query_params=log.query_params,
            result_summary=log.result_summary,
            latency_ms=log.latency_ms,
            created_at=log.created_at,
        )
        for log in logs
    ]

    total_pages = (total + page_size - 1) // page_size

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


async def resolve_error(db: AsyncSession, error_id: str) -> bool:
    """Mark an error log as resolved."""
    import uuid as uuid_mod
    stmt = select(ErrorLog).where(ErrorLog.id == uuid_mod.UUID(error_id))
    result = await db.execute(stmt)
    error = result.scalar_one_or_none()

    if not error:
        return False

    error.resolved = True
    await db.flush()
    return True
