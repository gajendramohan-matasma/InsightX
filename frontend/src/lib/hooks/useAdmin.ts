"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AcceptancePoint,
  ConnectorHealth,
  AnalyticsLog,
  PaginatedResponse,
  UsageHeatmapCell,
} from "@/lib/types/admin";

export function useAcceptanceRate(period: string = "30d") {
  return useQuery<AcceptancePoint[]>({
    queryKey: ["admin", "acceptance", period],
    queryFn: () =>
      apiClient.get<AcceptancePoint[]>("admin/metrics/acceptance", {
        params: { period },
      }),
    refetchInterval: 120_000,
  });
}

export function useConnectorStatus() {
  return useQuery<ConnectorHealth[]>({
    queryKey: ["admin", "connectors"],
    queryFn: () => apiClient.get<ConnectorHealth[]>("admin/connectors/status"),
    refetchInterval: 30_000,
  });
}

export function useAnalyticsLogs(
  page: number = 1,
  pageSize: number = 20,
  search?: string
) {
  return useQuery<PaginatedResponse<AnalyticsLog>>({
    queryKey: ["admin", "analytics-logs", page, pageSize, search],
    queryFn: () =>
      apiClient.get<PaginatedResponse<AnalyticsLog>>("admin/logs/analytics", {
        params: { page, page_size: pageSize, search },
      }),
  });
}

export function useUsageHeatmap(period: string = "30d") {
  return useQuery<UsageHeatmapCell[]>({
    queryKey: ["admin", "usage-heatmap", period],
    queryFn: () =>
      apiClient.get<UsageHeatmapCell[]>("admin/metrics/usage-heatmap", {
        params: { period },
      }),
    refetchInterval: 300_000,
  });
}
