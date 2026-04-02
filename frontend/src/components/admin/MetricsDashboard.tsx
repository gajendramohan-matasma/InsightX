"use client";

import { KPICard } from "@/components/charts/KPICard";
import { LatencyChart } from "./LatencyChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { SkeletonCard, SkeletonChart } from "@/components/ui/Skeleton";
import { useMetricsSummary, useLatencyTimeSeries, useUsageBreakdown } from "@/lib/hooks/useMetrics";
import { formatLatency, formatPercentage, formatNumber } from "@/lib/utils/formatters";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricsDashboardProps {
  period?: string;
}

export function MetricsDashboard({ period = "7d" }: MetricsDashboardProps) {
  const { data: summary, isLoading: summaryLoading } = useMetricsSummary(period);
  const { data: latency, isLoading: latencyLoading } = useLatencyTimeSeries(period);
  const { data: usage, isLoading: usageLoading } = useUsageBreakdown(period);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : summary ? (
          <>
            <KPICard
              title="Total Queries"
              value={summary.total_queries}
              trend={summary.total_queries_change}
              format="number"
            />
            <KPICard
              title="Avg Latency"
              value={summary.avg_latency_ms}
              trend={summary.avg_latency_change}
              label={formatLatency(summary.avg_latency_ms)}
              format="number"
            />
            <KPICard
              title="Acceptance Rate"
              value={summary.acceptance_rate}
              trend={summary.acceptance_rate_change}
              format="percentage"
            />
            <KPICard
              title="Error Rate"
              value={summary.error_rate}
              trend={summary.error_rate_change}
              format="percentage"
            />
          </>
        ) : null}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Latency</CardTitle>
          </CardHeader>
          <CardContent>
            {latencyLoading ? (
              <SkeletonChart />
            ) : latency ? (
              <LatencyChart data={latency} height={280} />
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Usage Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Usage by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {usageLoading ? (
              <SkeletonChart />
            ) : usage ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={usage} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={75}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#367C2B"
                    name="Queries"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
