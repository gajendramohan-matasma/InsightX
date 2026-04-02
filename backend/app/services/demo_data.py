"""
Demo data generators for admin dashboard.
Returns realistic dummy data when DB is empty.
"""

import math
import random
import uuid
from datetime import datetime, timedelta, timezone


def _seed_random(seed_str: str) -> random.Random:
    """Create a seeded Random instance for deterministic output."""
    return random.Random(seed_str)


def generate_metrics_summary(period: str = "7d") -> dict:
    rng = _seed_random(f"metrics-{period}")
    return {
        "total_queries": rng.randint(1200, 3500),
        "total_queries_change": round(rng.uniform(-8, 18), 1),
        "avg_latency_ms": round(rng.uniform(320, 680), 0),
        "avg_latency_change": round(rng.uniform(-15, 10), 1),
        "acceptance_rate": round(rng.uniform(0.78, 0.94), 2),
        "acceptance_rate_change": round(rng.uniform(-3, 5), 1),
        "error_rate": round(rng.uniform(0.01, 0.06), 3),
        "error_rate_change": round(rng.uniform(-2, 3), 1),
        "active_users": rng.randint(28, 85),
        "active_users_change": round(rng.uniform(-5, 20), 1),
        "period": period,
    }


def generate_latency_timeseries(period: str = "7d", interval: str = "1h") -> list:
    now = datetime.now(timezone.utc)
    hours = {"24h": 24, "7d": 168, "30d": 720, "90d": 720}.get(period, 168)
    rng = _seed_random(f"latency-{period}")
    points = []
    for i in range(hours):
        ts = now - timedelta(hours=hours - i)
        hour_of_day = ts.hour
        # Business hours have higher load
        base = 400 + 150 * math.sin(hour_of_day * math.pi / 12)
        avg = base + rng.gauss(0, 40)
        points.append({
            "timestamp": ts.isoformat(),
            "avg_ms": round(max(avg, 80), 1),
            "p50_ms": round(max(avg * 0.8, 60), 1),
            "p95_ms": round(max(avg * 1.8, 200), 1),
            "p99_ms": round(max(avg * 2.5, 350), 1),
            "count": max(int(20 + 30 * math.sin(hour_of_day * math.pi / 12) + rng.gauss(0, 5)), 1),
        })
    return points


def generate_usage_breakdown(period: str = "7d") -> list:
    rng = _seed_random(f"usage-{period}")
    categories = [
        ("Financial Analysis", rng.randint(180, 450)),
        ("Budget Queries", rng.randint(120, 350)),
        ("Forecasting", rng.randint(80, 250)),
        ("Variance Analysis", rng.randint(100, 300)),
        ("Headcount Planning", rng.randint(40, 150)),
        ("Ad-hoc Queries", rng.randint(60, 200)),
    ]
    total = sum(c for _, c in categories)
    return [
        {
            "category": name,
            "count": count,
            "percentage": round(count / total * 100, 1),
            "avg_latency_ms": round(rng.uniform(250, 800), 0),
        }
        for name, count in categories
    ]


def generate_acceptance_data(period: str = "30d") -> list:
    days = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    rng = _seed_random(f"acceptance-{period}")
    now = datetime.now(timezone.utc)
    points = []
    for i in range(days):
        dt = now - timedelta(days=days - i - 1)
        total = rng.randint(20, 80)
        rate = rng.uniform(0.72, 0.95)
        accepted = int(total * rate)
        rejected = total - accepted
        points.append({
            "date": dt.strftime("%Y-%m-%d"),
            "accepted": accepted,
            "rejected": rejected,
            "total": total,
            "rate": round(accepted / total, 3),
        })
    return points


def generate_usage_heatmap(period: str = "30d") -> list:
    rng = _seed_random(f"heatmap-{period}")
    cells = []
    for day in range(7):  # 0=Mon ... 6=Sun
        for hour in range(24):
            is_business = 0 <= day <= 4 and 8 <= hour <= 17
            base = 15 if is_business else 2
            count = max(int(base + rng.gauss(0, base * 0.4)), 0)
            cells.append({"day": day, "hour": hour, "count": count})
    return cells


def generate_error_logs(page: int = 1, page_size: int = 20) -> dict:
    rng = _seed_random(f"errors-{page}")
    now = datetime.now(timezone.utc)
    error_types = [
        ("LLMTimeout", "Claude API request timed out after 30s", "critical"),
        ("ConnectorAuthFailure", "Anaplan OAuth token refresh failed: 401 Unauthorized", "error"),
        ("RateLimitExceeded", "Rate limit reached for user: 60 requests/min", "warning"),
        ("DAXQueryError", "Power BI DAX query syntax error in dataset ds-4821", "error"),
        ("DatabaseConnectionError", "Connection pool exhausted: max_overflow reached", "critical"),
        ("ValidationError", "Invalid date range: start_date > end_date in forecast request", "warning"),
        ("ExportTimeout", "Anaplan bulk export exceeded 3 minute timeout", "error"),
        ("MemoryError", "Response payload exceeded 50MB limit for variance analysis", "critical"),
        ("AuthTokenExpired", "Azure AD JWT expired during long-running analysis", "warning"),
        ("ConnectorTimeout", "Power BI API request timed out after 30s", "error"),
    ]
    total = 47
    items = []
    for i in range((page - 1) * page_size, min(page * page_size, total)):
        et = error_types[i % len(error_types)]
        items.append({
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "timestamp": (now - timedelta(hours=rng.randint(1, 500))).isoformat(),
            "level": et[2],
            "message": et[1],
            "stack_trace": f"Traceback (most recent call last):\n  File \"app/services/{et[0].lower()}.py\", line {rng.randint(20, 200)}\n{et[0]}: {et[1]}",
            "endpoint": rng.choice(["/api/chat", "/api/analytics/variance", "/api/analytics/forecast", "/api/connectors/anaplan/workspaces"]),
            "status_code": rng.choice([408, 500, 502, 429, 401]),
        })
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def generate_analytics_logs(page: int = 1, page_size: int = 20) -> dict:
    rng = _seed_random(f"analytics-{page}")
    now = datetime.now(timezone.utc)
    queries = [
        "What is the revenue variance for Q4 vs budget?",
        "Show me cost center analysis for Engineering",
        "Forecast next quarter cash flow",
        "Compare headcount across departments",
        "What are the working capital trends for 2025?",
        "Analyze gross profit margin by region",
        "Show budget vs actual for Marketing",
        "What is our DSO trend over the last 12 months?",
        "Generate variance report for EMEA region",
        "Summarize operating cash flow forecast",
    ]
    models_list = ["claude-sonnet-4-20250514", "claude-sonnet-4-20250514"]
    tools = [
        ["query_powerbi_dataset", "calculate_variance"],
        ["query_anaplan_data", "calculate_trend"],
        ["calculate_forecast"],
        ["query_anaplan_data"],
        ["query_powerbi_dataset", "calculate_ratio"],
        ["query_powerbi_dataset", "calculate_variance", "calculate_trend"],
    ]
    total = 83
    items = []
    for i in range((page - 1) * page_size, min(page * page_size, total)):
        q = queries[i % len(queries)]
        items.append({
            "id": str(uuid.UUID(int=rng.getrandbits(128))),
            "timestamp": (now - timedelta(hours=rng.randint(1, 600))).isoformat(),
            "user_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "user_email": rng.choice(["analyst@insightx.com", "admin@insightx.com", "ops.lead@insightx.com", "controller@insightx.com"]),
            "conversation_id": str(uuid.UUID(int=rng.getrandbits(128))),
            "query": q,
            "response_preview": f"Based on the analysis, {q.lower().replace('?', '')}...",
            "tools_used": rng.choice(tools),
            "latency_ms": rng.randint(200, 3500),
            "tokens_used": rng.randint(800, 6000),
            "feedback": rng.choice(["accepted", "rejected", None, "accepted", "accepted"]),
            "model": rng.choice(models_list),
        })
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def generate_connector_status() -> list:
    return [
        {
            "name": "Anaplan",
            "status": "healthy",
            "last_check": datetime.now(timezone.utc).isoformat(),
            "latency_ms": 245,
            "error_count": 0,
        },
        {
            "name": "Power BI",
            "status": "degraded",
            "last_check": datetime.now(timezone.utc).isoformat(),
            "latency_ms": 890,
            "error_count": 3,
        },
        {
            "name": "Internal Database",
            "status": "healthy",
            "last_check": datetime.now(timezone.utc).isoformat(),
            "latency_ms": 12,
            "error_count": 0,
        },
    ]
