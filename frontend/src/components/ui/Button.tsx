"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

const variants = {
  primary:
    "bg-jd-green text-white hover:bg-jd-green-dark active:bg-jd-green-800 focus-visible:ring-jd-green",
  secondary:
    "border-2 border-jd-green text-jd-green hover:bg-jd-green-50 active:bg-jd-green-100 focus-visible:ring-jd-green",
  accent:
    "bg-jd-yellow text-jd-green-900 hover:bg-jd-yellow-500 active:bg-jd-yellow-600 focus-visible:ring-jd-yellow",
  ghost:
    "text-foreground hover:bg-muted active:bg-gray-200 focus-visible:ring-jd-green",
  destructive:
    "bg-destructive text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-destructive",
} as const;

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-6 text-base gap-2.5 rounded-lg",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
