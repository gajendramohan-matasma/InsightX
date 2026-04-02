"""
Admin dashboard Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, Generic, List, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ── Metrics ──────────────────────────────────────────────────────

class MetricsSummary(BaseModel):
    total_conversations: int
    total_messages: int
    total_users: int
    active_users_24h: int
    avg_latency_ms: float
    total_tokens_used: int
    total_cost_estimate: float
    error_rate: float
    acceptance_rate: Optional[float] = None


class LatencyPoint(BaseModel):
    timestamp: datetime
    avg_latency_ms: float
    p95_latency_ms: float
    request_count: int


class LatencyTimeSeries(BaseModel):
    points: List[LatencyPoint]
    overall_avg: float
    overall_p95: float


class UsageBreakdownItem(BaseModel):
    label: str
    count: int
    tokens: int
    cost: float


class UsageBreakdown(BaseModel):
    by_user: List[UsageBreakdownItem] = Field(default_factory=list)
    by_endpoint: List[UsageBreakdownItem] = Field(default_factory=list)
    by_day: List[UsageBreakdownItem] = Field(default_factory=list)


class AcceptanceMetrics(BaseModel):
    total_rated: int
    accepted: int
    rejected: int
    acceptance_rate: float
    by_analysis_type: Dict[str, float] = Field(default_factory=dict)


# ── Logs ─────────────────────────────────────────────────────────

class ErrorLogSchema(BaseModel):
    id: uuid.UUID
    error_type: str
    error_message: str
    stack_trace: Optional[str] = None
    severity: str
    resolved: bool
    conversation_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AnalyticsLogSchema(BaseModel):
    id: uuid.UUID
    conversation_id: Optional[uuid.UUID] = None
    message_id: Optional[uuid.UUID] = None
    analysis_type: str
    data_source: str
    query_params: Optional[Dict[str, Any]] = None
    result_summary: Optional[Dict[str, Any]] = None
    latency_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Pagination ───────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int
