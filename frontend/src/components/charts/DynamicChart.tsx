"use client";

import type { ChartSpec } from "@/lib/types/chat";
import { mapChartSpec } from "@/lib/utils/chart-mapper";
import { BarChartComponent } from "./BarChart";
import { LineChartComponent } from "./LineChart";
import { KPICard } from "./KPICard";
import { DataTable } from "./DataTable";
import { ChartContainer } from "./ChartContainer";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DynamicChartProps {
  spec: ChartSpec;
  height?: number;
}

export function DynamicChart({ spec, height = 300 }: DynamicChartProps) {
  const mapped = mapChartSpec(spec);

  switch (mapped.type) {
    case "bar":
      return (
        <ChartContainer title={mapped.props.title}>
          <BarChartComponent config={mapped.props} height={height} />
        </ChartContainer>
      );

    case "line":
      return (
        <ChartContainer title={mapped.props.title}>
          <LineChartComponent config={mapped.props} height={height} />
        </ChartContainer>
      );

    case "area":
      return (
        <ChartContainer title={mapped.props.title}>
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={mapped.props.data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={mapped.props.xDataKey}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: "#e5e7eb" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              {mapped.props.areas.map((area) => (
                <Area
                  key={area.dataKey}
                  type="monotone"
                  dataKey={area.dataKey}
                  fill={area.fill}
                  stroke={area.stroke}
                  name={area.name}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      );

    case "pie":
      return (
        <ChartContainer title={mapped.props.title}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={mapped.props.data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              >
                {mapped.props.data.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
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
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      );

    case "scatter":
      return (
        <ChartContainer title={mapped.props.title}>
          <ResponsiveContainer width="100%" height={height}>
            <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey={mapped.props.xDataKey}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                dataKey={mapped.props.yDataKey}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Scatter data={mapped.props.data} fill={mapped.props.color} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      );

    case "kpi":
      return (
        <KPICard
          title={mapped.props.title}
          value={mapped.props.value}
          label={mapped.props.label}
          trend={mapped.props.trend}
          format="currency"
        />
      );

    case "table":
      return (
        <DataTable
          data={mapped.props.data}
          columns={mapped.props.columns}
          title={mapped.props.title}
        />
      );

    default:
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Unsupported chart type
        </div>
      );
  }
}
