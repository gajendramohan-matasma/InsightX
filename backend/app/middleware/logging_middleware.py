"""
Request/response logging middleware.

Logs every HTTP request with method, path, status code, and latency.
Optionally logs to the ErrorLog table for server errors (5xx).
"""

import logging
import time
import traceback
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.config import settings

logger = logging.getLogger("app.middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs request details and response latency.
    Assigns a unique request_id to each request for tracing.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = str(uuid.uuid4())[:8]
        request.state.request_id = request_id

        method = request.method
        path = request.url.path
        client_host = request.client.host if request.client else "unknown"

        start_time = time.time()

        try:
            response = await call_next(request)
            elapsed_ms = int((time.time() - start_time) * 1000)

            log_level = logging.INFO
            if response.status_code >= 500:
                log_level = logging.ERROR
            elif response.status_code >= 400:
                log_level = logging.WARNING

            logger.log(
                log_level,
                "[%s] %s %s -> %d (%dms) client=%s",
                request_id,
                method,
                path,
                response.status_code,
                elapsed_ms,
                client_host,
            )

            # Add request ID to response headers for client-side tracing
            response.headers["X-Request-ID"] = request_id

            # Log server errors to the database (fire-and-forget)
            if response.status_code >= 500:
                await _log_server_error(request, response.status_code, elapsed_ms)

            return response

        except Exception as exc:
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.error(
                "[%s] %s %s -> EXCEPTION (%dms): %s",
                request_id,
                method,
                path,
                elapsed_ms,
                str(exc),
            )
            raise


async def _log_server_error(request: Request, status_code: int, elapsed_ms: int) -> None:
    """
    Attempt to log a 5xx error to the error_logs table.
    This is best-effort; failures are swallowed to avoid cascading errors.
    """
    try:
        from app.models.database import async_session_factory
        from app.models.error_log import ErrorLog, ErrorSeverity

        async with async_session_factory() as session:
            error = ErrorLog(
                error_type=f"HTTP_{status_code}",
                error_message=f"{request.method} {request.url.path} returned {status_code}",
                stack_trace=None,
                severity=ErrorSeverity.HIGH if status_code >= 500 else ErrorSeverity.MEDIUM,
            )
            session.add(error)
            await session.commit()
    except Exception as e:
        logger.warning("Failed to log server error to database: %s", str(e))
