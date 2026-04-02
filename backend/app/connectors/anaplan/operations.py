"""
High-level Anaplan operations used by the LLM tool executor.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.connectors.anaplan.auth import AnaplanAuth
from app.connectors.anaplan.client import AnaplanClient

logger = logging.getLogger(__name__)


async def get_financial_data(
    http_client: httpx.AsyncClient,
    workspace_id: str,
    model_id: str,
    export_id: str,
    auth: Optional[AnaplanAuth] = None,
) -> Dict[str, Any]:
    """
    Retrieve financial data from an Anaplan export action.
    Returns a dict with headers, rows, and metadata.
    """
    client = AnaplanClient(http_client, auth=auth)
    result = await client.export_view_data(workspace_id, model_id, export_id)

    if not result.success:
        return {
            "success": False,
            "error": result.failure_reason,
            "data": None,
        }

    return {
        "success": True,
        "headers": result.headers,
        "rows": result.rows,
        "row_count": result.row_count,
    }


async def search_available_data(
    http_client: httpx.AsyncClient,
    workspace_id: str,
    model_id: str,
    search_term: Optional[str] = None,
    auth: Optional[AnaplanAuth] = None,
) -> Dict[str, Any]:
    """
    List available modules and views in a model, optionally filtered by search term.
    """
    client = AnaplanClient(http_client, auth=auth)
    modules = await client.list_modules(workspace_id, model_id)

    results: List[Dict[str, Any]] = []
    for module in modules:
        if search_term and search_term.lower() not in module.name.lower():
            continue

        views = await client.list_views(workspace_id, model_id, module.id)
        module_info: Dict[str, Any] = {
            "module_id": module.id,
            "module_name": module.name,
            "views": [
                {"view_id": v.id, "view_name": v.name}
                for v in views
                if not search_term or search_term.lower() in v.name.lower()
            ],
        }
        if module_info["views"] or not search_term:
            results.append(module_info)

    return {
        "workspace_id": workspace_id,
        "model_id": model_id,
        "modules": results,
        "total_modules": len(results),
    }


async def get_model_metadata(
    http_client: httpx.AsyncClient,
    workspace_id: Optional[str] = None,
    auth: Optional[AnaplanAuth] = None,
) -> Dict[str, Any]:
    """
    Get workspace and model metadata. If workspace_id is None, lists all workspaces first.
    """
    client = AnaplanClient(http_client, auth=auth)

    if not workspace_id:
        workspaces = await client.list_workspaces()
        return {
            "workspaces": [
                {
                    "id": w.id,
                    "name": w.name,
                    "active": w.active,
                }
                for w in workspaces
            ],
        }

    models = await client.list_models(workspace_id)
    return {
        "workspace_id": workspace_id,
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "active_state": m.active_state,
                "category": m.category,
            }
            for m in models
        ],
    }
