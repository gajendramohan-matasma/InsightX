"""
Connector router: browse Anaplan and Power BI resources.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.dependencies import get_db, get_httpx_client
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import anaplan_service, powerbi_service
from app.schemas.connectors import ConnectorStatus

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Status ───────────────────────────────────────────────────────

@router.get("/status")
async def connectors_status(
    request: Request,
    user: User = Depends(get_current_user),
):
    """Check connection status of all connectors."""
    http_client = get_httpx_client(request)

    anaplan_status = await anaplan_service.check_connection(http_client)
    powerbi_status = await powerbi_service.check_connection(http_client)

    return {
        "connectors": [
            ConnectorStatus(
                name="Anaplan",
                connected=anaplan_status.get("connected", False),
                error=anaplan_status.get("error"),
                details=anaplan_status,
            ),
            ConnectorStatus(
                name="Power BI",
                connected=powerbi_status.get("connected", False),
                error=powerbi_status.get("error"),
                details=powerbi_status,
            ),
        ]
    }


# ── Anaplan ──────────────────────────────────────────────────────

@router.get("/anaplan/workspaces")
async def anaplan_workspaces(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all Anaplan workspaces."""
    http_client = get_httpx_client(request)
    try:
        workspaces = await anaplan_service.list_workspaces(http_client)
        return {"workspaces": [w.dict() for w in workspaces]}
    except Exception as e:
        logger.error("Failed to list Anaplan workspaces: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Anaplan API error: {str(e)}",
        )


@router.get("/anaplan/workspaces/{workspace_id}/models")
async def anaplan_models(
    workspace_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all models in an Anaplan workspace."""
    http_client = get_httpx_client(request)
    try:
        models = await anaplan_service.list_models(http_client, workspace_id)
        return {"models": [m.dict() for m in models]}
    except Exception as e:
        logger.error("Failed to list Anaplan models: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Anaplan API error: {str(e)}",
        )


# ── Power BI ─────────────────────────────────────────────────────

@router.get("/powerbi/workspaces")
async def powerbi_workspaces(
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all Power BI workspaces."""
    http_client = get_httpx_client(request)
    try:
        groups = await powerbi_service.list_groups(http_client)
        return {"workspaces": [g.dict() for g in groups]}
    except Exception as e:
        logger.error("Failed to list Power BI workspaces: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Power BI API error: {str(e)}",
        )


@router.get("/powerbi/workspaces/{group_id}/reports")
async def powerbi_reports(
    group_id: str,
    request: Request,
    user: User = Depends(get_current_user),
):
    """List all reports in a Power BI workspace."""
    http_client = get_httpx_client(request)
    try:
        reports = await powerbi_service.list_reports(http_client, group_id)
        return {"reports": [r.dict() for r in reports]}
    except Exception as e:
        logger.error("Failed to list Power BI reports: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Power BI API error: {str(e)}",
        )
