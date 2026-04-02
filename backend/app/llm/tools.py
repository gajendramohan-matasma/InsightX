"""
Tool definitions for the Claude function-calling API.

Each tool is defined in Anthropic's tool-use schema format.
The LLM service sends these as the `tools` parameter to the Messages API.
"""

TOOLS = [
    {
        "name": "query_anaplan_data",
        "description": (
            "Query financial data from Anaplan. Use this to retrieve actual financial figures, "
            "budget data, forecasts, or any data stored in Anaplan planning models. "
            "You must specify the workspace_id, model_id, and export_id for the data you need."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "workspace_id": {
                    "type": "string",
                    "description": "The Anaplan workspace ID containing the model.",
                },
                "model_id": {
                    "type": "string",
                    "description": "The Anaplan model ID containing the data.",
                },
                "export_id": {
                    "type": "string",
                    "description": "The export action ID to retrieve data from a specific view.",
                },
            },
            "required": ["workspace_id", "model_id", "export_id"],
        },
    },
    {
        "name": "query_powerbi_dataset",
        "description": (
            "Execute a DAX query against a Power BI dataset to retrieve financial data. "
            "Use this for querying existing Power BI semantic models with DAX expressions. "
            "You must know the group_id and dataset_id."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "group_id": {
                    "type": "string",
                    "description": "The Power BI workspace (group) ID.",
                },
                "dataset_id": {
                    "type": "string",
                    "description": "The Power BI dataset ID to query.",
                },
                "dax_query": {
                    "type": "string",
                    "description": (
                        "A valid DAX query expression. Use EVALUATE followed by a table expression. "
                        "Example: EVALUATE SUMMARIZECOLUMNS('Date'[Year], 'Financials'[Category], "
                        "\"Total\", SUM('Financials'[Amount]))"
                    ),
                },
            },
            "required": ["group_id", "dataset_id", "dax_query"],
        },
    },
    {
        "name": "calculate_variance",
        "description": (
            "Calculate variance analysis between actual and budget/forecast values. "
            "Returns absolute and percentage variances, identifies favorable/unfavorable items, "
            "and highlights the largest variance. Use after retrieving data from a data source."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "actual_values": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of actual financial values.",
                },
                "budget_values": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of budget/forecast values (same length as actual_values).",
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Labels for each item (e.g., month names, cost categories).",
                },
                "category": {
                    "type": "string",
                    "description": "Type of financial category for context (revenue, expense, etc.).",
                },
            },
            "required": ["actual_values", "budget_values"],
        },
    },
    {
        "name": "calculate_trend",
        "description": (
            "Perform trend analysis on a time series of financial values. "
            "Returns moving averages, period-over-period changes, trend direction, slope, "
            "and R-squared fit. Use to identify patterns over time."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "values": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of sequential financial values (chronological order).",
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Period labels (e.g., 'Q1 2024', 'Jan 2024').",
                },
                "period_type": {
                    "type": "string",
                    "enum": ["monthly", "quarterly", "yearly"],
                    "description": "Granularity of the time periods.",
                },
            },
            "required": ["values"],
        },
    },
    {
        "name": "calculate_ratios",
        "description": (
            "Calculate standard financial ratios from a set of financial figures. "
            "Computes profitability, liquidity, efficiency, and leverage ratios. "
            "Optionally compares against a benchmark or prior period."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "financial_data": {
                    "type": "object",
                    "description": (
                        "Key-value pairs of financial figures. Common keys: "
                        "revenue, cogs, gross_profit, operating_income, net_income, "
                        "total_assets, total_liabilities, total_equity, current_assets, "
                        "current_liabilities, inventory, accounts_receivable, accounts_payable."
                    ),
                },
                "comparison_data": {
                    "type": "object",
                    "description": "Same structure as financial_data for a comparison period.",
                },
            },
            "required": ["financial_data"],
        },
    },
    {
        "name": "generate_forecast",
        "description": (
            "Generate a forecast for future periods based on historical financial data. "
            "Supports linear regression, exponential smoothing, and moving average methods. "
            "Returns point forecasts with confidence intervals."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "historical_values": {
                    "type": "array",
                    "items": {"type": "number"},
                    "description": "Array of historical values in chronological order.",
                },
                "labels": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Labels for the historical periods.",
                },
                "periods_ahead": {
                    "type": "integer",
                    "description": "Number of future periods to forecast (1-24).",
                    "default": 3,
                },
                "method": {
                    "type": "string",
                    "enum": ["auto", "linear", "exponential_smoothing", "moving_average"],
                    "description": "Forecasting method. 'auto' selects the best fit.",
                    "default": "auto",
                },
                "confidence_level": {
                    "type": "number",
                    "description": "Confidence level for intervals (0.5 to 0.99).",
                    "default": 0.95,
                },
            },
            "required": ["historical_values"],
        },
    },
    {
        "name": "generate_visualization",
        "description": (
            "Generate a chart/visualization specification from data. "
            "The frontend will render this as an interactive chart. "
            "Specify the chart type, data, axes, and any configuration."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "chart_type": {
                    "type": "string",
                    "enum": ["bar", "line", "pie", "area", "scatter", "waterfall", "combo"],
                    "description": "Type of chart to generate.",
                },
                "title": {
                    "type": "string",
                    "description": "Chart title.",
                },
                "x_axis": {
                    "type": "string",
                    "description": "Label for the x-axis.",
                },
                "y_axis": {
                    "type": "string",
                    "description": "Label for the y-axis.",
                },
                "data": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Array of data point objects for the chart.",
                },
                "series": {
                    "type": "array",
                    "items": {"type": "object"},
                    "description": "Series configuration for multi-series charts.",
                },
            },
            "required": ["chart_type", "title", "data"],
        },
    },
    {
        "name": "list_available_data_sources",
        "description": (
            "List all available data sources, including Anaplan workspaces/models "
            "and Power BI workspaces/datasets. Use this when you need to discover "
            "what data is available before querying."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "source_type": {
                    "type": "string",
                    "enum": ["all", "anaplan", "powerbi"],
                    "description": "Filter by data source type.",
                    "default": "all",
                },
                "search_term": {
                    "type": "string",
                    "description": "Optional search term to filter results.",
                },
            },
            "required": [],
        },
    },
]
