"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { LatencyPoint } from "@/lib/types/admin";
import { formatLatency } from "@/lib/utils/formatters";

interface LatencyChartProps {
  data: LatencyPoint[];
  height?: number;
}

export function LatencyChart({ data, height = 300 }: LatencyChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          tickFormatter={(v) => formatLatency(v)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            fontSize: "12px",
          }}
          formatter={(value) => [formatLatency(Number(value)), String(value)]}
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
        <Line
          type="monotone"
          dataKey="avg_ms"
          stroke="#367C2B"
          name="Average"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p50_ms"
          stroke="#4A9A3A"
          name="P50"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p95_ms"
          stroke="#FFDE00"
          name="P95"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="p99_ms"
          stroke="#dc2626"
          name="P99"
          strokeWidth={1}
          strokeDasharray="2 2"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
