"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { formatCurrency, formatPercentage, formatNumber } from "@/lib/utils/formatters";

interface KPICardProps {
  title: string;
  value: number;
  label?: string;
  trend?: number;
  format?: "currency" | "percentage" | "number";
  compact?: boolean;
  className?: string;
}

export function KPICard({
  title,
  value,
  label,
  trend,
  format = "number",
  compact = true,
  className,
}: KPICardProps) {
  const formattedValue =
    format === "currency"
      ? formatCurrency(value, { compact })
      : format === "percentage"
        ? formatPercentage(value)
        : formatNumber(value, { compact });

  const trendIsPositive = trend != null && trend > 0;
  const trendIsNegative = trend != null && trend < 0;
  const trendIsNeutral = trend != null && trend === 0;

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-border p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full",
              trendIsPositive && "text-jd-green-700 bg-jd-green-50",
              trendIsNegative && "text-red-700 bg-red-50",
              trendIsNeutral && "text-gray-600 bg-gray-100"
            )}
          >
            {trendIsPositive && <TrendingUp className="h-3 w-3" />}
            {trendIsNegative && <TrendingDown className="h-3 w-3" />}
            {trendIsNeutral && <Minus className="h-3 w-3" />}
            {formatPercentage(Math.abs(trend), { showSign: false })}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{formattedValue}</p>
      {label && (
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      )}
    </div>
  );
}
