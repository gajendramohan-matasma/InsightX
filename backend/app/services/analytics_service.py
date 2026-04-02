"""
Financial analytics calculations using pandas, numpy, and scipy.

Implements:
  - Variance analysis
  - Trend analysis (linear regression, moving averages)
  - Financial ratio analysis
  - Forecasting (linear, exponential smoothing, moving average)
"""

import logging
import math
from typing import Dict, List, Optional

import numpy as np
import pandas as pd
from scipy import stats as scipy_stats

from app.schemas.analytics import (
    ForecastPoint,
    ForecastRequest,
    ForecastResponse,
    RatioRequest,
    RatioResponse,
    RatioResult,
    TrendRequest,
    TrendResponse,
    VarianceItem,
    VarianceRequest,
    VarianceResponse,
)

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# VARIANCE ANALYSIS
# ═══════════════════════════════════════════════════════════════════

def variance_analysis(request: VarianceRequest) -> VarianceResponse:
    """
    Compare actual values against budget values.
    Positive variance = favorable (actuals exceed budget for revenue).
    """
    actuals = np.array(request.actual_values, dtype=np.float64)
    budgets = np.array(request.budget_values, dtype=np.float64)

    # Ensure same length
    min_len = min(len(actuals), len(budgets))
    actuals = actuals[:min_len]
    budgets = budgets[:min_len]

    variances = actuals - budgets
    variance_pcts = np.where(budgets != 0, (variances / np.abs(budgets)) * 100, 0.0)

    labels = request.labels or [f"Item {i+1}" for i in range(min_len)]
    labels = labels[:min_len]

    items: List[VarianceItem] = []
    for i in range(min_len):
        items.append(VarianceItem(
            label=labels[i],
            actual=float(actuals[i]),
            budget=float(budgets[i]),
            variance=float(variances[i]),
            variance_pct=round(float(variance_pcts[i]), 2),
        ))

    total_actual = float(np.sum(actuals))
    total_budget = float(np.sum(budgets))
    total_variance = total_actual - total_budget
    total_variance_pct = (
        round((total_variance / abs(total_budget)) * 100, 2)
        if total_budget != 0
        else 0.0
    )

    favorable_count = int(np.sum(variances >= 0))
    unfavorable_count = int(np.sum(variances < 0))

    # Find largest absolute variance
    abs_variances = np.abs(variances)
    largest_idx = int(np.argmax(abs_variances))

    return VarianceResponse(
        items=items,
        total_actual=round(total_actual, 2),
        total_budget=round(total_budget, 2),
        total_variance=round(total_variance, 2),
        total_variance_pct=total_variance_pct,
        favorable_count=favorable_count,
        unfavorable_count=unfavorable_count,
        largest_variance=items[largest_idx] if items else None,
    )


# ═══════════════════════════════════════════════════════════════════
# TREND ANALYSIS
# ═══════════════════════════════════════════════════════════════════

def trend_analysis(request: TrendRequest) -> TrendResponse:
    """
    Analyze a time series: linear regression, moving averages,
    period-over-period changes, and summary statistics.
    """
    values = np.array(request.values, dtype=np.float64)
    n = len(values)
    labels = request.labels or [f"Period {i+1}" for i in range(n)]
    labels = labels[:n]

    x = np.arange(n, dtype=np.float64)

    # Linear regression
    slope_val, intercept, r_value, p_value, std_err = scipy_stats.linregress(x, values)
    r_squared = r_value ** 2

    # Moving average (window=3 or smaller if series is short)
    window = min(3, n)
    series = pd.Series(values)
    ma_series = series.rolling(window=window, min_periods=1).mean()
    moving_avg: List[Optional[float]] = [
        round(float(v), 2) if not math.isnan(v) else None
        for v in ma_series
    ]

    # Period-over-period change
    pop_change: List[Optional[float]] = [None]
    pop_change_pct: List[Optional[float]] = [None]
    for i in range(1, n):
        change = float(values[i] - values[i - 1])
        pop_change.append(round(change, 2))
        if values[i - 1] != 0:
            pct = (change / abs(float(values[i - 1]))) * 100
            pop_change_pct.append(round(pct, 2))
        else:
            pop_change_pct.append(None)

    # Trend direction
    if slope_val > 0.01 * np.mean(np.abs(values)):
        direction = "up"
    elif slope_val < -0.01 * np.mean(np.abs(values)):
        direction = "down"
    else:
        direction = "flat"

    # CAGR (if more than 1 period and first value > 0)
    cagr = None
    if n > 1 and values[0] > 0 and values[-1] > 0:
        cagr = round(((values[-1] / values[0]) ** (1.0 / (n - 1)) - 1) * 100, 2)

    return TrendResponse(
        labels=list(labels),
        values=[round(float(v), 2) for v in values],
        moving_average=moving_avg,
        period_over_period_change=pop_change,
        period_over_period_change_pct=pop_change_pct,
        trend_direction=direction,
        slope=round(float(slope_val), 4),
        r_squared=round(float(r_squared), 4),
        average=round(float(np.mean(values)), 2),
        std_dev=round(float(np.std(values, ddof=1)) if n > 1 else 0.0, 2),
        min_value=round(float(np.min(values)), 2),
        max_value=round(float(np.max(values)), 2),
        cagr=cagr,
    )


# ═══════════════════════════════════════════════════════════════════
# RATIO ANALYSIS
# ═══════════════════════════════════════════════════════════════════

def ratio_analysis(request: RatioRequest) -> RatioResponse:
    """
    Calculate standard financial ratios from provided financial data.
    Groups into profitability, liquidity, efficiency, and leverage categories.
    """
    d = request.financial_data
    c = request.comparison_data

    ratios: List[RatioResult] = []

    # ── Profitability Ratios ─────────────────────────────────────
    revenue = d.get("revenue", 0)
    cogs = d.get("cogs", 0)
    gross_profit = d.get("gross_profit", revenue - cogs if revenue else 0)
    operating_income = d.get("operating_income", 0)
    net_income = d.get("net_income", 0)
    total_equity = d.get("total_equity", 0)
    total_assets = d.get("total_assets", 0)

    if revenue:
        gpm = _safe_ratio(gross_profit, revenue) * 100
        comp_gpm = _safe_ratio(
            c.get("gross_profit", c.get("revenue", 0) - c.get("cogs", 0)),
            c.get("revenue", 0),
        ) * 100 if c and c.get("revenue") else None
        ratios.append(RatioResult(
            name="Gross Profit Margin",
            value=round(gpm, 2),
            category="profitability",
            description="Gross profit as a percentage of revenue",
            comparison_value=round(comp_gpm, 2) if comp_gpm is not None else None,
            change=round(gpm - comp_gpm, 2) if comp_gpm is not None else None,
        ))

        opm = _safe_ratio(operating_income, revenue) * 100
        comp_opm = _safe_ratio(
            c.get("operating_income", 0), c.get("revenue", 0)
        ) * 100 if c and c.get("revenue") else None
        ratios.append(RatioResult(
            name="Operating Profit Margin",
            value=round(opm, 2),
            category="profitability",
            description="Operating income as a percentage of revenue",
            comparison_value=round(comp_opm, 2) if comp_opm is not None else None,
            change=round(opm - comp_opm, 2) if comp_opm is not None else None,
        ))

        npm = _safe_ratio(net_income, revenue) * 100
        comp_npm = _safe_ratio(
            c.get("net_income", 0), c.get("revenue", 0)
        ) * 100 if c and c.get("revenue") else None
        ratios.append(RatioResult(
            name="Net Profit Margin",
            value=round(npm, 2),
            category="profitability",
            description="Net income as a percentage of revenue",
            comparison_value=round(comp_npm, 2) if comp_npm is not None else None,
            change=round(npm - comp_npm, 2) if comp_npm is not None else None,
        ))

    if total_equity:
        roe = _safe_ratio(net_income, total_equity) * 100
        comp_roe = _safe_ratio(
            c.get("net_income", 0), c.get("total_equity", 0)
        ) * 100 if c and c.get("total_equity") else None
        ratios.append(RatioResult(
            name="Return on Equity (ROE)",
            value=round(roe, 2),
            category="profitability",
            description="Net income divided by shareholders' equity",
            comparison_value=round(comp_roe, 2) if comp_roe is not None else None,
            change=round(roe - comp_roe, 2) if comp_roe is not None else None,
        ))

    if total_assets:
        roa = _safe_ratio(net_income, total_assets) * 100
        comp_roa = _safe_ratio(
            c.get("net_income", 0), c.get("total_assets", 0)
        ) * 100 if c and c.get("total_assets") else None
        ratios.append(RatioResult(
            name="Return on Assets (ROA)",
            value=round(roa, 2),
            category="profitability",
            description="Net income divided by total assets",
            comparison_value=round(comp_roa, 2) if comp_roa is not None else None,
            change=round(roa - comp_roa, 2) if comp_roa is not None else None,
        ))

    # ── Liquidity Ratios ─────────────────────────────────────────
    current_assets = d.get("current_assets", 0)
    current_liabilities = d.get("current_liabilities", 0)
    inventory = d.get("inventory", 0)

    if current_liabilities:
        cr = _safe_ratio(current_assets, current_liabilities)
        comp_cr = _safe_ratio(
            c.get("current_assets", 0), c.get("current_liabilities", 0)
        ) if c and c.get("current_liabilities") else None
        ratios.append(RatioResult(
            name="Current Ratio",
            value=round(cr, 2),
            category="liquidity",
            description="Current assets divided by current liabilities",
            comparison_value=round(comp_cr, 2) if comp_cr is not None else None,
            change=round(cr - comp_cr, 2) if comp_cr is not None else None,
        ))

        qr = _safe_ratio(current_assets - inventory, current_liabilities)
        comp_qr = _safe_ratio(
            c.get("current_assets", 0) - c.get("inventory", 0),
            c.get("current_liabilities", 0),
        ) if c and c.get("current_liabilities") else None
        ratios.append(RatioResult(
            name="Quick Ratio",
            value=round(qr, 2),
            category="liquidity",
            description="(Current assets - inventory) / current liabilities",
            comparison_value=round(comp_qr, 2) if comp_qr is not None else None,
            change=round(qr - comp_qr, 2) if comp_qr is not None else None,
        ))

    # ── Efficiency Ratios ────────────────────────────────────────
    accounts_receivable = d.get("accounts_receivable", 0)
    accounts_payable = d.get("accounts_payable", 0)

    if revenue and accounts_receivable:
        ar_turnover = _safe_ratio(revenue, accounts_receivable)
        dso = _safe_ratio(365, ar_turnover) if ar_turnover else 0
        ratios.append(RatioResult(
            name="Days Sales Outstanding",
            value=round(dso, 1),
            category="efficiency",
            description="Average number of days to collect receivables",
        ))

    if cogs and inventory:
        inv_turnover = _safe_ratio(cogs, inventory)
        dio = _safe_ratio(365, inv_turnover) if inv_turnover else 0
        ratios.append(RatioResult(
            name="Days Inventory Outstanding",
            value=round(dio, 1),
            category="efficiency",
            description="Average number of days inventory is held",
        ))

    if total_assets and revenue:
        asset_turnover = _safe_ratio(revenue, total_assets)
        ratios.append(RatioResult(
            name="Asset Turnover",
            value=round(asset_turnover, 2),
            category="efficiency",
            description="Revenue generated per dollar of assets",
        ))

    # ── Leverage Ratios ──────────────────────────────────────────
    total_liabilities = d.get("total_liabilities", 0)

    if total_equity and total_liabilities:
        de = _safe_ratio(total_liabilities, total_equity)
        comp_de = _safe_ratio(
            c.get("total_liabilities", 0), c.get("total_equity", 0)
        ) if c and c.get("total_equity") else None
        ratios.append(RatioResult(
            name="Debt-to-Equity Ratio",
            value=round(de, 2),
            category="leverage",
            description="Total liabilities divided by total equity",
            comparison_value=round(comp_de, 2) if comp_de is not None else None,
            change=round(de - comp_de, 2) if comp_de is not None else None,
        ))

    if total_assets:
        equity_multiplier = _safe_ratio(total_assets, total_equity) if total_equity else 0
        ratios.append(RatioResult(
            name="Equity Multiplier",
            value=round(equity_multiplier, 2),
            category="leverage",
            description="Total assets divided by total equity",
        ))

    # Group by category
    categories: Dict[str, List[RatioResult]] = {}
    for r in ratios:
        categories.setdefault(r.category, []).append(r)

    return RatioResponse(ratios=ratios, categories=categories)


def _safe_ratio(numerator: float, denominator: float) -> float:
    """Division that returns 0 when denominator is 0."""
    if denominator == 0:
        return 0.0
    return numerator / denominator


# ═══════════════════════════════════════════════════════════════════
# FORECAST ANALYSIS
# ═══════════════════════════════════════════════════════════════════

def forecast_analysis(request: ForecastRequest) -> ForecastResponse:
    """
    Generate forecasts using the requested method with confidence intervals.
    Auto-selects the best method if method='auto'.
    """
    values = np.array(request.historical_values, dtype=np.float64)
    n = len(values)
    periods = request.periods_ahead
    confidence = request.confidence_level

    labels = request.labels or [f"Period {i+1}" for i in range(n)]
    labels = labels[:n]

    method = request.method
    if method == "auto":
        method = _select_best_method(values)

    if method == "linear":
        forecast_vals, lower, upper, metrics = _forecast_linear(values, periods, confidence)
    elif method == "exponential_smoothing":
        forecast_vals, lower, upper, metrics = _forecast_exponential_smoothing(values, periods, confidence)
    elif method == "moving_average":
        forecast_vals, lower, upper, metrics = _forecast_moving_average(values, periods, confidence)
    else:
        # Default to linear
        forecast_vals, lower, upper, metrics = _forecast_linear(values, periods, confidence)
        method = "linear"

    # Generate labels for forecast periods
    forecast_labels = _generate_forecast_labels(labels, periods)

    forecast_points = [
        ForecastPoint(
            label=forecast_labels[i],
            value=round(float(forecast_vals[i]), 2),
            lower_bound=round(float(lower[i]), 2),
            upper_bound=round(float(upper[i]), 2),
        )
        for i in range(periods)
    ]

    return ForecastResponse(
        historical_labels=list(labels),
        historical_values=[round(float(v), 2) for v in values],
        forecast_points=forecast_points,
        method_used=method,
        confidence_level=confidence,
        model_metrics=metrics,
    )


def _select_best_method(values: np.ndarray) -> str:
    """Select the best forecasting method based on data characteristics."""
    n = len(values)
    if n < 5:
        return "moving_average"

    # Check linearity with R-squared
    x = np.arange(n, dtype=np.float64)
    _, _, r_value, _, _ = scipy_stats.linregress(x, values)
    r_sq = r_value ** 2

    if r_sq > 0.7:
        return "linear"

    # Check for volatility
    cv = np.std(values, ddof=1) / np.abs(np.mean(values)) if np.mean(values) != 0 else 1.0
    if cv > 0.5:
        return "exponential_smoothing"

    return "exponential_smoothing"


def _forecast_linear(
    values: np.ndarray, periods: int, confidence: float
) -> tuple:
    """Linear regression forecast with prediction intervals."""
    n = len(values)
    x = np.arange(n, dtype=np.float64)
    slope, intercept, r_value, p_value, std_err = scipy_stats.linregress(x, values)

    # Residual standard error
    y_hat = intercept + slope * x
    residuals = values - y_hat
    se_residuals = np.sqrt(np.sum(residuals ** 2) / (n - 2)) if n > 2 else np.std(values, ddof=1)

    # t-value for confidence interval
    t_val = scipy_stats.t.ppf((1 + confidence) / 2, df=max(n - 2, 1))
    x_mean = np.mean(x)
    ss_x = np.sum((x - x_mean) ** 2)

    forecast_x = np.arange(n, n + periods, dtype=np.float64)
    forecast_vals = intercept + slope * forecast_x

    # Prediction intervals
    lower = np.zeros(periods)
    upper = np.zeros(periods)
    for i, xi in enumerate(forecast_x):
        prediction_se = se_residuals * np.sqrt(
            1 + 1.0 / n + (xi - x_mean) ** 2 / ss_x
        )
        lower[i] = forecast_vals[i] - t_val * prediction_se
        upper[i] = forecast_vals[i] + t_val * prediction_se

    metrics = {
        "slope": round(float(slope), 4),
        "intercept": round(float(intercept), 4),
        "r_squared": round(float(r_value ** 2), 4),
        "std_error": round(float(se_residuals), 4),
    }

    return forecast_vals, lower, upper, metrics


def _forecast_exponential_smoothing(
    values: np.ndarray, periods: int, confidence: float
) -> tuple:
    """
    Simple exponential smoothing (Holt's linear trend method) with prediction intervals.
    """
    n = len(values)

    # Optimize alpha and beta using a simple grid search for minimum MSE
    best_alpha = 0.3
    best_beta = 0.1
    best_mse = float("inf")

    for alpha_candidate in [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]:
        for beta_candidate in [0.0, 0.05, 0.1, 0.2, 0.3, 0.5]:
            level, trend, mse = _holt_fit(values, alpha_candidate, beta_candidate)
            if mse < best_mse:
                best_mse = mse
                best_alpha = alpha_candidate
                best_beta = beta_candidate

    level, trend, mse = _holt_fit(values, best_alpha, best_beta)

    # Generate forecast
    forecast_vals = np.array([level + trend * (i + 1) for i in range(periods)])

    # Estimate prediction intervals from residual standard error
    se = np.sqrt(best_mse) if best_mse > 0 else np.std(values, ddof=1)
    z_val = scipy_stats.norm.ppf((1 + confidence) / 2)

    lower = np.array([
        forecast_vals[i] - z_val * se * np.sqrt(i + 1)
        for i in range(periods)
    ])
    upper = np.array([
        forecast_vals[i] + z_val * se * np.sqrt(i + 1)
        for i in range(periods)
    ])

    metrics = {
        "alpha": best_alpha,
        "beta": best_beta,
        "mse": round(float(best_mse), 4),
        "final_level": round(float(level), 4),
        "final_trend": round(float(trend), 4),
    }

    return forecast_vals, lower, upper, metrics


def _holt_fit(values: np.ndarray, alpha: float, beta: float) -> tuple:
    """
    Fit Holt's linear trend method. Returns (final_level, final_trend, mse).
    """
    n = len(values)
    level = float(values[0])
    trend = float(values[1] - values[0]) if n > 1 else 0.0

    sse = 0.0
    count = 0

    for i in range(1, n):
        forecast = level + trend
        error = float(values[i]) - forecast
        sse += error ** 2
        count += 1

        new_level = alpha * float(values[i]) + (1 - alpha) * (level + trend)
        new_trend = beta * (new_level - level) + (1 - beta) * trend
        level = new_level
        trend = new_trend

    mse = sse / count if count > 0 else 0.0
    return level, trend, mse


def _forecast_moving_average(
    values: np.ndarray, periods: int, confidence: float
) -> tuple:
    """
    Moving average forecast with prediction intervals.
    """
    n = len(values)
    window = min(3, n)

    # Last window values for the forecast
    last_window = values[-window:]
    forecast_val = float(np.mean(last_window))
    forecast_vals = np.full(periods, forecast_val)

    # Prediction intervals based on historical moving average errors
    series = pd.Series(values)
    ma = series.rolling(window=window, min_periods=1).mean().values
    errors = values[window:] - ma[window:]
    se = float(np.std(errors, ddof=1)) if len(errors) > 1 else float(np.std(values, ddof=1))

    z_val = scipy_stats.norm.ppf((1 + confidence) / 2)
    lower = np.array([forecast_val - z_val * se * np.sqrt(i + 1) for i in range(periods)])
    upper = np.array([forecast_val + z_val * se * np.sqrt(i + 1) for i in range(periods)])

    metrics = {
        "window": window,
        "moving_average_value": round(forecast_val, 4),
        "std_error": round(se, 4),
    }

    return forecast_vals, lower, upper, metrics


def _generate_forecast_labels(historical_labels: List[str], periods: int) -> List[str]:
    """Generate labels for forecast periods based on the pattern of historical labels."""
    n = len(historical_labels)
    if n == 0:
        return [f"Forecast {i+1}" for i in range(periods)]

    last_label = historical_labels[-1]

    # Try to detect pattern: "Q1 2024", "Jan 2024", "2024", "Period 1", etc.
    # Simple fallback: append "F+1", "F+2", ...
    forecast_labels = []
    for i in range(1, periods + 1):
        forecast_labels.append(f"{last_label} +{i}")

    return forecast_labels
