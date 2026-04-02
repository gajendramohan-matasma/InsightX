"""
FastAPI application entrypoint.
Sets up CORS, lifespan events, and includes all routers.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.database import async_engine
from app.middleware.logging_middleware import RequestLoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    - Startup: verify DB connectivity, create shared httpx client.
    - Shutdown: dispose engine, close httpx client.
    """
    # ── Startup ──────────────────────────────────────────────────
    # Verify database connectivity (non-fatal in dev)
    try:
        async with async_engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        app.state.db_available = True
    except Exception as e:
        import logging
        logging.getLogger("app").warning(f"Database not available at startup: {e}. Running without DB.")
        app.state.db_available = False

    # Shared async httpx client stored on app.state
    app.state.httpx_client = httpx.AsyncClient(
        timeout=httpx.Timeout(30.0, connect=10.0),
        limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    )

    # Auto-seed data cubes on startup
    if app.state.db_available:
        try:
            from app.models.database import async_session_factory
            from app.services.data_cube_service import seed_data_cubes
            async with async_session_factory() as session:
                await seed_data_cubes(session)
                await session.commit()
        except Exception as e:
            import logging
            logging.getLogger("app").warning(f"Data cube seeding skipped: {e}")

    yield

    # ── Shutdown ─────────────────────────────────────────────────
    await app.state.httpx_client.aclose()
    await async_engine.dispose()


def create_app() -> FastAPI:
    """Factory function that builds and configures the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered operational insights and decision support platform",
        lifespan=lifespan,
    )

    # ── CORS ─────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Custom Middleware ─────────────────────────────────────────
    app.add_middleware(RequestLoggingMiddleware)

    # ── Routers ──────────────────────────────────────────────────
    from app.routers.health import router as health_router
    from app.routers.chat import router as chat_router
    from app.routers.analytics import router as analytics_router
    from app.routers.admin import router as admin_router
    from app.routers.connectors import router as connectors_router
    from app.routers.data_cubes import router as data_cubes_router

    app.include_router(health_router)
    app.include_router(chat_router, prefix="/api/chat", tags=["Chat"])
    app.include_router(analytics_router, prefix="/api/analytics", tags=["Analytics"])
    app.include_router(admin_router, prefix="/api/admin", tags=["Admin"])
    app.include_router(connectors_router, prefix="/api/connectors", tags=["Connectors"])
    app.include_router(data_cubes_router, prefix="/api/data-cubes", tags=["Data Cubes"])

    return app


app = create_app()
