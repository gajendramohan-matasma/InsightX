"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/formatters";

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id ?? "");

  function handleTabClick(tabId: string) {
    setActiveTab(tabId);
    onChange?.(tabId);
  }

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="border-b border-border" role="tablist">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                "hover:text-jd-green",
                activeTab === tab.id
                  ? "text-jd-green"
                  : "text-muted-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-jd-green rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="pt-4" role="tabpanel">
        {activeContent}
      </div>
    </div>
  );
}
