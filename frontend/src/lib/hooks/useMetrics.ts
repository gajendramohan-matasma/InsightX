"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  MetricsSummary,
  LatencyPoint,
  UsageBreakdown,
  ErrorLog,
  PaginatedResponse,
} from "@/lib/types/admin";

export function useMetricsSummary(period: string = "7d") {
  return useQuery<MetricsSummary>({
    queryKey: ["metrics", "summary", period],
    queryFn: () => apiClient.get<MetricsSummary>("admin/metrics/summary", { params: { period } }),
    refetchInterval: 60_000,
  });
}

export function useLatencyTimeSeries(period: string = "7d", interval: string = "1h") {
  return useQuery<LatencyPoint[]>({
    queryKey: ["metrics", "latency", period, interval],
    queryFn: () =>
      apiClient.get<LatencyPoint[]>("admin/metrics/latency", {
        params: { period, interval },
      }),
    refetchInterval: 60_000,
  });
}

export function useUsageBreakdown(period: string = "7d") {
  return useQuery<UsageBreakdown[]>({
    queryKey: ["metrics", "usage", period],
    queryFn: () =>
      apiClient.get<UsageBreakdown[]>("admin/metrics/usage", { params: { period } }),
    refetchInterval: 60_000,
  });
}

export function useErrorLogs(page: number = 1, pageSize: number = 20, level?: string) {
  return useQuery<PaginatedResponse<ErrorLog>>({
    queryKey: ["metrics", "errors", page, pageSize, level],
    queryFn: () =>
      apiClient.get<PaginatedResponse<ErrorLog>>("admin/logs/errors", {
        params: { page, page_size: pageSize, level },
      }),
  });
}
