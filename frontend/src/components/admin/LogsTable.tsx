"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/formatters";
import { formatDate, formatLatency } from "@/lib/utils/formatters";
import type { ErrorLog, AnalyticsLog, PaginatedResponse } from "@/lib/types/admin";

interface LogsTableProps<T> {
  data: PaginatedResponse<T> | undefined;
  isLoading: boolean;
  type: "error" | "analytics";
  page: number;
  onPageChange: (page: number) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
}

export function LogsTable<T extends ErrorLog | AnalyticsLog>({
  data,
  isLoading,
  type,
  page,
  onPageChange,
  searchValue = "",
  onSearchChange,
  filterValue,
  onFilterChange,
}: LogsTableProps<T>) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={type === "error" ? "Search error logs..." : "Search queries..."}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-jd-green focus:border-jd-green"
            />
          </div>
        )}
        {type === "error" && onFilterChange && (
          <select
            value={filterValue ?? ""}
            onChange={(e) => onFilterChange(e.target.value)}
            className="h-9 px-3 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-jd-green"
          >
            <option value="">All Levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-jd-green text-white">
              {type === "error" ? (
                <>
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">Level</th>
                  <th className="px-4 py-3 text-left font-medium">Message</th>
                  <th className="px-4 py-3 text-left font-medium">Endpoint</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-4 py-3 text-left font-medium">User</th>
                  <th className="px-4 py-3 text-left font-medium">Query</th>
                  <th className="px-4 py-3 text-left font-medium">Tools</th>
                  <th className="px-4 py-3 text-left font-medium">Latency</th>
                  <th className="px-4 py-3 text-left font-medium">Feedback</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={type === "error" ? 5 : 6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={type === "error" ? 5 : 6} className="px-4 py-8 text-center text-muted-foreground">
                  No logs found
                </td>
              </tr>
            ) : (
              items.map((item, i) => {
                const isError = type === "error";
                const log = item as unknown as Record<string, unknown>;
                const id = String(log.id ?? i);
                const isExpanded = expandedRow === id;

                return (
                  <tr
                    key={id}
                    className={cn(
                      "border-t border-border cursor-pointer transition-colors",
                      i % 2 === 0 ? "bg-white" : "bg-muted/50",
                      "hover:bg-jd-green-50"
                    )}
                    onClick={() => setExpandedRow(isExpanded ? null : id)}
                  >
                    {isError ? (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(String(log.timestamp), { format: "datetime" })}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.level === "critical"
                                ? "error"
                                : log.level === "error"
                                  ? "error"
                                  : "warning"
                            }
                          >
                            {String(log.level)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 max-w-xs truncate">{String(log.message ?? "")}</td>
                        <td className="px-4 py-3 text-xs font-mono">{String(log.endpoint ?? "\u2014")}</td>
                        <td className="px-4 py-3">{log.status_code != null ? String(log.status_code) : "\u2014"}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(String(log.timestamp), { format: "datetime" })}
                        </td>
                        <td className="px-4 py-3 text-xs">{String(log.user_email ?? log.user_id ?? "\u2014")}</td>
                        <td className="px-4 py-3 max-w-xs truncate">{String(log.query ?? "")}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(log.tools_used) ? log.tools_used : []).map((tool: string, ti: number) => (
                              <Badge key={ti} variant="info">{tool}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatLatency(Number(log.latency_ms ?? 0))}
                        </td>
                        <td className="px-4 py-3">
                          {log.feedback === "accepted" && <Badge variant="success">Accepted</Badge>}
                          {log.feedback === "rejected" && <Badge variant="error">Rejected</Badge>}
                          {!log.feedback && <span className="text-muted-foreground">\u2014</span>}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {data ? `Showing ${items.length} of ${data.total} results` : ""}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
