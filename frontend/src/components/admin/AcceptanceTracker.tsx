"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import type { AcceptancePoint } from "@/lib/types/admin";
import { formatPercentage } from "@/lib/utils/formatters";

interface AcceptanceTrackerProps {
  data: AcceptancePoint[];
  height?: number;
}

export function AcceptanceTracker({ data, height = 300 }: AcceptanceTrackerProps) {
  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={formattedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          yAxisId="count"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#e5e7eb" }}
          tickFormatter={(v) => formatPercentage(v)}
          domain={[0, 100]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            fontSize: "12px",
          }}
          formatter={(value, name) =>
            name === "Acceptance Rate" ? [formatPercentage(Number(value)), String(name)] : [String(value), String(name)]
          }
        />
        <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
        <Bar
          yAxisId="count"
          dataKey="accepted"
          fill="#367C2B"
          name="Accepted"
          radius={[4, 4, 0, 0]}
          stackId="stack"
        />
        <Bar
          yAxisId="count"
          dataKey="rejected"
          fill="#dc2626"
          name="Rejected"
          radius={[4, 4, 0, 0]}
          stackId="stack"
        />
        <Line
          yAxisId="rate"
          type="monotone"
          dataKey="rate"
          stroke="#FFDE00"
          name="Acceptance Rate"
          strokeWidth={2}
          dot={{ fill: "#FFDE00", r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
