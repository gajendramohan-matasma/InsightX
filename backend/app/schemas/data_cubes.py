"""
Data Cube Pydantic schemas.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DataCubeColumn(BaseModel):
    name: str
    type: str  # string, number, date, currency, percentage
    description: Optional[str] = None


class DataCubeConfig(BaseModel):
    source_type: str = ""
    connection_id: Optional[str] = None
    query: Optional[str] = None
    export_name: Optional[str] = None


class DataCubeResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    source: str
    status: str
    config: Dict[str, Any] = Field(default_factory=dict)
    schema_definition: List[DataCubeColumn] = Field(default_factory=list)
    refresh_schedule: str = "manual"
    last_refreshed_at: Optional[datetime] = None
    row_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DataCubeDataResponse(BaseModel):
    columns: List[str]
    rows: List[Dict[str, Any]]
    total: int
    limit: int
    offset: int
