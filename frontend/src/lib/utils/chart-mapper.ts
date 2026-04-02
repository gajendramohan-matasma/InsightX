import type { ChartSpec } from "@/lib/types/chat";

const JD_CHART_COLORS = [
  "#367C2B",
  "#FFDE00",
  "#4A9A3A",
  "#2A5F22",
  "#88cc79",
  "#b39c00",
  "#5fb44e",
  "#807000",
  "#daf0d5",
  "#fff180",
];

export interface RechartsBarProps {
  data: Record<string, unknown>[];
  xDataKey: string;
  bars: { dataKey: string; fill: string; name: string }[];
  xLabel?: string;
  yLabel?: string;
  title: string;
}

export interface RechartsLineProps {
  data: Record<string, unknown>[];
  xDataKey: string;
  lines: { dataKey: string; stroke: string; name: string }[];
  xLabel?: string;
  yLabel?: string;
  title: string;
}

export interface RechartsAreaProps {
  data: Record<string, unknown>[];
  xDataKey: string;
  areas: { dataKey: string; fill: string; stroke: string; name: string }[];
  xLabel?: string;
  yLabel?: string;
  title: string;
}

export interface RechartsPieProps {
  data: { name: string; value: number; fill: string }[];
  title: string;
}

export interface RechartsScatterProps {
  data: Record<string, unknown>[];
  xDataKey: string;
  yDataKey: string;
  title: string;
  color: string;
}

export interface KPIProps {
  value: number;
  label: string;
  trend?: number;
  title: string;
}

export interface TableProps {
  data: Record<string, unknown>[];
  columns: { key: string; header: string; format?: string; align?: string }[];
  title: string;
}

export type MappedChartProps =
  | { type: "bar"; props: RechartsBarProps }
  | { type: "line"; props: RechartsLineProps }
  | { type: "area"; props: RechartsAreaProps }
  | { type: "pie"; props: RechartsPieProps }
  | { type: "scatter"; props: RechartsScatterProps }
  | { type: "kpi"; props: KPIProps }
  | { type: "table"; props: TableProps };

export function mapChartSpec(spec: ChartSpec): MappedChartProps {
  const colors = spec.colors?.length ? spec.colors : JD_CHART_COLORS;

  switch (spec.chart_type) {
    case "bar": {
      const xKey = spec.x_key ?? guessXKey(spec.data);
      const yKeys = spec.y_keys ?? guessYKeys(spec.data, xKey);
      return {
        type: "bar",
        props: {
          data: spec.data,
          xDataKey: xKey,
          bars: yKeys.map((key, i) => ({
            dataKey: key,
            fill: colors[i % colors.length],
            name: formatLabel(key),
          })),
          xLabel: spec.x_label,
          yLabel: spec.y_label,
          title: spec.title,
        },
      };
    }

    case "line": {
      const xKey = spec.x_key ?? guessXKey(spec.data);
      const yKeys = spec.y_keys ?? guessYKeys(spec.data, xKey);
      return {
        type: "line",
        props: {
          data: spec.data,
          xDataKey: xKey,
          lines: yKeys.map((key, i) => ({
            dataKey: key,
            stroke: colors[i % colors.length],
            name: formatLabel(key),
          })),
          xLabel: spec.x_label,
          yLabel: spec.y_label,
          title: spec.title,
        },
      };
    }

    case "area": {
      const xKey = spec.x_key ?? guessXKey(spec.data);
      const yKeys = spec.y_keys ?? guessYKeys(spec.data, xKey);
      return {
        type: "area",
        props: {
          data: spec.data,
          xDataKey: xKey,
          areas: yKeys.map((key, i) => ({
            dataKey: key,
            fill: colors[i % colors.length],
            stroke: colors[i % colors.length],
            name: formatLabel(key),
          })),
          xLabel: spec.x_label,
          yLabel: spec.y_label,
          title: spec.title,
        },
      };
    }

    case "pie": {
      const nameKey = spec.x_key ?? "name";
      const valueKey = spec.y_keys?.[0] ?? "value";
      return {
        type: "pie",
        props: {
          data: spec.data.map((d, i) => ({
            name: String(d[nameKey] ?? `Item ${i + 1}`),
            value: Number(d[valueKey] ?? 0),
            fill: colors[i % colors.length],
          })),
          title: spec.title,
        },
      };
    }

    case "scatter": {
      const xKey = spec.x_key ?? guessXKey(spec.data);
      const yKey = spec.y_keys?.[0] ?? guessYKeys(spec.data, xKey)[0] ?? "value";
      return {
        type: "scatter",
        props: {
          data: spec.data,
          xDataKey: xKey,
          yDataKey: yKey,
          title: spec.title,
          color: colors[0],
        },
      };
    }

    case "kpi": {
      return {
        type: "kpi",
        props: {
          value: spec.value ?? 0,
          label: spec.label ?? spec.title,
          trend: spec.trend,
          title: spec.title,
        },
      };
    }

    case "table": {
      const cols =
        spec.columns ??
        Object.keys(spec.data[0] ?? {}).map((key) => ({
          key,
          header: formatLabel(key),
        }));
      return {
        type: "table",
        props: {
          data: spec.data,
          columns: cols,
          title: spec.title,
        },
      };
    }

    default: {
      const xKey = spec.x_key ?? guessXKey(spec.data);
      const yKeys = spec.y_keys ?? guessYKeys(spec.data, xKey);
      return {
        type: "bar",
        props: {
          data: spec.data,
          xDataKey: xKey,
          bars: yKeys.map((key, i) => ({
            dataKey: key,
            fill: colors[i % colors.length],
            name: formatLabel(key),
          })),
          xLabel: spec.x_label,
          yLabel: spec.y_label,
          title: spec.title,
        },
      };
    }
  }
}

function guessXKey(data: Record<string, unknown>[]): string {
  if (!data.length) return "x";
  const keys = Object.keys(data[0]);
  const dateKeys = keys.filter(
    (k) => k.includes("date") || k.includes("period") || k.includes("month") || k.includes("year") || k.includes("time")
  );
  if (dateKeys.length) return dateKeys[0];
  const nameKeys = keys.filter(
    (k) => k.includes("name") || k.includes("category") || k.includes("label")
  );
  if (nameKeys.length) return nameKeys[0];
  const firstStringKey = keys.find((k) => typeof data[0][k] === "string");
  return firstStringKey ?? keys[0];
}

function guessYKeys(data: Record<string, unknown>[], xKey: string): string[] {
  if (!data.length) return ["value"];
  return Object.keys(data[0]).filter(
    (k) => k !== xKey && typeof data[0][k] === "number"
  );
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}
