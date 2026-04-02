"""
Data Cube service: CRUD operations and seed data generation.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.data_cube import DataCube, DataCubeStatus

logger = logging.getLogger(__name__)


async def list_data_cubes(db: AsyncSession) -> List[DataCube]:
    result = await db.execute(select(DataCube).order_by(DataCube.name))
    return list(result.scalars().all())


async def get_data_cube(db: AsyncSession, cube_id: str) -> Optional[DataCube]:
    result = await db.execute(
        select(DataCube).where(DataCube.id == uuid.UUID(cube_id))
    )
    return result.scalar_one_or_none()


async def get_cube_data(
    db: AsyncSession, cube_id: str, limit: int = 50, offset: int = 0
) -> Optional[dict]:
    cube = await get_data_cube(db, cube_id)
    if not cube:
        return None
    rows = cube.cached_data or []
    columns = [col["name"] for col in (cube.schema_definition or [])]
    return {
        "columns": columns,
        "rows": rows[offset : offset + limit],
        "total": len(rows),
        "limit": limit,
        "offset": offset,
    }


async def refresh_data_cube(db: AsyncSession, cube_id: str) -> Optional[DataCube]:
    cube = await get_data_cube(db, cube_id)
    if not cube:
        return None
    cube.last_refreshed_at = datetime.now(timezone.utc)
    cube.status = DataCubeStatus.ACTIVE
    await db.flush()
    return cube


async def seed_data_cubes(db: AsyncSession) -> List[DataCube]:
    """Create demo data cubes if none exist."""
    result = await db.execute(select(DataCube).limit(1))
    if result.scalar_one_or_none():
        return []

    now = datetime.now(timezone.utc)
    cubes_data = _get_seed_cubes(now)

    cubes = []
    for cd in cubes_data:
        cube = DataCube(**cd)
        db.add(cube)
        cubes.append(cube)

    await db.flush()
    logger.info("Seeded %d data cubes", len(cubes))
    return cubes


def _get_seed_cubes(now: datetime) -> list:
    return [
        {
            "name": "Revenue by Region",
            "description": "Quarterly revenue breakdown across global regions with YoY growth rates. Source: Power BI financial reporting dataset.",
            "source": "powerbi",
            "status": DataCubeStatus.ACTIVE,
            "config": {"source_type": "dax_query", "query": "EVALUATE SUMMARIZECOLUMNS(Region[Name], Calendar[Quarter], 'Revenue'[Amount])"},
            "schema_definition": [
                {"name": "region", "type": "string", "description": "Geographic region"},
                {"name": "quarter", "type": "string", "description": "Fiscal quarter"},
                {"name": "revenue", "type": "currency", "description": "Revenue in USD"},
                {"name": "yoy_growth", "type": "percentage", "description": "Year-over-year growth"},
            ],
            "refresh_schedule": "daily",
            "last_refreshed_at": now - timedelta(hours=3),
            "row_count": 24,
            "cached_data": _revenue_by_region(),
        },
        {
            "name": "Cost Center Analysis",
            "description": "Department-level budget allocation vs actual spend with variance tracking. Source: Anaplan cost management model.",
            "source": "anaplan",
            "status": DataCubeStatus.ACTIVE,
            "config": {"source_type": "export", "export_name": "Cost Center Budget vs Actual"},
            "schema_definition": [
                {"name": "cost_center", "type": "string", "description": "Cost center code"},
                {"name": "department", "type": "string", "description": "Department name"},
                {"name": "budget", "type": "currency", "description": "Budgeted amount"},
                {"name": "actual", "type": "currency", "description": "Actual spend"},
                {"name": "variance", "type": "currency", "description": "Budget variance"},
                {"name": "variance_pct", "type": "percentage", "description": "Variance %"},
            ],
            "refresh_schedule": "daily",
            "last_refreshed_at": now - timedelta(hours=6),
            "row_count": 15,
            "cached_data": _cost_center_data(),
        },
        {
            "name": "Budget vs Actual",
            "description": "Half-yearly budget vs actual comparison across major spend categories. Source: Anaplan budget model.",
            "source": "anaplan",
            "status": DataCubeStatus.ACTIVE,
            "config": {"source_type": "export", "export_name": "Budget vs Actual Summary"},
            "schema_definition": [
                {"name": "category", "type": "string", "description": "Spend category"},
                {"name": "period", "type": "string", "description": "Fiscal period"},
                {"name": "budget_amount", "type": "currency", "description": "Budget"},
                {"name": "actual_amount", "type": "currency", "description": "Actual"},
                {"name": "variance", "type": "currency", "description": "Variance"},
            ],
            "refresh_schedule": "daily",
            "last_refreshed_at": now - timedelta(hours=1),
            "row_count": 20,
            "cached_data": _budget_vs_actual(),
        },
        {
            "name": "Cash Flow Forecast",
            "description": "Monthly cash flow projections including operating, investing, and financing activities. Source: Power BI treasury dataset.",
            "source": "powerbi",
            "status": DataCubeStatus.ACTIVE,
            "config": {"source_type": "dax_query", "query": "EVALUATE CashFlow[Monthly]"},
            "schema_definition": [
                {"name": "month", "type": "string", "description": "Calendar month"},
                {"name": "operating_cf", "type": "currency", "description": "Operating cash flow"},
                {"name": "investing_cf", "type": "currency", "description": "Investing cash flow"},
                {"name": "financing_cf", "type": "currency", "description": "Financing cash flow"},
                {"name": "net_cf", "type": "currency", "description": "Net cash flow"},
                {"name": "cumulative", "type": "currency", "description": "Cumulative cash flow"},
            ],
            "refresh_schedule": "hourly",
            "last_refreshed_at": now - timedelta(minutes=45),
            "row_count": 12,
            "cached_data": _cash_flow_data(),
        },
        {
            "name": "Headcount by Department",
            "description": "Current headcount, contractor count, and open positions by department. Source: Manual HR upload.",
            "source": "manual",
            "status": DataCubeStatus.ACTIVE,
            "config": {"source_type": "csv_upload"},
            "schema_definition": [
                {"name": "department", "type": "string", "description": "Department"},
                {"name": "headcount", "type": "number", "description": "Full-time employees"},
                {"name": "contractors", "type": "number", "description": "Contract workers"},
                {"name": "open_positions", "type": "number", "description": "Open reqs"},
                {"name": "avg_tenure_years", "type": "number", "description": "Avg tenure (yrs)"},
            ],
            "refresh_schedule": "manual",
            "last_refreshed_at": now - timedelta(days=2),
            "row_count": 10,
            "cached_data": _headcount_data(),
        },
        {
            "name": "Working Capital Metrics",
            "description": "Monthly working capital components and efficiency metrics (DSO, DPO). Source: Power BI finance dataset.",
            "source": "powerbi",
            "status": DataCubeStatus.INACTIVE,
            "config": {"source_type": "dax_query", "query": "EVALUATE WorkingCapital[Monthly]"},
            "schema_definition": [
                {"name": "month", "type": "string", "description": "Calendar month"},
                {"name": "accounts_receivable", "type": "currency", "description": "AR balance"},
                {"name": "accounts_payable", "type": "currency", "description": "AP balance"},
                {"name": "inventory", "type": "currency", "description": "Inventory value"},
                {"name": "working_capital", "type": "currency", "description": "Net working capital"},
                {"name": "dso", "type": "number", "description": "Days Sales Outstanding"},
                {"name": "dpo", "type": "number", "description": "Days Payable Outstanding"},
            ],
            "refresh_schedule": "daily",
            "last_refreshed_at": now - timedelta(days=5),
            "row_count": 12,
            "cached_data": _working_capital_data(),
        },
    ]


def _revenue_by_region() -> list:
    regions = ["North America", "EMEA", "APAC", "Latin America"]
    quarters = ["FY25 Q1", "FY25 Q2", "FY25 Q3", "FY25 Q4", "FY26 Q1", "FY26 Q2"]
    base = {"North America": 165, "EMEA": 92, "APAC": 68, "Latin America": 45}
    rows = []
    for q_i, q in enumerate(quarters):
        for r in regions:
            b = base[r]
            rev = round(b * (1 + q_i * 0.03 + (hash(r + q) % 10 - 5) * 0.01), 1)
            yoy = round((hash(r + q) % 20 - 4) * 0.5, 1)
            rows.append({"region": r, "quarter": q, "revenue": rev * 1_000_000, "yoy_growth": yoy})
    return rows


def _cost_center_data() -> list:
    departments = [
        ("CC-1001", "Engineering", 8500000),
        ("CC-1002", "Sales", 6200000),
        ("CC-1003", "Marketing", 4100000),
        ("CC-1004", "Operations", 5800000),
        ("CC-1005", "Finance", 2900000),
        ("CC-1006", "Human Resources", 1800000),
        ("CC-1007", "Legal", 2100000),
        ("CC-1008", "IT Infrastructure", 3400000),
        ("CC-1009", "R&D", 7200000),
        ("CC-1010", "Supply Chain", 4600000),
        ("CC-1011", "Customer Success", 2300000),
        ("CC-1012", "Product", 3800000),
        ("CC-1013", "Quality", 1500000),
        ("CC-1014", "Facilities", 1200000),
        ("CC-1015", "Executive", 2800000),
    ]
    rows = []
    for cc, dept, budget in departments:
        var_pct = round((hash(cc) % 20 - 8) * 0.7, 1)
        actual = round(budget * (1 + var_pct / 100))
        variance = actual - budget
        rows.append({
            "cost_center": cc,
            "department": dept,
            "budget": budget,
            "actual": actual,
            "variance": variance,
            "variance_pct": var_pct,
        })
    return rows


def _budget_vs_actual() -> list:
    categories = [
        "Personnel", "Technology", "Marketing", "Travel", "Facilities",
        "Professional Services", "Training", "Equipment", "Software Licenses", "Contingency",
    ]
    periods = ["H1 2025", "H2 2025"]
    rows = []
    for cat in categories:
        for period in periods:
            budget = round((hash(cat + period) % 50 + 10) * 100000)
            var = round((hash(cat + period + "v") % 16 - 6) * 0.8, 1)
            actual = round(budget * (1 + var / 100))
            rows.append({
                "category": cat,
                "period": period,
                "budget_amount": budget,
                "actual_amount": actual,
                "variance": actual - budget,
            })
    return rows


def _cash_flow_data() -> list:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    cumulative = 0
    rows = []
    for i, m in enumerate(months):
        operating = round(15_000_000 + i * 2_500_000 + (hash(m) % 8 - 4) * 1_000_000)
        investing = round(-5_000_000 - (hash(m + "i") % 5) * 1_000_000)
        financing = round(-3_000_000 + (hash(m + "f") % 6 - 3) * 500_000)
        net = operating + investing + financing
        cumulative += net
        rows.append({
            "month": f"{m} 2026",
            "operating_cf": operating,
            "investing_cf": investing,
            "financing_cf": financing,
            "net_cf": net,
            "cumulative": cumulative,
        })
    return rows


def _headcount_data() -> list:
    departments = [
        ("Engineering", 450, 85, 25, 4.2),
        ("Sales", 320, 45, 18, 3.1),
        ("Marketing", 180, 32, 8, 3.8),
        ("Operations", 290, 60, 12, 5.1),
        ("Finance", 95, 15, 5, 6.3),
        ("Human Resources", 55, 8, 3, 4.8),
        ("IT Infrastructure", 120, 40, 10, 3.5),
        ("R&D", 210, 30, 15, 4.6),
        ("Supply Chain", 175, 25, 7, 5.5),
        ("Customer Success", 85, 12, 6, 2.9),
    ]
    return [
        {
            "department": d[0],
            "headcount": d[1],
            "contractors": d[2],
            "open_positions": d[3],
            "avg_tenure_years": d[4],
        }
        for d in departments
    ]


def _working_capital_data() -> list:
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    rows = []
    for i, m in enumerate(months):
        ar = round(85_000_000 + (hash(m + "ar") % 20 - 10) * 2_000_000)
        ap = round(52_000_000 + (hash(m + "ap") % 15 - 7) * 1_500_000)
        inv = round(38_000_000 + (hash(m + "inv") % 12 - 6) * 1_000_000)
        wc = ar + inv - ap
        dso = round(42 + (hash(m + "dso") % 10 - 5) * 1.2, 0)
        dpo = round(35 + (hash(m + "dpo") % 10 - 5) * 1.0, 0)
        rows.append({
            "month": f"{m} 2025",
            "accounts_receivable": ar,
            "accounts_payable": ap,
            "inventory": inv,
            "working_capital": wc,
            "dso": dso,
            "dpo": dpo,
        })
    return rows
