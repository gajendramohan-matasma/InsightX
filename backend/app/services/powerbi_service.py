"""
Power BI service wrapper.
Provides a simplified interface for routers to interact with Power BI data.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.connectors.powerbi.auth import PowerBIAuth
from app.connectors.powerbi.client import PowerBIClient
from app.schemas.connectors import (
    PowerBIDAXResult,
    PowerBIDataset,
    PowerBIEmbedToken,
    PowerBIGroup,
    PowerBIReport,
)

logger = logging.getLogger(__name__)

_auth: Optional[PowerBIAuth] = None


def _get_auth() -> PowerBIAuth:
    global _auth
    if _auth is None:
        _auth = PowerBIAuth()
    return _auth


def get_client(http_client: httpx.AsyncClient) -> PowerBIClient:
    return PowerBIClient(http_client, auth=_get_auth())


async def list_groups(http_client: httpx.AsyncClient) -> List[PowerBIGroup]:
    """List all Power BI workspaces."""
    client = get_client(http_client)
    groups = await client.list_groups()
    return [
        PowerBIGroup(
            id=g.id,
            name=g.name,
            is_read_only=g.is_read_only,
            is_on_dedicated_capacity=g.is_on_dedicated_capacity,
        )
        for g in groups
    ]


async def list_reports(
    http_client: httpx.AsyncClient, group_id: str
) -> List[PowerBIReport]:
    """List all reports in a workspace."""
    client = get_client(http_client)
    reports = await client.list_reports(group_id)
    return [
        PowerBIReport(
            id=r.id,
            name=r.name,
            group_id=group_id,
            dataset_id=r.dataset_id,
            web_url=r.web_url,
            embed_url=r.embed_url,
        )
        for r in reports
    ]


async def list_datasets(
    http_client: httpx.AsyncClient, group_id: str
) -> List[PowerBIDataset]:
    """List all datasets in a workspace."""
    client = get_client(http_client)
    datasets = await client.list_datasets(group_id)
    return [
        PowerBIDataset(
            id=d.id,
            name=d.name,
            group_id=group_id,
            configured_by=d.configured_by,
            is_refreshable=d.is_refreshable,
        )
        for d in datasets
    ]


async def execute_dax_query(
    http_client: httpx.AsyncClient,
    group_id: str,
    dataset_id: str,
    dax_query: str,
) -> PowerBIDAXResult:
    """Execute a DAX query against a dataset."""
    client = get_client(http_client)
    result = await client.execute_dax_query(group_id, dataset_id, dax_query)
    return PowerBIDAXResult(
        columns=result.columns,
        rows=result.rows,
        row_count=result.row_count,
    )


async def get_embed_token(
    http_client: httpx.AsyncClient,
    group_id: str,
    report_id: str,
) -> PowerBIEmbedToken:
    """Generate an embed token for a report."""
    client = get_client(http_client)
    embed_info = await client.get_report_embed_url(group_id, report_id)
    token_info = await client.generate_embed_token(group_id, report_id)
    return PowerBIEmbedToken(
        token=token_info.token,
        token_id=token_info.token_id,
        expiration=token_info.expiration,
        embed_url=embed_info["embed_url"],
        report_id=report_id,
    )


async def check_connection(http_client: httpx.AsyncClient) -> Dict[str, Any]:
    """Check if the Power BI connection is healthy."""
    auth = _get_auth()
    if not auth.is_configured:
        return {"connected": False, "error": "Power BI credentials not configured"}

    try:
        client = get_client(http_client)
        groups = await client.list_groups()
        return {
            "connected": True,
            "workspace_count": len(groups),
        }
    except Exception as e:
        logger.error("Power BI connection check failed: %s", str(e))
        return {"connected": False, "error": str(e)}
