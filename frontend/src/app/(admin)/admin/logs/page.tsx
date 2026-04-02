"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Tabs } from "@/components/ui/Tabs";
import { LogsTable } from "@/components/admin/LogsTable";
import { useErrorLogs } from "@/lib/hooks/useMetrics";
import { useAnalyticsLogs } from "@/lib/hooks/useAdmin";
import type { ErrorLog, AnalyticsLog } from "@/lib/types/admin";

export default function LogsPage() {
  const [errorPage, setErrorPage] = useState(1);
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const [errorLevel, setErrorLevel] = useState<string>("");
  const [analyticsSearch, setAnalyticsSearch] = useState("");

  const { data: errorData, isLoading: errorsLoading } = useErrorLogs(
    errorPage,
    20,
    errorLevel || undefined
  );
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalyticsLogs(
    analyticsPage,
    20,
    analyticsSearch || undefined
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="h-6 w-6 text-jd-green" />
        <h1 className="text-2xl font-bold">System Logs</h1>
      </div>

      <Tabs
        tabs={[
          {
            id: "errors",
            label: "Error Logs",
            content: (
              <LogsTable<ErrorLog>
                data={errorData}
                isLoading={errorsLoading}
                type="error"
                page={errorPage}
                onPageChange={setErrorPage}
                filterValue={errorLevel}
                onFilterChange={setErrorLevel}
              />
            ),
          },
          {
            id: "analytics",
            label: "Analytics Logs",
            content: (
              <LogsTable<AnalyticsLog>
                data={analyticsData}
                isLoading={analyticsLoading}
                type="analytics"
                page={analyticsPage}
                onPageChange={setAnalyticsPage}
                searchValue={analyticsSearch}
                onSearchChange={setAnalyticsSearch}
              />
            ),
          },
        ]}
      />
    </div>
  );
}
