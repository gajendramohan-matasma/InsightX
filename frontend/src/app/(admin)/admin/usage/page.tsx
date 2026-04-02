"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { UsageHeatmap } from "@/components/admin/UsageHeatmap";
import { SkeletonChart } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useUsageHeatmap } from "@/lib/hooks/useAdmin";
import { useUsageBreakdown } from "@/lib/hooks/useMetrics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const PERIOD_OPTIONS = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

const PIE_COLORS = ["#367C2B", "#FFDE00", "#4A9A3A", "#2A5F22", "#88cc79", "#b39c00"];

export default function UsagePage() {
  const [period, setPeriod] = useState("30d");

  const { data: heatmapData, isLoading: heatmapLoading } = useUsageHeatmap(period);
  const { data: breakdownData, isLoading: breakdownLoading } = useUsageBreakdown(period);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-jd-green" />
          <h1 className="text-2xl font-bold">Usage Patterns</h1>
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

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Query Volume by Day and Hour</CardTitle>
        </CardHeader>
        <CardContent>
          {heatmapLoading ? (
            <SkeletonChart />
          ) : heatmapData ? (
            <UsageHeatmap data={heatmapData} />
          ) : (
            <p className="text-sm text-muted-foreground">No heatmap data available</p>
          )}
        </CardContent>
      </Card>

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Queries by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <SkeletonChart />
            ) : breakdownData ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={breakdownData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "#6b7280", fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: "#e5e7eb" }}
                  />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#367C2B" name="Queries" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdownLoading ? (
              <SkeletonChart />
            ) : breakdownData ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData.map((d) => ({
                      name: d.category,
                      value: d.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {breakdownData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Average latency by category */}
      <Card>
        <CardHeader>
          <CardTitle>Average Latency by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {breakdownLoading ? (
            <SkeletonChart />
          ) : breakdownData ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={breakdownData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickLine={false}
                  tickFormatter={(v) => `${v}ms`}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  tick={{ fill: "#6b7280", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(v) => [`${v}ms`, "Avg Latency"]}
                />
                <Bar
                  dataKey="avg_latency_ms"
                  fill="#FFDE00"
                  name="Avg Latency"
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
  );
}
