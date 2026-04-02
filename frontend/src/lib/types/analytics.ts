export interface VarianceResult {
  category: string;
  actual: number;
  budget: number;
  variance: number;
  variance_pct: number;
  period: string;
  status: "favorable" | "unfavorable" | "on_track";
  details?: Record<string, unknown>;
}

export interface TrendResult {
  period: string;
  value: number;
  metric: string;
  yoy_change?: number;
  mom_change?: number;
  moving_avg?: number;
}

export interface RatioResult {
  name: string;
  value: number;
  benchmark?: number;
  category: "liquidity" | "profitability" | "efficiency" | "leverage";
  period: string;
  interpretation: string;
  trend: "improving" | "declining" | "stable";
}

export interface ForecastResult {
  period: string;
  predicted_value: number;
  lower_bound: number;
  upper_bound: number;
  confidence: number;
  metric: string;
  model: string;
  assumptions?: string[];
}

export interface FinancialMetric {
  name: string;
  value: number;
  previous_value?: number;
  change_pct?: number;
  format: "currency" | "percentage" | "number";
  period: string;
}

export interface AnalyticsQuery {
  query: string;
  metric_type?: "variance" | "trend" | "ratio" | "forecast";
  time_range?: {
    start: string;
    end: string;
  };
  filters?: Record<string, string>;
}
