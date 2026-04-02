"""
Anaplan API async client.

Implements workspace/model/module/view listing and bulk-export workflow:
  1. Create an export action
  2. Run the export task
  3. Poll for completion
  4. Download CSV chunks
  5. Parse into rows
"""

import asyncio
import csv
import io
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.connectors.anaplan.auth import AnaplanAuth
from app.connectors.anaplan.models import (
    AnaplanExportResult,
    AnaplanModelInfo,
    AnaplanModuleInfo,
    AnaplanViewInfo,
    AnaplanWorkspaceInfo,
)

logger = logging.getLogger(__name__)

_POLL_INTERVAL = 2  # seconds between export-status checks
_MAX_POLL_ATTEMPTS = 90  # ~3 minutes max wait


class AnaplanClient:
    """Async client for the Anaplan Transactional / Bulk APIs."""

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        auth: Optional[AnaplanAuth] = None,
        base_url: Optional[str] = None,
    ):
        self._http = http_client
        self._auth = auth or AnaplanAuth()
        self._base_url = (base_url or settings.ANAPLAN_API_BASE_URL).rstrip("/")

    @property
    def is_configured(self) -> bool:
        return self._auth.is_configured

    # ── Helpers ──────────────────────────────────────────────────

    async def _headers(self) -> Dict[str, str]:
        return await self._auth.get_auth_headers(self._http)

    async def _get(self, path: str) -> Dict[str, Any]:
        headers = await self._headers()
        resp = await self._http.get(f"{self._base_url}{path}", headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def _post(self, path: str, json_body: Optional[Dict] = None) -> Dict[str, Any]:
        headers = await self._headers()
        resp = await self._http.post(
            f"{self._base_url}{path}", headers=headers, json=json_body or {}
        )
        resp.raise_for_status()
        return resp.json()

    # ── Workspaces ───────────────────────────────────────────────

    async def list_workspaces(self) -> List[AnaplanWorkspaceInfo]:
        data = await self._get("/workspaces")
        workspaces = data.get("workspaces", [])
        return [
            AnaplanWorkspaceInfo(
                id=w["id"],
                name=w.get("name", ""),
                active=w.get("active", True),
                size_allowance=w.get("sizeAllowance"),
                current_size=w.get("currentSize"),
            )
            for w in workspaces
        ]

    # ── Models ───────────────────────────────────────────────────

    async def list_models(self, workspace_id: str) -> List[AnaplanModelInfo]:
        data = await self._get(f"/workspaces/{workspace_id}/models")
        models = data.get("models", [])
        return [
            AnaplanModelInfo(
                id=m["id"],
                name=m.get("name", ""),
                active_state=m.get("activeState"),
                last_saved_serial_number=m.get("lastSavedSerialNumber"),
                memory_usage=m.get("memoryUsage"),
                category=m.get("category"),
                current_workspace_id=workspace_id,
            )
            for m in models
        ]

    # ── Modules ──────────────────────────────────────────────────

    async def list_modules(
        self, workspace_id: str, model_id: str
    ) -> List[AnaplanModuleInfo]:
        data = await self._get(
            f"/workspaces/{workspace_id}/models/{model_id}/modules"
        )
        modules = data.get("modules", [])
        return [
            AnaplanModuleInfo(id=m["id"], name=m.get("name", ""))
            for m in modules
        ]

    # ── Views ────────────────────────────────────────────────────

    async def list_views(
        self, workspace_id: str, model_id: str, module_id: str
    ) -> List[AnaplanViewInfo]:
        data = await self._get(
            f"/workspaces/{workspace_id}/models/{model_id}/modules/{module_id}/views"
        )
        views = data.get("views", [])
        return [
            AnaplanViewInfo(id=v["id"], name=v.get("name", ""), module_id=module_id)
            for v in views
        ]

    # ── Bulk Export Workflow ──────────────────────────────────────

    async def export_view_data(
        self,
        workspace_id: str,
        model_id: str,
        export_id: str,
    ) -> AnaplanExportResult:
        """
        Run a bulk-export action end-to-end:
          POST to create/run the task -> poll until COMPLETE -> download CSV -> parse
        """
        base = f"/workspaces/{workspace_id}/models/{model_id}"

        # 1. Create / run the export task
        logger.info("Starting Anaplan export %s", export_id)
        run_resp = await self._post(
            f"{base}/exports/{export_id}/tasks",
            json_body={"localeName": "en_US"},
        )
        task_id = run_resp.get("task", {}).get("taskId") or run_resp.get("taskId", "")
        if not task_id:
            return AnaplanExportResult(
                success=False, failure_reason="No task ID returned from export run."
            )

        # 2. Poll for completion
        for _attempt in range(_MAX_POLL_ATTEMPTS):
            status_resp = await self._get(
                f"{base}/exports/{export_id}/tasks/{task_id}"
            )
            task_info = status_resp.get("task", status_resp)
            state = task_info.get("taskState", "UNKNOWN")

            if state == "COMPLETE":
                break
            elif state in ("FAILED", "CANCELLED"):
                reason = task_info.get("result", {}).get("failureDumpAvailable", "Unknown error")
                return AnaplanExportResult(success=False, failure_reason=str(reason))

            await asyncio.sleep(_POLL_INTERVAL)
        else:
            return AnaplanExportResult(
                success=False, failure_reason="Export timed out after polling."
            )

        # 3. Download chunks (Anaplan splits large exports)
        chunks_resp = await self._get(
            f"{base}/exports/{export_id}/tasks/{task_id}/chunks"
        )
        chunks = chunks_resp.get("chunks", [])
        csv_parts: List[str] = []

        for chunk in chunks:
            chunk_id = chunk["id"]
            headers = await self._headers()
            headers["Accept"] = "application/octet-stream"
            chunk_resp = await self._http.get(
                f"{self._base_url}{base}/exports/{export_id}/tasks/{task_id}/chunks/{chunk_id}",
                headers=headers,
            )
            chunk_resp.raise_for_status()
            csv_parts.append(chunk_resp.text)

        # 4. Parse CSV
        full_csv = "".join(csv_parts)
        return self._parse_csv(full_csv)

    @staticmethod
    def _parse_csv(csv_text: str) -> AnaplanExportResult:
        """Parse CSV text into structured export result."""
        if not csv_text.strip():
            return AnaplanExportResult(success=True, row_count=0)

        reader = csv.reader(io.StringIO(csv_text))
        rows_raw = list(reader)

        if not rows_raw:
            return AnaplanExportResult(success=True, row_count=0)

        headers = rows_raw[0]
        data_rows: List[List[Any]] = []

        for row in rows_raw[1:]:
            parsed_row: List[Any] = []
            for cell in row:
                # Try to convert numeric strings
                try:
                    val = float(cell.replace(",", ""))
                    if val == int(val):
                        parsed_row.append(int(val))
                    else:
                        parsed_row.append(val)
                except (ValueError, AttributeError):
                    parsed_row.append(cell)
            data_rows.append(parsed_row)

        return AnaplanExportResult(
            success=True,
            headers=headers,
            rows=data_rows,
            row_count=len(data_rows),
        )
