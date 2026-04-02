"""
Chat-related Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Chart / Visualization ────────────────────────────────────────

class ChartSpec(BaseModel):
    """Specification for a chart to be rendered by the frontend."""
    chart_type: str = Field(..., description="e.g. bar, line, pie, area, scatter, waterfall, combo")
    title: str = ""
    x_axis: Optional[str] = None
    y_axis: Optional[str] = None
    data: List[Dict[str, Any]] = Field(default_factory=list)
    series: Optional[List[Dict[str, Any]]] = None
    config: Optional[Dict[str, Any]] = None


# ── Message ──────────────────────────────────────────────────────

class MessageSchema(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: str
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = None
    tool_results: Optional[List[Dict[str, Any]]] = None
    metadata: Optional[Dict[str, Any]] = None
    accepted: Optional[bool] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Conversation ─────────────────────────────────────────────────

class ConversationSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ConversationListItem(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0

    class Config:
        from_attributes = True


# ── Chat Request / Response ──────────────────────────────────────

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    conversation_id: Optional[uuid.UUID] = None


class DataTable(BaseModel):
    """A structured data table extracted from analysis results."""
    title: str = ""
    headers: List[str] = Field(default_factory=list)
    rows: List[List[Any]] = Field(default_factory=list)


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    content: str
    visualizations: List[ChartSpec] = Field(default_factory=list)
    data_tables: List[DataTable] = Field(default_factory=list)
    tool_calls_made: List[Dict[str, Any]] = Field(default_factory=list)


# ── Streaming ────────────────────────────────────────────────────

class StreamEvent(BaseModel):
    """Server-Sent Event payload for streaming responses."""
    event: str = Field(..., description="Event type: text_delta, tool_start, tool_result, visualization, done, error")
    data: Dict[str, Any] = Field(default_factory=dict)


# ── Feedback ─────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    accepted: bool
    comment: Optional[str] = None
