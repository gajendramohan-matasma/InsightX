"""
Anaplan service wrapper.
Provides a simplified interface for routers to interact with Anaplan data.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.connectors.anaplan.auth import AnaplanAuth
from app.connectors.anaplan.client import AnaplanClient
from app.schemas.connectors import (
    AnaplanExportData,
    AnaplanModel,
    AnaplanModule,
    AnaplanView,
    AnaplanWorkspace,
)

logger = logging.getLogger(__name__)

# Module-level singleton (initialized on first use)
_auth: Optional[AnaplanAuth] = None


def _get_auth() -> AnaplanAuth:
    global _auth
    if _auth is None:
        _auth = AnaplanAuth()
    return _auth


def get_client(http_client: httpx.AsyncClient) -> AnaplanClient:
    return AnaplanClient(http_client, auth=_get_auth())


async def list_workspaces(http_client: httpx.AsyncClient) -> List[AnaplanWorkspace]:
    """List all Anaplan workspaces."""
    client = get_client(http_client)
    workspaces = await client.list_workspaces()
    return [
        AnaplanWorkspace(id=w.id, name=w.name, active=w.active)
        for w in workspaces
    ]


async def list_models(
    http_client: httpx.AsyncClient, workspace_id: str
) -> List[AnaplanModel]:
    """List all models in a workspace."""
    client = get_client(http_client)
    models = await client.list_models(workspace_id)
    return [
        AnaplanModel(
            id=m.id,
            name=m.name,
            workspace_id=workspace_id,
            current_workspace_id=m.current_workspace_id,
            status=m.active_state,
        )
        for m in models
    ]


async def list_modules(
    http_client: httpx.AsyncClient, workspace_id: str, model_id: str
) -> List[AnaplanModule]:
    """List all modules in a model."""
    client = get_client(http_client)
    modules = await client.list_modules(workspace_id, model_id)
    return [
        AnaplanModule(id=m.id, name=m.name, model_id=model_id)
        for m in modules
    ]


async def list_views(
    http_client: httpx.AsyncClient,
    workspace_id: str,
    model_id: str,
    module_id: str,
) -> List[AnaplanView]:
    """List all views in a module."""
    client = get_client(http_client)
    views = await client.list_views(workspace_id, model_id, module_id)
    return [
        AnaplanView(id=v.id, name=v.name, module_id=module_id)
        for v in views
    ]


async def export_view_data(
    http_client: httpx.AsyncClient,
    workspace_id: str,
    model_id: str,
    export_id: str,
) -> AnaplanExportData:
    """Run a bulk export and return structured data."""
    client = get_client(http_client)
    result = await client.export_view_data(workspace_id, model_id, export_id)

    if not result.success:
        raise RuntimeError(f"Anaplan export failed: {result.failure_reason}")

    return AnaplanExportData(
        headers=result.headers,
        rows=result.rows,
        row_count=result.row_count,
    )


async def check_connection(http_client: httpx.AsyncClient) -> Dict[str, Any]:
    """Check if the Anaplan connection is healthy."""
    auth = _get_auth()
    if not auth.is_configured:
        return {"connected": False, "error": "Anaplan credentials not configured"}

    try:
        client = get_client(http_client)
        workspaces = await client.list_workspaces()
        return {
            "connected": True,
            "workspace_count": len(workspaces),
        }
    except Exception as e:
        logger.error("Anaplan connection check failed: %s", str(e))
        return {"connected": False, "error": str(e)}
