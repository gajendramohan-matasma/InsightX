"""
Tool execution dispatcher.

Routes tool_use blocks from Claude's response to the appropriate service functions
and returns results formatted for the next API call.
"""

import json
import logging
import time
from typing import Any, Dict, Optional

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.connectors.anaplan.operations import get_financial_data, get_model_metadata, search_available_data
from app.connectors.powerbi.operations import get_available_reports, query_dataset
from app.services.analytics_service import (
    forecast_analysis,
    ratio_analysis,
    trend_analysis,
    variance_analysis,
)
from app.schemas.analytics import (
    ForecastRequest,
    RatioRequest,
    TrendRequest,
    VarianceRequest,
)

logger = logging.getLogger(__name__)


async def execute_tool(
    tool_name: str,
    tool_input: Dict[str, Any],
    http_client: httpx.AsyncClient,
    db: Optional[AsyncSession] = None,
) -> Dict[str, Any]:
    """
    Execute a tool by name with the given input and return the result dict.

    Uses if/elif dispatching (Python 3.9 compatible).
    """
    start = time.time()
    logger.info("Executing tool: %s", tool_name)

    try:
        if tool_name == "query_anaplan_data":
            result = await _execute_query_anaplan(tool_input, http_client)

        elif tool_name == "query_powerbi_dataset":
            result = await _execute_query_powerbi(tool_input, http_client)

        elif tool_name == "calculate_variance":
            result = await _execute_variance(tool_input)

        elif tool_name == "calculate_trend":
            result = await _execute_trend(tool_input)

        elif tool_name == "calculate_ratios":
            result = await _execute_ratios(tool_input)

        elif tool_name == "generate_forecast":
            result = await _execute_forecast(tool_input)

        elif tool_name == "generate_visualization":
            result = _execute_visualization(tool_input)

        elif tool_name == "list_available_data_sources":
            result = await _execute_list_sources(tool_input, http_client)

        else:
            result = {"error": f"Unknown tool: {tool_name}"}

        elapsed_ms = int((time.time() - start) * 1000)
        logger.info("Tool %s completed in %dms", tool_name, elapsed_ms)
        result["_latency_ms"] = elapsed_ms
        return result

    except Exception as e:
        elapsed_ms = int((time.time() - start) * 1000)
        logger.error("Tool %s failed after %dms: %s", tool_name, elapsed_ms, str(e))
        return {
            "error": str(e),
            "tool_name": tool_name,
            "_latency_ms": elapsed_ms,
        }


# ── Individual tool handlers ─────────────────────────────────────

async def _execute_query_anaplan(
    params: Dict[str, Any], http_client: httpx.AsyncClient
) -> Dict[str, Any]:
    return await get_financial_data(
        http_client=http_client,
        workspace_id=params["workspace_id"],
        model_id=params["model_id"],
        export_id=params["export_id"],
    )


async def _execute_query_powerbi(
    params: Dict[str, Any], http_client: httpx.AsyncClient
) -> Dict[str, Any]:
    return await query_dataset(
        http_client=http_client,
        group_id=params["group_id"],
        dataset_id=params["dataset_id"],
        dax_query=params["dax_query"],
    )


async def _execute_variance(params: Dict[str, Any]) -> Dict[str, Any]:
    request = VarianceRequest(
        actual_values=params["actual_values"],
        budget_values=params["budget_values"],
        labels=params.get("labels"),
        category=params.get("category"),
    )
    response = variance_analysis(request)
    return response.dict()


async def _execute_trend(params: Dict[str, Any]) -> Dict[str, Any]:
    request = TrendRequest(
        values=params["values"],
        labels=params.get("labels"),
        period_type=params.get("period_type", "monthly"),
    )
    response = trend_analysis(request)
    return response.dict()


async def _execute_ratios(params: Dict[str, Any]) -> Dict[str, Any]:
    request = RatioRequest(
        financial_data=params["financial_data"],
        comparison_data=params.get("comparison_data"),
    )
    response = ratio_analysis(request)
    return response.dict()


async def _execute_forecast(params: Dict[str, Any]) -> Dict[str, Any]:
    request = ForecastRequest(
        historical_values=params["historical_values"],
        labels=params.get("labels"),
        periods_ahead=params.get("periods_ahead", 3),
        method=params.get("method", "auto"),
        confidence_level=params.get("confidence_level", 0.95),
    )
    response = forecast_analysis(request)
    return response.dict()


def _execute_visualization(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    The visualization tool simply validates and passes through the chart spec.
    The frontend renders it.
    """
    return {
        "chart_type": params["chart_type"],
        "title": params.get("title", ""),
        "x_axis": params.get("x_axis"),
        "y_axis": params.get("y_axis"),
        "data": params.get("data", []),
        "series": params.get("series"),
        "config": params.get("config"),
        "_is_visualization": True,
    }


async def _execute_list_sources(
    params: Dict[str, Any], http_client: httpx.AsyncClient
) -> Dict[str, Any]:
    source_type = params.get("source_type", "all")
    search_term = params.get("search_term")
    result: Dict[str, Any] = {"sources": []}

    if source_type in ("all", "anaplan"):
        try:
            anaplan_data = await get_model_metadata(http_client)
            result["anaplan"] = anaplan_data
        except Exception as e:
            result["anaplan"] = {"error": str(e), "available": False}

    if source_type in ("all", "powerbi"):
        try:
            powerbi_data = await get_available_reports(http_client)
            result["powerbi"] = powerbi_data
        except Exception as e:
            result["powerbi"] = {"error": str(e), "available": False}

    return result
