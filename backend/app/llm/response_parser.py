"""
Parse Claude's response into structured components:
  - text_blocks: narrative text from the assistant
  - visualizations: ChartSpec objects extracted from tool results
  - data_tables: structured tables from tool results
"""

import json
import logging
from typing import Any, Dict, List, Optional, Tuple

from app.schemas.chat import ChartSpec, DataTable

logger = logging.getLogger(__name__)


def parse_assistant_response(
    content_blocks: List[Dict[str, Any]],
    tool_results: Optional[List[Dict[str, Any]]] = None,
) -> Tuple[str, List[ChartSpec], List[DataTable]]:
    """
    Parse Claude's response content blocks and tool results into structured output.

    Args:
        content_blocks: The `content` array from Claude's response message.
        tool_results: Accumulated tool results from the agentic loop.

    Returns:
        Tuple of (combined_text, visualizations, data_tables).
    """
    text_parts: List[str] = []
    visualizations: List[ChartSpec] = []
    data_tables: List[DataTable] = []

    # 1. Extract text blocks from the assistant's final response
    for block in content_blocks:
        block_type = block.get("type", "")
        if block_type == "text":
            text_parts.append(block.get("text", ""))

    # 2. Extract visualizations and data tables from tool results
    if tool_results:
        for result in tool_results:
            _extract_from_tool_result(result, visualizations, data_tables)

    combined_text = "\n\n".join(text_parts).strip()
    return combined_text, visualizations, data_tables


def _extract_from_tool_result(
    result: Dict[str, Any],
    visualizations: List[ChartSpec],
    data_tables: List[DataTable],
) -> None:
    """Extract chart specs and data tables from a single tool result."""

    # Check if this is a visualization result
    if result.get("_is_visualization"):
        try:
            chart = ChartSpec(
                chart_type=result.get("chart_type", "bar"),
                title=result.get("title", ""),
                x_axis=result.get("x_axis"),
                y_axis=result.get("y_axis"),
                data=result.get("data", []),
                series=result.get("series"),
                config=result.get("config"),
            )
            visualizations.append(chart)
        except Exception as e:
            logger.warning("Failed to parse visualization: %s", e)
        return

    # Check for tabular data in query results
    if "headers" in result and "rows" in result:
        _extract_table(result, data_tables)

    if "columns" in result and "rows" in result:
        _extract_table_from_columns(result, data_tables)

    # Check for variance analysis results
    if "items" in result and isinstance(result["items"], list):
        items = result["items"]
        if items and all(
            isinstance(i, dict) and "actual" in i and "budget" in i for i in items
        ):
            _extract_variance_table(result, data_tables)

    # Check for trend analysis results
    if "values" in result and "moving_average" in result:
        _extract_trend_table(result, data_tables)

    # Check for ratio analysis results
    if "ratios" in result and isinstance(result["ratios"], list):
        _extract_ratio_table(result, data_tables)

    # Check for forecast results
    if "forecast_points" in result and isinstance(result["forecast_points"], list):
        _extract_forecast_table(result, data_tables)


def _extract_table(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract a data table from headers + rows format."""
    headers = result.get("headers", [])
    rows = result.get("rows", [])
    if headers and rows:
        tables.append(DataTable(
            title=result.get("title", "Query Results"),
            headers=headers,
            rows=rows,
        ))


def _extract_table_from_columns(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract a data table from columns + rows format (Power BI style)."""
    columns = result.get("columns", [])
    rows = result.get("rows", [])
    if columns and rows:
        tables.append(DataTable(
            title=result.get("title", "Dataset Results"),
            headers=columns,
            rows=rows,
        ))


def _extract_variance_table(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract a variance analysis as a data table."""
    items = result.get("items", [])
    headers = ["Label", "Actual", "Budget", "Variance", "Variance %"]
    rows = [
        [
            item.get("label", ""),
            item.get("actual", 0),
            item.get("budget", 0),
            item.get("variance", 0),
            item.get("variance_pct", 0),
        ]
        for item in items
    ]
    # Add totals row
    rows.append([
        "TOTAL",
        result.get("total_actual", 0),
        result.get("total_budget", 0),
        result.get("total_variance", 0),
        result.get("total_variance_pct", 0),
    ])
    tables.append(DataTable(title="Variance Analysis", headers=headers, rows=rows))


def _extract_trend_table(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract trend analysis as a data table."""
    labels = result.get("labels", [])
    values = result.get("values", [])
    ma = result.get("moving_average", [])
    pop_change = result.get("period_over_period_change", [])

    headers = ["Period", "Value", "Moving Avg", "Period Change"]
    rows = []
    for i in range(len(values)):
        rows.append([
            labels[i] if i < len(labels) else f"Period {i+1}",
            values[i],
            ma[i] if i < len(ma) else None,
            pop_change[i] if i < len(pop_change) else None,
        ])
    tables.append(DataTable(title="Trend Analysis", headers=headers, rows=rows))


def _extract_ratio_table(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract ratio analysis as a data table."""
    ratios = result.get("ratios", [])
    has_comparison = any(r.get("comparison_value") is not None for r in ratios)

    if has_comparison:
        headers = ["Ratio", "Category", "Current", "Comparison", "Change"]
        rows = [
            [
                r.get("name", ""),
                r.get("category", ""),
                r.get("value", 0),
                r.get("comparison_value"),
                r.get("change"),
            ]
            for r in ratios
        ]
    else:
        headers = ["Ratio", "Category", "Value", "Description"]
        rows = [
            [
                r.get("name", ""),
                r.get("category", ""),
                r.get("value", 0),
                r.get("description", ""),
            ]
            for r in ratios
        ]
    tables.append(DataTable(title="Financial Ratios", headers=headers, rows=rows))


def _extract_forecast_table(result: Dict[str, Any], tables: List[DataTable]) -> None:
    """Extract forecast as a data table."""
    points = result.get("forecast_points", [])
    headers = ["Period", "Forecast", "Lower Bound", "Upper Bound"]
    rows = [
        [
            p.get("label", ""),
            p.get("value", 0),
            p.get("lower_bound", 0),
            p.get("upper_bound", 0),
        ]
        for p in points
    ]
    method = result.get("method_used", "")
    confidence = result.get("confidence_level", 0.95)
    title = f"Forecast ({method}, {confidence:.0%} CI)"
    tables.append(DataTable(title=title, headers=headers, rows=rows))
