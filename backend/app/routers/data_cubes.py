"""
Data Cubes router: browse, refresh, and query pre-configured data pipelines.
Falls back to in-memory demo data when DB is unavailable.
"""

import logging
import uuid as uuid_mod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.data_cube_service import _get_seed_cubes

logger = logging.getLogger(__name__)

router = APIRouter()

# In-memory cache for when DB is unavailable
_demo_cubes_cache: Optional[List[Dict[str, Any]]] = None


def _get_demo_cubes() -> List[Dict[str, Any]]:
    global _demo_cubes_cache
    if _demo_cubes_cache is None:
        now = datetime.now(timezone.utc)
        raw = _get_seed_cubes(now)
        cubes = []
        for c in raw:
            cubes.append({
                "id": str(uuid_mod.uuid5(uuid_mod.NAMESPACE_DNS, c["name"])),
                "name": c["name"],
                "description": c["description"],
                "source": c["source"],
                "status": c["status"].value if hasattr(c["status"], "value") else c["status"],
                "config": c["config"],
                "schema_definition": c["schema_definition"],
                "refresh_schedule": c["refresh_schedule"],
                "last_refreshed_at": c["last_refreshed_at"].isoformat() if c.get("last_refreshed_at") else None,
                "row_count": c["row_count"],
                "cached_data": c["cached_data"],
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            })
        _demo_cubes_cache = cubes
    return _demo_cubes_cache


@router.get("/")
async def list_cubes(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all data cubes."""
    if request.app.state.db_available:
        try:
            from app.services import data_cube_service
            cubes = await data_cube_service.list_data_cubes(db)
            if cubes:
                return cubes
        except Exception:
            pass
    # Fallback to in-memory demo
    return [
        {k: v for k, v in c.items() if k != "cached_data"}
        for c in _get_demo_cubes()
    ]


@router.get("/{cube_id}")
async def get_cube(
    cube_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single data cube by ID."""
    if request.app.state.db_available:
        try:
            from app.services import data_cube_service
            cube = await data_cube_service.get_data_cube(db, cube_id)
            if cube:
                return cube
        except Exception:
            pass
    for c in _get_demo_cubes():
        if c["id"] == cube_id:
            return {k: v for k, v in c.items() if k != "cached_data"}
    raise HTTPException(status_code=404, detail="Data cube not found")


@router.get("/{cube_id}/data")
async def get_cube_data(
    cube_id: str,
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    request: Request = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the cached data from a data cube."""
    if request and request.app.state.db_available:
        try:
            from app.services import data_cube_service
            data = await data_cube_service.get_cube_data(db, cube_id, limit=limit, offset=offset)
            if data:
                return data
        except Exception:
            pass
    for c in _get_demo_cubes():
        if c["id"] == cube_id:
            rows = c.get("cached_data", [])
            columns = [col["name"] for col in c.get("schema_definition", [])]
            return {
                "columns": columns,
                "rows": rows[offset : offset + limit],
                "total": len(rows),
                "limit": limit,
                "offset": offset,
            }
    raise HTTPException(status_code=404, detail="Data cube not found")


@router.post("/{cube_id}/refresh")
async def refresh_cube(
    cube_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Trigger a data refresh for a cube."""
    if request.app.state.db_available:
        try:
            from app.services import data_cube_service
            cube = await data_cube_service.refresh_data_cube(db, cube_id)
            if cube:
                return cube
        except Exception:
            pass
    for c in _get_demo_cubes():
        if c["id"] == cube_id:
            c["last_refreshed_at"] = datetime.now(timezone.utc).isoformat()
            return {k: v for k, v in c.items() if k != "cached_data"}
    raise HTTPException(status_code=404, detail="Data cube not found")


@router.post("/seed")
async def seed_cubes(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Seed demo data cubes."""
    if request.app.state.db_available:
        try:
            from app.services import data_cube_service
            cubes = await data_cube_service.seed_data_cubes(db)
            if cubes:
                return cubes
            return await data_cube_service.list_data_cubes(db)
        except Exception:
            pass
    return [
        {k: v for k, v in c.items() if k != "cached_data"}
        for c in _get_demo_cubes()
    ]
