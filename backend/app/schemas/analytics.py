"""
Analytics-related Pydantic schemas for variance, trend, ratio, and forecast analysis.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Variance Analysis ────────────────────────────────────────────

class VarianceRequest(BaseModel):
    actual_values: List[float] = Field(..., min_length=1)
    budget_values: List[float] = Field(..., min_length=1)
    labels: Optional[List[str]] = None
    period: Optional[str] = None
    category: Optional[str] = None


class VarianceItem(BaseModel):
    label: str
    actual: float
    budget: float
    variance: float
    variance_pct: float


class VarianceResponse(BaseModel):
    items: List[VarianceItem]
    total_actual: float
    total_budget: float
    total_variance: float
    total_variance_pct: float
    favorable_count: int
    unfavorable_count: int
    largest_variance: Optional[VarianceItem] = None


# ── Trend Analysis ───────────────────────────────────────────────

class TrendRequest(BaseModel):
    values: List[float] = Field(..., min_length=2)
    labels: Optional[List[str]] = None
    period_type: Optional[str] = Field(default="monthly", description="monthly, quarterly, yearly")


class TrendResponse(BaseModel):
    labels: List[str]
    values: List[float]
    moving_average: List[Optional[float]]
    period_over_period_change: List[Optional[float]]
    period_over_period_change_pct: List[Optional[float]]
    trend_direction: str  # "up", "down", "flat"
    slope: float
    r_squared: float
    average: float
    std_dev: float
    min_value: float
    max_value: float
    cagr: Optional[float] = None


# ── Ratio Analysis ───────────────────────────────────────────────

class RatioRequest(BaseModel):
    financial_data: Dict[str, float] = Field(
        ...,
        description="Key financial figures, e.g. revenue, cogs, net_income, total_assets, etc.",
    )
    comparison_data: Optional[Dict[str, float]] = Field(
        default=None,
        description="Same structure for a comparison period or benchmark.",
    )


class RatioResult(BaseModel):
    name: str
    value: float
    category: str  # profitability, liquidity, efficiency, leverage
    description: str
    comparison_value: Optional[float] = None
    change: Optional[float] = None


class RatioResponse(BaseModel):
    ratios: List[RatioResult]
    categories: Dict[str, List[RatioResult]]


# ── Forecast Analysis ────────────────────────────────────────────

class ForecastRequest(BaseModel):
    historical_values: List[float] = Field(..., min_length=3)
    labels: Optional[List[str]] = None
    periods_ahead: int = Field(default=3, ge=1, le=24)
    method: Optional[str] = Field(
        default="auto",
        description="auto, linear, exponential_smoothing, moving_average",
    )
    confidence_level: float = Field(default=0.95, ge=0.5, le=0.99)


class ForecastPoint(BaseModel):
    label: str
    value: float
    lower_bound: float
    upper_bound: float


class ForecastResponse(BaseModel):
    historical_labels: List[str]
    historical_values: List[float]
    forecast_points: List[ForecastPoint]
    method_used: str
    confidence_level: float
    model_metrics: Dict[str, Any] = Field(default_factory=dict)
