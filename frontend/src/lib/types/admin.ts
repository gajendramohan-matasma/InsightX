export interface MetricsSummary {
  total_queries: number;
  total_queries_change: number;
  avg_latency_ms: number;
  avg_latency_change: number;
  acceptance_rate: number;
  acceptance_rate_change: number;
  error_rate: number;
  error_rate_change: number;
  active_users: number;
  active_users_change: number;
  period: string;
}

export interface LatencyPoint {
  timestamp: string;
  avg_ms: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  count: number;
}

export interface UsageBreakdown {
  category: string;
  count: number;
  percentage: number;
  avg_latency_ms: number;
}

export interface UsageHeatmapCell {
  day: number;
  hour: number;
  count: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  level: "error" | "warning" | "critical";
  message: string;
  stack_trace?: string;
  user_id?: string;
  conversation_id?: string;
  endpoint?: string;
  status_code?: number;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_email?: string;
  conversation_id: string;
  query: string;
  response_preview: string;
  tools_used: string[];
  latency_ms: number;
  tokens_used: number;
  feedback?: "accepted" | "rejected" | null;
  model: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AcceptancePoint {
  date: string;
  accepted: number;
  rejected: number;
  total: number;
  rate: number;
}

export interface ConnectorHealth {
  name: string;
  status: "healthy" | "degraded" | "down";
  last_check: string;
  latency_ms: number;
  error_count: number;
}
