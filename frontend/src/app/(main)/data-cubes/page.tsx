"use client";

import { useState } from "react";
import {
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  Rows3,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDataCubes, useRefreshDataCube, useDataCubeData } from "@/lib/hooks/useDataCubes";
import type { DataCube } from "@/lib/types/data-cubes";

const sourceColors: Record<string, { variant: "success" | "info" | "default"; label: string }> = {
  powerbi: { variant: "info", label: "Power BI" },
  anaplan: { variant: "success", label: "Anaplan" },
  manual: { variant: "default", label: "Manual" },
};

const statusConfig: Record<string, { variant: "success" | "warning" | "error"; label: string }> = {
  active: { variant: "success", label: "Active" },
  inactive: { variant: "warning", label: "Inactive" },
  error: { variant: "error", label: "Error" },
};

const typeColors: Record<string, string> = {
  string: "bg-gray-100 text-gray-600",
  number: "bg-blue-50 text-blue-600",
  currency: "bg-green-50 text-green-700",
  percentage: "bg-yellow-50 text-yellow-700",
  date: "bg-purple-50 text-purple-600",
};

function formatTimestamp(ts: string | null) {
  if (!ts) return "Never";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return `${Math.floor(diffHrs / 24)}d ago`;
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function DataCubeCard({ cube }: { cube: DataCube }) {
  const [expanded, setExpanded] = useState(false);
  const [showData, setShowData] = useState(false);
  const refreshMutation = useRefreshDataCube();
  const source = sourceColors[cube.source] || sourceColors.manual;
  const st = statusConfig[cube.status] || statusConfig.inactive;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center">
              <Database className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{cube.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant={source.variant}>{source.label}</Badge>
                <Badge variant={st.variant}>{st.label}</Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refreshMutation.mutate(cube.id)}
              loading={refreshMutation.isPending}
              title="Refresh data"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {cube.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{cube.description}</p>
        )}
      </div>

      {/* Schema */}
      <div className="px-5 pb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {cube.schema_definition.length} columns
        </button>
        {expanded && (
          <div className="mt-2 space-y-1">
            {cube.schema_definition.map((col) => (
              <div key={col.name} className="flex items-center gap-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${typeColors[col.type] || typeColors.string}`}>
                  {col.type}
                </span>
                <span className="text-xs text-gray-700 font-medium">{col.name}</span>
                {col.description && (
                  <span className="text-[10px] text-gray-400 truncate">{col.description}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-gray-400">
          <span className="flex items-center gap-1">
            <Rows3 className="h-3 w-3" />
            {cube.row_count.toLocaleString()} rows
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(cube.last_refreshed_at)}
          </span>
          <span className="capitalize">{cube.refresh_schedule}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowData(true)}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Preview</span>
        </Button>
      </div>

      {/* Data Preview Modal */}
      {showData && (
        <DataPreviewModal cubeId={cube.id} cubeName={cube.name} onClose={() => setShowData(false)} />
      )}
    </div>
  );
}

function DataPreviewModal({
  cubeId,
  cubeName,
  onClose,
}: {
  cubeId: string;
  cubeName: string;
  onClose: () => void;
}) {
  const { data, isLoading } = useDataCubeData(cubeId, 20, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[80vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">{cubeName} — Data Preview</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Loading...</div>
          ) : data && data.rows.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-green-50">
                  {data.columns.map((col) => (
                    <th key={col} className="px-3 py-2 text-left font-semibold text-green-800 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    {data.columns.map((col) => (
                      <td key={col} className="px-3 py-1.5 text-gray-700 whitespace-nowrap">
                        {typeof row[col] === "number" ? formatNumber(row[col] as number) : String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">No data</div>
          )}
        </div>
        {data && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
            Showing {data.rows.length} of {data.total} rows
          </div>
        )}
      </div>
    </div>
  );
}

export default function DataCubesPage() {
  const { data: cubes, isLoading, error } = useDataCubes();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
            <Database className="h-6 w-6 text-green-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Data Cubes</h1>
            <p className="text-sm text-gray-500">Pre-configured data pipelines from Anaplan, Power BI, and manual sources</p>
          </div>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 h-52 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 text-sm">
          Failed to load data cubes. Is the backend running?
        </div>
      ) : cubes && cubes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cubes.map((cube) => (
            <DataCubeCard key={cube.id} cube={cube} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-600 mb-2">No Data Cubes Yet</h2>
          <p className="text-sm text-gray-400 mb-4">Data cubes are auto-seeded on backend startup.</p>
        </div>
      )}
    </div>
  );
}
