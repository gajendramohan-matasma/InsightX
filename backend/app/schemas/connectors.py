"""
Connector-related Pydantic schemas for Anaplan and Power BI.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Connector Status ─────────────────────────────────────────────

class ConnectorStatus(BaseModel):
    name: str
    connected: bool
    last_checked: Optional[str] = None
    error: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


# ── Anaplan ──────────────────────────────────────────────────────

class AnaplanWorkspace(BaseModel):
    id: str
    name: str
    active: bool = True


class AnaplanModel(BaseModel):
    id: str
    name: str
    workspace_id: str
    current_workspace_id: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None


class AnaplanModule(BaseModel):
    id: str
    name: str
    model_id: str


class AnaplanView(BaseModel):
    id: str
    name: str
    module_id: str


class AnaplanExportData(BaseModel):
    headers: List[str]
    rows: List[List[Any]]
    row_count: int
    metadata: Optional[Dict[str, Any]] = None


# ── Power BI ─────────────────────────────────────────────────────

class PowerBIGroup(BaseModel):
    id: str
    name: str
    is_read_only: bool = False
    is_on_dedicated_capacity: bool = False


class PowerBIReport(BaseModel):
    id: str
    name: str
    group_id: Optional[str] = None
    dataset_id: Optional[str] = None
    web_url: Optional[str] = None
    embed_url: Optional[str] = None


class PowerBIDataset(BaseModel):
    id: str
    name: str
    group_id: Optional[str] = None
    configured_by: Optional[str] = None
    is_refreshable: bool = False


class PowerBIDAXResult(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    row_count: int


class PowerBIEmbedToken(BaseModel):
    token: str
    token_id: str
    expiration: str
    embed_url: str
    report_id: str
