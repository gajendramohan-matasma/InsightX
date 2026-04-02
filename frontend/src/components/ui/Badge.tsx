import { cn } from "@/lib/utils/formatters";
import type { HTMLAttributes } from "react";

const badgeVariants = {
  default: "bg-gray-100 text-gray-800",
  success: "bg-jd-green-50 text-jd-green-700 border-jd-green-200",
  warning: "bg-jd-yellow-50 text-jd-yellow-700 border-jd-yellow-300",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
} as const;

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof badgeVariants;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
