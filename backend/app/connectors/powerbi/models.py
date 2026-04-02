"""
Pydantic models for Power BI API entities.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class PBIGroupInfo(BaseModel):
    id: str
    name: str
    is_read_only: bool = False
    is_on_dedicated_capacity: bool = False
    type: Optional[str] = None


class PBIReportInfo(BaseModel):
    id: str
    name: str
    dataset_id: Optional[str] = None
    web_url: Optional[str] = None
    embed_url: Optional[str] = None
    report_type: Optional[str] = None


class PBIDatasetInfo(BaseModel):
    id: str
    name: str
    configured_by: Optional[str] = None
    is_refreshable: bool = False
    is_effective_identity_required: bool = False
    add_rows_api_enabled: bool = False


class PBIDAXQueryResult(BaseModel):
    """Result of executing a DAX query against a dataset."""
    columns: List[str]
    rows: List[List[Any]]
    row_count: int


class PBIEmbedTokenInfo(BaseModel):
    token: str
    token_id: str
    expiration: str


class PBITable(BaseModel):
    name: str
    columns: List[Dict[str, Any]] = []
    rows: List[Dict[str, Any]] = []
