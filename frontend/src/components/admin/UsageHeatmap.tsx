"use client";

import { cn } from "@/lib/utils/formatters";
import type { UsageHeatmapCell } from "@/lib/types/admin";

interface UsageHeatmapProps {
  data: UsageHeatmapCell[];
  className?: string;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function getIntensity(count: number, max: number): string {
  if (count === 0) return "bg-gray-100";
  const ratio = count / max;
  if (ratio < 0.2) return "bg-jd-green-100";
  if (ratio < 0.4) return "bg-jd-green-200";
  if (ratio < 0.6) return "bg-jd-green-400";
  if (ratio < 0.8) return "bg-jd-green-600";
  return "bg-jd-green-800";
}

export function UsageHeatmap({ data, className }: UsageHeatmapProps) {
  const grid: Record<string, number> = {};
  let maxCount = 1;

  for (const cell of data) {
    const key = `${cell.day}-${cell.hour}`;
    grid[key] = cell.count;
    if (cell.count > maxCount) maxCount = cell.count;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="min-w-[600px]">
        {/* Hour labels */}
        <div className="flex ml-12 mb-1">
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <div
              key={h}
              className="text-[10px] text-muted-foreground"
              style={{ width: `${(100 / 24) * 3}%` }}
            >
              {h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map((day, dayIndex) => (
          <div key={day} className="flex items-center gap-1 mb-0.5">
            <span className="w-10 text-xs text-muted-foreground text-right pr-2">
              {day}
            </span>
            <div className="flex-1 flex gap-0.5">
              {HOURS.map((hour) => {
                const count = grid[`${dayIndex}-${hour}`] ?? 0;
                return (
                  <div
                    key={hour}
                    className={cn(
                      "flex-1 aspect-square rounded-sm transition-colors",
                      getIntensity(count, maxCount)
                    )}
                    title={`${day} ${hour}:00 - ${count} queries`}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3 mr-1">
          <span className="text-[10px] text-muted-foreground mr-1">Less</span>
          {["bg-gray-100", "bg-jd-green-100", "bg-jd-green-200", "bg-jd-green-400", "bg-jd-green-600", "bg-jd-green-800"].map(
            (cls, i) => (
              <div key={i} className={cn("h-3 w-3 rounded-sm", cls)} />
            )
          )}
          <span className="text-[10px] text-muted-foreground ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
