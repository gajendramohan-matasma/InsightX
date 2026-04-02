"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Palette,
  Globe,
  Shield,
  Database,
  Cpu,
  Save,
  Moon,
  Sun,
  Monitor,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";

interface ToggleProps {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

function Toggle({ enabled, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          enabled ? "bg-green-600" : "bg-gray-200"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            enabled && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}

function SelectOption({ label, description, selected, onClick }: { label: string; description: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all w-full",
        selected ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-xs text-gray-400">{description}</div>
      </div>
      {selected && <Check className="h-4 w-4 text-green-600 shrink-0" />}
    </button>
  );
}

type Section = "general" | "notifications" | "appearance" | "data" | "ai" | "security";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="h-4 w-4" /> },
  { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Palette className="h-4 w-4" /> },
  { id: "data", label: "Data & Connectors", icon: <Database className="h-4 w-4" /> },
  { id: "ai", label: "AI Preferences", icon: <Cpu className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Shield className="h-4 w-4" /> },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<Section>("general");
  const [saved, setSaved] = useState(false);

  // General
  const [language, setLanguage] = useState("en");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [queryComplete, setQueryComplete] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);

  // Appearance
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [compactMode, setCompactMode] = useState(false);
  const [animatedCharts, setAnimatedCharts] = useState(true);

  // Data
  const [defaultDataSource, setDefaultDataSource] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("60");
  const [cacheResults, setCacheResults] = useState(true);

  // AI
  const [aiModel, setAiModel] = useState("claude-sonnet");
  const [responseLength, setResponseLength] = useState("balanced");
  const [showToolCalls, setShowToolCalls] = useState(true);
  const [autoSuggest, setAutoSuggest] = useState(true);
  const [streamResponses, setStreamResponses] = useState(true);

  // Security
  const [sessionTimeout, setSessionTimeout] = useState("8");
  const [twoFactor, setTwoFactor] = useState(false);
  const [auditLog, setAuditLog] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Settings className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Preferences</h1>
              <p className="text-sm text-gray-500">Configure your InsightX experience</p>
            </div>
          </div>
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors">
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : "Save All"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Settings nav */}
        <div className="w-52 shrink-0 bg-white border-r border-gray-200 p-3 overflow-auto">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5",
                activeSection === s.id ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl">

            {activeSection === "general" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="pt">Portuguese</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Timezone</label>
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                      <option value="America/Chicago">America/Chicago (CST)</option>
                      <option value="America/Mexico_City">America/Mexico_City (CST)</option>
                      <option value="America/Sao_Paulo">America/Sao_Paulo (BRT)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Date Format</label>
                    <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm divide-y divide-gray-100">
                  <Toggle enabled={emailNotifs} onChange={setEmailNotifs} label="Email Notifications" description="Receive important updates via email" />
                  <Toggle enabled={queryComplete} onChange={setQueryComplete} label="Query Completion Alerts" description="Get notified when long-running queries finish" />
                  <Toggle enabled={weeklyDigest} onChange={setWeeklyDigest} label="Weekly Digest" description="Summary of platform activity and insights every Monday" />
                  <Toggle enabled={alertThresholds} onChange={setAlertThresholds} label="Threshold Alerts" description="Alert when CPH, attrition, or utilization cross set thresholds" />
                  <Toggle enabled={systemUpdates} onChange={setSystemUpdates} label="System Updates" description="Notifications about new features and maintenance" />
                </div>
              </div>
            )}

            {activeSection === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-3">Theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "light" as const, label: "Light", icon: <Sun className="h-5 w-5" />, desc: "Default light theme" },
                        { id: "dark" as const, label: "Dark", icon: <Moon className="h-5 w-5" />, desc: "Easier on the eyes" },
                        { id: "system" as const, label: "System", icon: <Monitor className="h-5 w-5" />, desc: "Match OS setting" },
                      ].map((t) => (
                        <button key={t.id} onClick={() => setTheme(t.id)}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                            theme === t.id ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
                          )}>
                          <span className={theme === t.id ? "text-green-700" : "text-gray-400"}>{t.icon}</span>
                          <span className="text-sm font-medium text-gray-900">{t.label}</span>
                          <span className="text-[10px] text-gray-400">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Toggle enabled={compactMode} onChange={setCompactMode} label="Compact Mode" description="Reduce spacing for more content density" />
                    <Toggle enabled={animatedCharts} onChange={setAnimatedCharts} label="Animated Charts" description="Enable chart transition animations" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "data" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Data & Connectors</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Default Data Source</label>
                    <select value={defaultDataSource} onChange={(e) => setDefaultDataSource(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="all">All Sources</option>
                      <option value="anaplan">Anaplan Only</option>
                      <option value="powerbi">Power BI Only</option>
                      <option value="manual">Manual/Uploaded Only</option>
                    </select>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Toggle enabled={autoRefresh} onChange={setAutoRefresh} label="Auto-Refresh Data" description="Automatically refresh data cubes on schedule" />
                    <Toggle enabled={cacheResults} onChange={setCacheResults} label="Cache Query Results" description="Cache responses for faster repeated queries" />
                  </div>
                  {autoRefresh && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Refresh Interval (seconds)</label>
                      <select value={refreshInterval} onChange={(e) => setRefreshInterval(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                        <option value="30">30 seconds</option>
                        <option value="60">1 minute</option>
                        <option value="300">5 minutes</option>
                        <option value="900">15 minutes</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "ai" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">AI Preferences</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">AI Model</label>
                    <select value={aiModel} onChange={(e) => setAiModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="claude-sonnet">Claude Sonnet 4 (Balanced)</option>
                      <option value="claude-opus">Claude Opus 4 (Most Capable)</option>
                      <option value="claude-haiku">Claude Haiku (Fastest)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-3">Response Length</label>
                    <div className="space-y-2">
                      <SelectOption label="Concise" description="Short, to-the-point answers" selected={responseLength === "concise"} onClick={() => setResponseLength("concise")} />
                      <SelectOption label="Balanced" description="Moderate detail with key insights" selected={responseLength === "balanced"} onClick={() => setResponseLength("balanced")} />
                      <SelectOption label="Detailed" description="Comprehensive analysis with full context" selected={responseLength === "detailed"} onClick={() => setResponseLength("detailed")} />
                    </div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Toggle enabled={showToolCalls} onChange={setShowToolCalls} label="Show Tool Calls" description="Display which data sources and tools are used" />
                    <Toggle enabled={autoSuggest} onChange={setAutoSuggest} label="Auto-Suggest Prompts" description="Show prompt suggestions while typing" />
                    <Toggle enabled={streamResponses} onChange={setStreamResponses} label="Stream Responses" description="Show responses as they are generated" />
                  </div>
                </div>
              </div>
            )}

            {activeSection === "security" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Security</h2>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Session Timeout (hours)</label>
                    <select value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                      <option value="1">1 hour</option>
                      <option value="4">4 hours</option>
                      <option value="8">8 hours</option>
                      <option value="24">24 hours</option>
                    </select>
                  </div>
                  <div className="divide-y divide-gray-100">
                    <Toggle enabled={twoFactor} onChange={setTwoFactor} label="Two-Factor Authentication" description="Require 2FA for account access" />
                    <Toggle enabled={auditLog} onChange={setAuditLog} label="Audit Logging" description="Log all queries and data access for compliance" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
