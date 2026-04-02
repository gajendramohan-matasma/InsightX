"""
Health and readiness check endpoints.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.connectors.anaplan.auth import AnaplanAuth
from app.connectors.powerbi.auth import PowerBIAuth
from app.models.database import async_engine

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """
    Basic liveness check. Returns 200 if the application is running.
    """
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME,
    }


@router.get("/ready")
async def readiness_check():
    """
    Readiness check that verifies external dependencies.
    Returns 200 only if the database is reachable.
    """
    checks = {}

    # Database connectivity
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = {"status": "ok"}
    except Exception as e:
        checks["database"] = {"status": "error", "detail": str(e)}

    # Anaplan credentials configured
    anaplan_auth = AnaplanAuth()
    checks["anaplan"] = {
        "configured": anaplan_auth.is_configured,
    }

    # Power BI credentials configured
    pbi_auth = PowerBIAuth()
    checks["powerbi"] = {
        "configured": pbi_auth.is_configured,
    }

    # Anthropic API key configured
    checks["anthropic"] = {
        "configured": bool(settings.ANTHROPIC_API_KEY),
    }

    all_ok = checks["database"]["status"] == "ok"
    status_code = 200 if all_ok else 503

    return {
        "status": "ready" if all_ok else "not_ready",
        "checks": checks,
    }
