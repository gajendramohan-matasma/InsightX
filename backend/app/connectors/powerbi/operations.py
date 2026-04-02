"""
High-level Power BI operations used by the LLM tool executor.
"""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.connectors.powerbi.auth import PowerBIAuth
from app.connectors.powerbi.client import PowerBIClient

logger = logging.getLogger(__name__)


async def query_dataset(
    http_client: httpx.AsyncClient,
    group_id: str,
    dataset_id: str,
    dax_query: str,
    auth: Optional[PowerBIAuth] = None,
) -> Dict[str, Any]:
    """
    Execute a DAX query and return structured results.
    """
    client = PowerBIClient(http_client, auth=auth)

    try:
        result = await client.execute_dax_query(group_id, dataset_id, dax_query)
        return {
            "success": True,
            "columns": result.columns,
            "rows": result.rows,
            "row_count": result.row_count,
        }
    except Exception as e:
        logger.error("Power BI DAX query failed: %s", str(e))
        return {
            "success": False,
            "error": str(e),
            "data": None,
        }


async def get_available_reports(
    http_client: httpx.AsyncClient,
    group_id: Optional[str] = None,
    auth: Optional[PowerBIAuth] = None,
) -> Dict[str, Any]:
    """
    List available reports. If no group_id, list all groups first.
    """
    client = PowerBIClient(http_client, auth=auth)

    if not group_id:
        groups = await client.list_groups()
        result: List[Dict[str, Any]] = []
        for g in groups:
            reports = await client.list_reports(g.id)
            result.append({
                "group_id": g.id,
                "group_name": g.name,
                "reports": [
                    {
                        "report_id": r.id,
                        "report_name": r.name,
                        "dataset_id": r.dataset_id,
                        "web_url": r.web_url,
                    }
                    for r in reports
                ],
            })
        return {"groups": result}

    reports = await client.list_reports(group_id)
    datasets = await client.list_datasets(group_id)
    return {
        "group_id": group_id,
        "reports": [
            {
                "report_id": r.id,
                "report_name": r.name,
                "dataset_id": r.dataset_id,
                "web_url": r.web_url,
            }
            for r in reports
        ],
        "datasets": [
            {
                "dataset_id": d.id,
                "dataset_name": d.name,
                "is_refreshable": d.is_refreshable,
            }
            for d in datasets
        ],
    }


async def get_embed_token(
    http_client: httpx.AsyncClient,
    group_id: str,
    report_id: str,
    auth: Optional[PowerBIAuth] = None,
) -> Dict[str, Any]:
    """
    Generate an embed token and return embed details for a report.
    """
    client = PowerBIClient(http_client, auth=auth)

    try:
        embed_info = await client.get_report_embed_url(group_id, report_id)
        token_info = await client.generate_embed_token(group_id, report_id)

        return {
            "success": True,
            "token": token_info.token,
            "token_id": token_info.token_id,
            "expiration": token_info.expiration,
            "embed_url": embed_info["embed_url"],
            "report_id": embed_info["report_id"],
            "report_name": embed_info["name"],
        }
    except Exception as e:
        logger.error("Power BI embed token generation failed: %s", str(e))
        return {
            "success": False,
            "error": str(e),
        }
