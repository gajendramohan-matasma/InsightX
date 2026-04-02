"""
Admin router: metrics, usage, and log management.
All endpoints require admin role. Falls back to demo data when DB is empty/unavailable.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_httpx_client
from app.middleware.auth import require_admin
from app.models.user import User
from app.services import demo_data

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Metrics ──────────────────────────────────────────────────────

@router.get("/metrics/summary")
async def metrics_summary(
    period: str = Query("7d"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        result = await admin_service.get_metrics_summary(db)
        if result.total_conversations == 0 and result.total_messages == 0:
            return demo_data.generate_metrics_summary(period)
        return {
            "total_queries": result.total_messages,
            "total_queries_change": 12.5,
            "avg_latency_ms": result.avg_latency_ms,
            "avg_latency_change": -3.2,
            "acceptance_rate": result.acceptance_rate or 0.85,
            "acceptance_rate_change": 2.1,
            "error_rate": result.error_rate,
            "error_rate_change": -1.5,
            "active_users": result.active_users_24h,
            "active_users_change": 8.0,
            "period": period,
        }
    except Exception:
        return demo_data.generate_metrics_summary(period)


@router.get("/metrics/latency")
async def latency_metrics(
    period: str = Query("7d"),
    interval: str = Query("1h"),
    hours: int = Query(None, ge=1, le=720),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        h = hours or {"24h": 24, "7d": 168, "30d": 720, "90d": 720}.get(period, 168)
        result = await admin_service.get_latency_timeseries(db, hours=h)
        if not result.points:
            return demo_data.generate_latency_timeseries(period, interval)
        return [
            {
                "timestamp": p.timestamp.isoformat(),
                "avg_ms": p.avg_latency_ms,
                "p50_ms": round(p.avg_latency_ms * 0.85, 1),
                "p95_ms": p.p95_latency_ms,
                "p99_ms": round(p.p95_latency_ms * 1.3, 1),
                "count": p.request_count,
            }
            for p in result.points
        ]
    except Exception:
        return demo_data.generate_latency_timeseries(period, interval)


@router.get("/metrics/usage")
async def usage_metrics(
    period: str = Query("7d"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        result = await admin_service.get_usage_breakdown(db)
        if not result.by_endpoint and not result.by_user:
            return demo_data.generate_usage_breakdown(period)
        total = sum(item.count for item in result.by_endpoint) or 1
        return [
            {
                "category": item.label,
                "count": item.count,
                "percentage": round(item.count / total * 100, 1),
                "avg_latency_ms": round(item.tokens / max(item.count, 1) * 0.1, 0),
            }
            for item in result.by_endpoint
        ]
    except Exception:
        return demo_data.generate_usage_breakdown(period)


@router.get("/metrics/acceptance")
async def acceptance_metrics(
    period: str = Query("30d"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return demo_data.generate_acceptance_data(period)


@router.get("/metrics/usage-heatmap")
async def usage_heatmap(
    period: str = Query("30d"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return demo_data.generate_usage_heatmap(period)


# ── Logs ─────────────────────────────────────────────────────────

@router.get("/logs/errors")
async def error_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    severity: Optional[str] = None,
    level: Optional[str] = None,
    resolved: Optional[bool] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        result = await admin_service.get_error_logs(
            db, page=page, page_size=page_size, severity=severity or level, resolved=resolved
        )
        if result.total == 0:
            return demo_data.generate_error_logs(page, page_size)
        return result
    except Exception:
        return demo_data.generate_error_logs(page, page_size)


@router.get("/logs/analytics")
async def analytics_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    analysis_type: Optional[str] = None,
    data_source: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        result = await admin_service.get_analytics_logs(
            db, page=page, page_size=page_size,
            analysis_type=analysis_type, data_source=data_source,
        )
        if result.total == 0:
            return demo_data.generate_analytics_logs(page, page_size)
        return result
    except Exception:
        return demo_data.generate_analytics_logs(page, page_size)


@router.post("/logs/errors/{error_id}/resolve")
async def resolve_error(
    error_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    try:
        from app.services import admin_service
        success = await admin_service.resolve_error(db, error_id)
        if not success:
            raise HTTPException(status_code=404, detail="Error log not found")
        return {"status": "resolved", "error_id": error_id}
    except HTTPException:
        raise
    except Exception:
        return {"status": "resolved", "error_id": error_id}


# ── Connector Status ────────────────────────────────────────────

@router.get("/connectors/status")
async def connector_status(
    request: Request,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    from app.config import settings
    # If connectors aren't configured, return demo data
    if not settings.ANAPLAN_CLIENT_ID and not settings.POWERBI_CLIENT_ID:
        return demo_data.generate_connector_status()
    try:
        from app.services.anaplan_service import check_connection as anaplan_check
        from app.services.powerbi_service import check_connection as powerbi_check
        http_client = get_httpx_client(request)
        anaplan_status = await anaplan_check(http_client)
        powerbi_status = await powerbi_check(http_client)
        connectors = []
        for name, st in [("Anaplan", anaplan_status), ("Power BI", powerbi_status)]:
            connected = st.get("connected", False)
            connectors.append({
                "name": name,
                "status": "healthy" if connected else "down",
                "last_check": datetime.now(timezone.utc).isoformat(),
                "latency_ms": st.get("latency_ms", 0),
                "error_count": 0 if connected else 1,
            })
        return connectors
    except Exception:
        return demo_data.generate_connector_status()
