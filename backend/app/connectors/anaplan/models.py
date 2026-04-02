"""
Pydantic models for Anaplan API entities.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class AnaplanWorkspaceInfo(BaseModel):
    id: str
    name: str
    active: bool = True
    size_allowance: Optional[int] = None
    current_size: Optional[int] = None


class AnaplanModelInfo(BaseModel):
    id: str
    name: str
    active_state: Optional[str] = None
    last_saved_serial_number: Optional[int] = None
    last_modified_by_user_guid: Optional[str] = None
    memory_usage: Optional[int] = None
    category: Optional[Dict[str, Any]] = None
    current_workspace_id: Optional[str] = None


class AnaplanModuleInfo(BaseModel):
    id: str
    name: str


class AnaplanViewInfo(BaseModel):
    id: str
    name: str
    module_id: Optional[str] = None


class AnaplanDimension(BaseModel):
    id: str
    name: str
    items: List[Dict[str, Any]] = []


class AnaplanExportTask(BaseModel):
    task_id: str
    task_state: str  # NOT_STARTED, IN_PROGRESS, COMPLETE, FAILED
    progress: float = 0.0


class AnaplanExportResult(BaseModel):
    success: bool
    headers: List[str] = []
    rows: List[List[Any]] = []
    row_count: int = 0
    failure_reason: Optional[str] = None
