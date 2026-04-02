"""
Power BI REST API async client.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings
from app.connectors.powerbi.auth import PowerBIAuth
from app.connectors.powerbi.models import (
    PBIDAXQueryResult,
    PBIDatasetInfo,
    PBIEmbedTokenInfo,
    PBIGroupInfo,
    PBIReportInfo,
)

logger = logging.getLogger(__name__)


class PowerBIClient:
    """Async client for the Power BI REST API."""

    def __init__(
        self,
        http_client: httpx.AsyncClient,
        auth: Optional[PowerBIAuth] = None,
        base_url: Optional[str] = None,
    ):
        self._http = http_client
        self._auth = auth or PowerBIAuth()
        self._base_url = (base_url or settings.POWERBI_API_BASE_URL).rstrip("/")

    @property
    def is_configured(self) -> bool:
        return self._auth.is_configured

    # ── Helpers ──────────────────────────────────────────────────

    def _headers(self) -> Dict[str, str]:
        return self._auth.get_auth_headers()

    async def _get(self, path: str) -> Dict[str, Any]:
        headers = self._headers()
        resp = await self._http.get(f"{self._base_url}{path}", headers=headers)
        resp.raise_for_status()
        return resp.json()

    async def _post(self, path: str, json_body: Optional[Dict] = None) -> Dict[str, Any]:
        headers = self._headers()
        resp = await self._http.post(
            f"{self._base_url}{path}", headers=headers, json=json_body or {}
        )
        resp.raise_for_status()
        return resp.json()

    # ── Groups (Workspaces) ──────────────────────────────────────

    async def list_groups(self) -> List[PBIGroupInfo]:
        """List all Power BI workspaces the service principal has access to."""
        data = await self._get("/groups")
        return [
            PBIGroupInfo(
                id=g["id"],
                name=g.get("name", ""),
                is_read_only=g.get("isReadOnly", False),
                is_on_dedicated_capacity=g.get("isOnDedicatedCapacity", False),
                type=g.get("type"),
            )
            for g in data.get("value", [])
        ]

    # ── Reports ──────────────────────────────────────────────────

    async def list_reports(self, group_id: str) -> List[PBIReportInfo]:
        """List all reports in a workspace."""
        data = await self._get(f"/groups/{group_id}/reports")
        return [
            PBIReportInfo(
                id=r["id"],
                name=r.get("name", ""),
                dataset_id=r.get("datasetId"),
                web_url=r.get("webUrl"),
                embed_url=r.get("embedUrl"),
                report_type=r.get("reportType"),
            )
            for r in data.get("value", [])
        ]

    # ── Datasets ─────────────────────────────────────────────────

    async def list_datasets(self, group_id: str) -> List[PBIDatasetInfo]:
        """List all datasets in a workspace."""
        data = await self._get(f"/groups/{group_id}/datasets")
        return [
            PBIDatasetInfo(
                id=d["id"],
                name=d.get("name", ""),
                configured_by=d.get("configuredBy"),
                is_refreshable=d.get("isRefreshable", False),
                is_effective_identity_required=d.get("isEffectiveIdentityRequired", False),
                add_rows_api_enabled=d.get("addRowsAPIEnabled", False),
            )
            for d in data.get("value", [])
        ]

    # ── DAX Query ────────────────────────────────────────────────

    async def execute_dax_query(
        self, group_id: str, dataset_id: str, dax_query: str
    ) -> PBIDAXQueryResult:
        """
        Execute a DAX query against a dataset using the executeQueries REST API.
        """
        payload = {
            "queries": [{"query": dax_query}],
            "serializerSettings": {"includeNulls": True},
        }
        data = await self._post(
            f"/groups/{group_id}/datasets/{dataset_id}/executeQueries",
            json_body=payload,
        )

        results = data.get("results", [])
        if not results:
            return PBIDAXQueryResult(columns=[], rows=[], row_count=0)

        tables = results[0].get("tables", [])
        if not tables:
            return PBIDAXQueryResult(columns=[], rows=[], row_count=0)

        table = tables[0]
        raw_rows = table.get("rows", [])

        if not raw_rows:
            return PBIDAXQueryResult(columns=[], rows=[], row_count=0)

        # Extract column names from the first row's keys
        columns = list(raw_rows[0].keys()) if raw_rows else []
        parsed_rows = [list(row.values()) for row in raw_rows]

        return PBIDAXQueryResult(
            columns=columns, rows=parsed_rows, row_count=len(parsed_rows)
        )

    # ── Embed URL ────────────────────────────────────────────────

    async def get_report_embed_url(
        self, group_id: str, report_id: str
    ) -> Dict[str, str]:
        """Get the embed URL for a specific report."""
        data = await self._get(f"/groups/{group_id}/reports/{report_id}")
        return {
            "report_id": data.get("id", report_id),
            "name": data.get("name", ""),
            "embed_url": data.get("embedUrl", ""),
            "web_url": data.get("webUrl", ""),
            "dataset_id": data.get("datasetId", ""),
        }

    # ── Generate Embed Token ─────────────────────────────────────

    async def generate_embed_token(
        self, group_id: str, report_id: str
    ) -> PBIEmbedTokenInfo:
        """Generate an embed token for a report."""
        payload = {"accessLevel": "View", "allowSaveAs": False}
        data = await self._post(
            f"/groups/{group_id}/reports/{report_id}/GenerateToken",
            json_body=payload,
        )
        return PBIEmbedTokenInfo(
            token=data["token"],
            token_id=data["tokenId"],
            expiration=data["expiration"],
        )
