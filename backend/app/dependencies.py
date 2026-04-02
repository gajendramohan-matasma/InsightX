"""
FastAPI dependency injection providers.
"""

import logging
from typing import AsyncGenerator

import httpx
from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.database import async_session_factory

logger = logging.getLogger(__name__)


class DummySession:
    """Placeholder when DB is unavailable."""
    async def execute(self, *a, **kw):
        raise ConnectionError("Database unavailable")
    async def flush(self, *a, **kw):
        raise ConnectionError("Database unavailable")
    async def commit(self, *a, **kw):
        pass
    async def rollback(self, *a, **kw):
        pass
    async def close(self, *a, **kw):
        pass
    def add(self, *a, **kw):
        raise ConnectionError("Database unavailable")


async def get_db():
    """Yield an async database session and ensure it is closed after use."""
    session: AsyncSession = async_session_factory()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()


def get_httpx_client(request: Request) -> httpx.AsyncClient:
    """Return the shared httpx.AsyncClient from app state."""
    return request.app.state.httpx_client
