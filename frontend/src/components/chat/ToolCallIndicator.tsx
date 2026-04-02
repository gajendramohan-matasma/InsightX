"use client";

import { Loader2, CheckCircle2, AlertCircle, Database, BarChart3, Calculator, Search } from "lucide-react";
import type { ToolCall } from "@/lib/types/chat";
import { cn } from "@/lib/utils/formatters";

interface ToolCallIndicatorProps {
  toolCall: ToolCall;
  className?: string;
}

const toolLabels: Record<string, string> = {
  query_anaplan: "Querying Anaplan",
  query_powerbi: "Fetching Power BI data",
  analyze_variance: "Analyzing variance",
  calculate_ratios: "Calculating operational ratios",
  trend_analysis: "Analyzing trends",
  forecast: "Running forecast model",
  search_data: "Searching data",
};

const toolIcons: Record<string, React.ReactNode> = {
  query_anaplan: <Database className="h-4 w-4" />,
  query_powerbi: <BarChart3 className="h-4 w-4" />,
  analyze_variance: <Calculator className="h-4 w-4" />,
  calculate_ratios: <Calculator className="h-4 w-4" />,
  trend_analysis: <BarChart3 className="h-4 w-4" />,
  forecast: <BarChart3 className="h-4 w-4" />,
  search_data: <Search className="h-4 w-4" />,
};

export function ToolCallIndicator({ toolCall, className }: ToolCallIndicatorProps) {
  const label = toolLabels[toolCall.name] ?? `Running ${toolCall.name}`;
  const icon = toolIcons[toolCall.name] ?? <Database className="h-4 w-4" />;
  const isRunning = toolCall.status === "pending" || toolCall.status === "running";
  const isCompleted = toolCall.status === "completed";
  const isError = toolCall.status === "error";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
        "border transition-all",
        isRunning && "bg-jd-green-50 border-jd-green-200 text-jd-green-700",
        isCompleted && "bg-jd-green-50 border-jd-green-300 text-jd-green-700",
        isError && "bg-red-50 border-red-200 text-red-700",
        className
      )}
    >
      <span className="flex items-center gap-1.5">
        {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isCompleted && <CheckCircle2 className="h-3.5 w-3.5" />}
        {isError && <AlertCircle className="h-3.5 w-3.5" />}
        {icon}
      </span>
      <span>{isRunning ? `${label}...` : isCompleted ? `${label} complete` : `${label} failed`}</span>
      {toolCall.duration_ms != null && (
        <span className="text-muted-foreground">
          {toolCall.duration_ms < 1000
            ? `${toolCall.duration_ms}ms`
            : `${(toolCall.duration_ms / 1000).toFixed(1)}s`}
        </span>
      )}
    </div>
  );
}
