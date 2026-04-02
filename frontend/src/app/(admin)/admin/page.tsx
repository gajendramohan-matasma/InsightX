"use client";

import { useState } from "react";
import { Activity, Shield } from "lucide-react";
import { MetricsDashboard } from "@/components/admin/MetricsDashboard";
import { Button } from "@/components/ui/Button";

const PERIOD_OPTIONS = [
  { label: "24h", value: "24h" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
];

export default function AdminOverviewPage() {
  const [period, setPeriod] = useState("7d");

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-jd-green-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-jd-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Monitor system performance and usage
            </p>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-border p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? "primary" : "ghost"}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className="px-3"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Dashboard */}
      <MetricsDashboard period={period} />
    </div>
  );
}
