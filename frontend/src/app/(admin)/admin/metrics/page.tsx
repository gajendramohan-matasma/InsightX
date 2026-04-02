"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { KPICard } from "@/components/charts/KPICard";
import { LatencyChart } from "@/components/admin/LatencyChart";
import { AcceptanceTracker } from "@/components/admin/AcceptanceTracker";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useMetricsSummary, useLatencyTimeSeries } from "@/lib/hooks/useMetrics";
import { useAcceptanceRate, useConnectorStatus } from "@/lib/hooks/useAdmin";
import { Badge } from "@/components/ui/Badge";

const PERIOD_OPTIONS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
];

export default function MetricsPage() {
  const [period, setPeriod] = useState("7d");

  const { data: summary, isLoading: summaryLoading } = useMetricsSummary(period);
  const { data: latency, isLoading: latencyLoading } = useLatencyTimeSeries(period, "1h");
  const { data: acceptance, isLoading: acceptanceLoading } = useAcceptanceRate(period);
  const { data: connectors, isLoading: connectorsLoading } = useConnectorStatus();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-jd-green" />
          <h1 className="text-2xl font-bold">Detailed Metrics</h1>
        </div>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {summaryLoading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
        ) : summary ? (
          <>
            <KPICard title="Total Queries" value={summary.total_queries} trend={summary.total_queries_change} format="number" />
            <KPICard title="Avg Latency" value={summary.avg_latency_ms} trend={summary.avg_latency_change} format="number" />
            <KPICard title="Acceptance Rate" value={summary.acceptance_rate} trend={summary.acceptance_rate_change} format="percentage" />
            <KPICard title="Error Rate" value={summary.error_rate} trend={summary.error_rate_change} format="percentage" />
            <KPICard title="Active Users" value={summary.active_users} trend={summary.active_users_change} format="number" />
          </>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Response Latency Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {latencyLoading ? (
              <SkeletonChart />
            ) : latency ? (
              <LatencyChart data={latency} height={320} />
            ) : (
              <p className="text-sm text-muted-foreground">No latency data</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acceptance / Rejection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {acceptanceLoading ? (
              <SkeletonChart />
            ) : acceptance ? (
              <AcceptanceTracker data={acceptance} height={320} />
            ) : (
              <p className="text-sm text-muted-foreground">No acceptance data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connector status */}
      <Card>
        <CardHeader>
          <CardTitle>Connector Health</CardTitle>
        </CardHeader>
        <CardContent>
          {connectorsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : connectors ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {connectors.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.latency_ms}ms latency
                    </p>
                  </div>
                  <Badge
                    variant={
                      c.status === "healthy" ? "success" : c.status === "degraded" ? "warning" : "error"
                    }
                  >
                    {c.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No connector data</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
