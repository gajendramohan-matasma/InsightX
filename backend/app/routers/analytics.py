"""
Analytics router: direct access to analytical calculations.
These endpoints bypass the LLM and call analytics functions directly.
"""

import logging
import time

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db
from app.middleware.auth import get_current_user
from app.models.analytics_log import AnalyticsLog
from app.models.user import User
from app.schemas.analytics import (
    ForecastRequest,
    ForecastResponse,
    RatioRequest,
    RatioResponse,
    TrendRequest,
    TrendResponse,
    VarianceRequest,
    VarianceResponse,
)
from app.services.analytics_service import (
    forecast_analysis,
    ratio_analysis,
    trend_analysis,
    variance_analysis,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/variance", response_model=VarianceResponse)
async def calculate_variance(
    request: VarianceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate variance analysis between actual and budget values."""
    start = time.time()
    response = variance_analysis(request)
    latency_ms = int((time.time() - start) * 1000)

    # Log the analysis
    log = AnalyticsLog(
        analysis_type="variance",
        data_source="direct_api",
        query_params=request.dict(),
        result_summary={
            "total_variance_pct": response.total_variance_pct,
            "favorable_count": response.favorable_count,
            "unfavorable_count": response.unfavorable_count,
        },
        latency_ms=latency_ms,
    )
    db.add(log)
    await db.flush()

    return response


@router.post("/trend", response_model=TrendResponse)
async def calculate_trend(
    request: TrendRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Perform trend analysis on a time series of values."""
    start = time.time()
    response = trend_analysis(request)
    latency_ms = int((time.time() - start) * 1000)

    log = AnalyticsLog(
        analysis_type="trend",
        data_source="direct_api",
        query_params=request.dict(),
        result_summary={
            "trend_direction": response.trend_direction,
            "r_squared": response.r_squared,
            "slope": response.slope,
        },
        latency_ms=latency_ms,
    )
    db.add(log)
    await db.flush()

    return response


@router.post("/ratios", response_model=RatioResponse)
async def calculate_ratios(
    request: RatioRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Calculate financial ratios from provided data."""
    start = time.time()
    response = ratio_analysis(request)
    latency_ms = int((time.time() - start) * 1000)

    log = AnalyticsLog(
        analysis_type="ratios",
        data_source="direct_api",
        query_params=request.dict(),
        result_summary={
            "ratio_count": len(response.ratios),
            "categories": list(response.categories.keys()),
        },
        latency_ms=latency_ms,
    )
    db.add(log)
    await db.flush()

    return response


@router.post("/forecast", response_model=ForecastResponse)
async def generate_forecast(
    request: ForecastRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a forecast for future periods."""
    start = time.time()
    response = forecast_analysis(request)
    latency_ms = int((time.time() - start) * 1000)

    log = AnalyticsLog(
        analysis_type="forecast",
        data_source="direct_api",
        query_params=request.dict(),
        result_summary={
            "method_used": response.method_used,
            "periods_forecast": len(response.forecast_points),
            "model_metrics": response.model_metrics,
        },
        latency_ms=latency_ms,
    )
    db.add(log)
    await db.flush()

    return response
