"use client";

import { useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Download } from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Modal } from "@/components/ui/Modal";

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
  onDownload?: () => void;
}

export function ChartContainer({ title, children, className, onDownload }: ChartContainerProps) {
  const [expanded, setExpanded] = useState(false);

  const chartContent = (
    <div className={cn("bg-white rounded-lg border border-border shadow-sm", className)}>
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Download chart"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={expanded ? "Minimize" : "Expand"}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  if (expanded) {
    return (
      <Modal
        open={expanded}
        onClose={() => setExpanded(false)}
        title={title}
        size="xl"
      >
        <div className="h-[500px]">{children}</div>
      </Modal>
    );
  }

  return chartContent;
}
