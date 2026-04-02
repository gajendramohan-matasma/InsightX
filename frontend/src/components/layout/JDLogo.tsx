import { cn } from "@/lib/utils/formatters";

interface JDLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const sizeMap = {
  sm: { logo: "h-8 w-8", text: "text-sm", sub: "text-[9px]" },
  md: { logo: "h-10 w-10", text: "text-base", sub: "text-[10px]" },
  lg: { logo: "h-14 w-14", text: "text-xl", sub: "text-[11px]" },
};

export function JDLogo({ className, size = "md", variant = "dark" }: JDLogoProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* IX logo mark */}
      <svg
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={s.logo}
      >
        <circle cx="40" cy="40" r="40" fill="#367C2B" />
        <text
          x="40"
          y="52"
          textAnchor="middle"
          fill="#FFDE00"
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          fontWeight="900"
          fontSize="36"
          letterSpacing="1"
        >
          IX
        </text>
      </svg>

      <div className="flex flex-col">
        <span
          className={cn("font-bold leading-tight", s.text)}
          style={{ color: variant === "light" ? "#ffffff" : "#367C2B" }}
        >
          InsightX
        </span>
        <span
          className={cn("font-medium tracking-wider uppercase", s.sub)}
          style={{ color: variant === "light" ? "rgba(255,255,255,0.7)" : "#6b7280" }}
        >
          AI Engine
        </span>
      </div>
    </div>
  );
}
