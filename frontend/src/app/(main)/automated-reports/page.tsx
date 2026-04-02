"use client";

import { useState } from "react";
import {
  FileBarChart,
  Plus,
  Play,
  Pause,
  Trash2,
  Pencil,
  Clock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Send,
  X,
  ChevronDown,
  ChevronRight,
  BarChart3,
  FileText,
  Table2,
  Download,
  Copy,
  Eye,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";

// ── Types ───────────────────────────────────────────────────────

type ReportStatus = "active" | "paused" | "error" | "draft";
type Frequency = "daily" | "weekly" | "monthly" | "quarterly" | "on-demand";
type OutputFormat = "pdf" | "xlsx" | "csv" | "dashboard" | "email";

interface WorkflowStep {
  id: string;
  type: "data-pull" | "model-run" | "transform" | "generate-report" | "deliver";
  label: string;
  config: Record<string, string>;
  status: "pending" | "running" | "completed" | "error";
}

interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  status: ReportStatus;
  frequency: Frequency;
  cronExpression: string;
  nextRun: string | null;
  lastRun: string | null;
  lastRunStatus: "success" | "error" | "running" | null;
  lastRunDuration: string | null;
  outputFormat: OutputFormat[];
  recipients: string[];
  workflow: WorkflowStep[];
  createdBy: string;
  tags: string[];
}

// ── Seed Data ───────────────────────────────────────────────────

const initialReports: ScheduledReport[] = [
  {
    id: "1",
    name: "Weekly CPH Summary — All Locations",
    description: "Automated weekly CPH report comparing IN, MX, BR against plan. Includes variance analysis, top movers, and AI-generated executive summary.",
    status: "active",
    frequency: "weekly",
    cronExpression: "0 6 * * 1",
    nextRun: "2026-04-06T06:00:00",
    lastRun: "2026-03-30T06:00:00",
    lastRunStatus: "success",
    lastRunDuration: "2m 34s",
    outputFormat: ["pdf", "email"],
    recipients: ["ops.lead@insightx.com", "controller@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull CPH data from Anaplan", config: { source: "Anaplan", model: "CPH Master" }, status: "completed" },
      { id: "s2", type: "data-pull", label: "Pull TWP actuals from Power BI", config: { source: "Power BI", dataset: "TWP Actuals" }, status: "completed" },
      { id: "s3", type: "model-run", label: "Run variance analysis model", config: { model: "Variance Engine", threshold: "3%" }, status: "completed" },
      { id: "s4", type: "transform", label: "Generate AI executive summary", config: { llm: "Claude Sonnet", prompt: "Summarize CPH trends" }, status: "completed" },
      { id: "s5", type: "generate-report", label: "Compile PDF report", config: { template: "Weekly CPH", format: "PDF" }, status: "completed" },
      { id: "s6", type: "deliver", label: "Email to stakeholders", config: { channel: "Email", recipients: "2" }, status: "completed" },
    ],
    createdBy: "admin@insightx.com",
    tags: ["CPH", "Weekly", "All Locations"],
  },
  {
    id: "2",
    name: "Monthly FTE Distribution Report",
    description: "End-of-month FTE distribution across PPA, SAT, C&F, ISG with trend charts and department-level drill-down.",
    status: "active",
    frequency: "monthly",
    cronExpression: "0 7 1 * *",
    nextRun: "2026-05-01T07:00:00",
    lastRun: "2026-04-01T07:00:00",
    lastRunStatus: "success",
    lastRunDuration: "4m 12s",
    outputFormat: ["xlsx", "pdf", "email"],
    recipients: ["hr.lead@insightx.com", "admin@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull FTE data from Anaplan", config: { source: "Anaplan", model: "FTE Master" }, status: "completed" },
      { id: "s2", type: "model-run", label: "Run distribution analysis", config: { model: "FTE Distribution" }, status: "completed" },
      { id: "s3", type: "transform", label: "Generate trend visualizations", config: { charts: "Bar, Pie, Trend" }, status: "completed" },
      { id: "s4", type: "generate-report", label: "Compile Excel + PDF", config: { format: "XLSX + PDF" }, status: "completed" },
      { id: "s5", type: "deliver", label: "Email + SharePoint upload", config: { channel: "Email + SharePoint" }, status: "completed" },
    ],
    createdBy: "admin@insightx.com",
    tags: ["FTE", "Monthly", "Distribution"],
  },
  {
    id: "3",
    name: "Daily Utilization Alert",
    description: "Daily check on utilization rates. Triggers email alert if any department drops below 90% threshold.",
    status: "active",
    frequency: "daily",
    cronExpression: "0 8 * * 1-5",
    nextRun: "2026-04-03T08:00:00",
    lastRun: "2026-04-02T08:00:00",
    lastRunStatus: "success",
    lastRunDuration: "45s",
    outputFormat: ["email"],
    recipients: ["ops.lead@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull utilization from Power BI", config: { source: "Power BI", dataset: "Utilization" }, status: "completed" },
      { id: "s2", type: "model-run", label: "Check threshold breaches", config: { threshold: "90%", metric: "Utilization" }, status: "completed" },
      { id: "s3", type: "deliver", label: "Send alert if breached", config: { channel: "Email", condition: "Below 90%" }, status: "completed" },
    ],
    createdBy: "analyst@insightx.com",
    tags: ["Utilization", "Daily", "Alert"],
  },
  {
    id: "4",
    name: "Quarterly Strategic CPH Review",
    description: "Comprehensive quarterly report with 10-year CPH trends, GCC benchmarking, investment impact modeling, and strategic recommendations.",
    status: "active",
    frequency: "quarterly",
    cronExpression: "0 6 1 1,4,7,10 *",
    nextRun: "2026-07-01T06:00:00",
    lastRun: "2026-04-01T06:00:00",
    lastRunStatus: "success",
    lastRunDuration: "8m 56s",
    outputFormat: ["pdf", "xlsx", "dashboard"],
    recipients: ["leadership@insightx.com", "admin@insightx.com", "controller@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull 10-year CPH history", config: { source: "Anaplan + Power BI", range: "10 years" }, status: "completed" },
      { id: "s2", type: "data-pull", label: "Pull GCC benchmark data", config: { source: "Vault", doc: "GCC_Benchmark_Report" }, status: "completed" },
      { id: "s3", type: "model-run", label: "Run investment impact model", config: { model: "Investment Scenario", scenarios: "3" }, status: "completed" },
      { id: "s4", type: "model-run", label: "Run forecasting model", config: { model: "CPH Forecast", horizon: "4 quarters" }, status: "completed" },
      { id: "s5", type: "transform", label: "AI strategic analysis", config: { llm: "Claude Opus", prompt: "Strategic CPH review" }, status: "completed" },
      { id: "s6", type: "generate-report", label: "Generate report pack", config: { format: "PDF + XLSX + Dashboard" }, status: "completed" },
      { id: "s7", type: "deliver", label: "Email to leadership", config: { channel: "Email", recipients: "3" }, status: "completed" },
    ],
    createdBy: "admin@insightx.com",
    tags: ["CPH", "Quarterly", "Strategic", "Leadership"],
  },
  {
    id: "5",
    name: "Attrition Early Warning",
    description: "Weekly scan of attrition patterns with predictive modeling. Flags departments at risk of exceeding 2.5% voluntary attrition.",
    status: "paused",
    frequency: "weekly",
    cronExpression: "0 7 * * 3",
    nextRun: null,
    lastRun: "2026-03-19T07:00:00",
    lastRunStatus: "error",
    lastRunDuration: "1m 02s",
    outputFormat: ["email", "dashboard"],
    recipients: ["hr.lead@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull attrition data", config: { source: "Power BI", dataset: "HR Attrition" }, status: "completed" },
      { id: "s2", type: "model-run", label: "Run predictive model", config: { model: "Attrition Predictor" }, status: "error" },
      { id: "s3", type: "deliver", label: "Send early warning", config: { channel: "Email + Dashboard" }, status: "pending" },
    ],
    createdBy: "analyst@insightx.com",
    tags: ["Attrition", "Weekly", "Predictive"],
  },
  {
    id: "6",
    name: "Ad-Hoc: What-If CPH Scenario Pack",
    description: "On-demand scenario analysis pack. Runs multiple what-if scenarios (forex, utilization, headcount) and generates comparison report.",
    status: "draft",
    frequency: "on-demand",
    cronExpression: "",
    nextRun: null,
    lastRun: null,
    lastRunStatus: null,
    lastRunDuration: null,
    outputFormat: ["pdf", "xlsx"],
    recipients: ["admin@insightx.com"],
    workflow: [
      { id: "s1", type: "data-pull", label: "Pull current CPH baseline", config: { source: "Anaplan" }, status: "pending" },
      { id: "s2", type: "model-run", label: "Run forex scenario (INR 95)", config: { model: "What-If", param: "INR 95" }, status: "pending" },
      { id: "s3", type: "model-run", label: "Run utilization scenario (35%)", config: { model: "What-If", param: "MX Util 35%" }, status: "pending" },
      { id: "s4", type: "model-run", label: "Run HC reduction scenario", config: { model: "What-If", param: "HC -5%" }, status: "pending" },
      { id: "s5", type: "transform", label: "Compare all scenarios", config: { type: "Comparison matrix" }, status: "pending" },
      { id: "s6", type: "generate-report", label: "Generate scenario pack", config: { format: "PDF + XLSX" }, status: "pending" },
    ],
    createdBy: "admin@insightx.com",
    tags: ["What-If", "CPH", "On-Demand"],
  },
];

// ── Helpers ─────────────────────────────────────────────────────

const statusConfig: Record<ReportStatus, { variant: "success" | "warning" | "error" | "default"; label: string }> = {
  active: { variant: "success", label: "Active" },
  paused: { variant: "warning", label: "Paused" },
  error: { variant: "error", label: "Error" },
  draft: { variant: "default", label: "Draft" },
};

const freqLabels: Record<Frequency, string> = {
  daily: "Daily", weekly: "Weekly", monthly: "Monthly", quarterly: "Quarterly", "on-demand": "On-Demand",
};

const stepIcons: Record<string, React.ReactNode> = {
  "data-pull": <Download className="h-3.5 w-3.5" />,
  "model-run": <Sparkles className="h-3.5 w-3.5" />,
  "transform": <BarChart3 className="h-3.5 w-3.5" />,
  "generate-report": <FileText className="h-3.5 w-3.5" />,
  "deliver": <Send className="h-3.5 w-3.5" />,
};

const stepStatusColors: Record<string, string> = {
  completed: "bg-green-500",
  running: "bg-blue-500 animate-pulse",
  error: "bg-red-500",
  pending: "bg-gray-300",
};

function formatNextRun(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.round((d.getTime() - now.getTime()) / 3600000);
  if (diffH < 0) return "Overdue";
  if (diffH < 24) return `In ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `In ${diffD}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatLastRun(ts: string | null) {
  if (!ts) return "Never";
  const d = new Date(ts);
  const now = new Date();
  const diffH = Math.round((now.getTime() - d.getTime()) / 3600000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.round(diffH / 24);
  return `${diffD}d ago`;
}

// ── Components ──────────────────────────────────────────────────

const stepTypeLabels: Record<string, string> = {
  "data-pull": "Data Pull",
  "model-run": "Model Run",
  "transform": "Transform",
  "generate-report": "Generate Report",
  "deliver": "Deliver",
};

function WorkflowTimeline({
  steps,
  editing,
  onUpdateStep,
  onRemoveStep,
  onAddStep,
  onMoveStep,
}: {
  steps: WorkflowStep[];
  editing?: boolean;
  onUpdateStep?: (idx: number, updates: Partial<WorkflowStep>) => void;
  onRemoveStep?: (idx: number) => void;
  onAddStep?: (afterIdx: number) => void;
  onMoveStep?: (idx: number, direction: "up" | "down") => void;
}) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3 group">
          <div className="flex flex-col items-center">
            <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white shrink-0", stepStatusColors[step.status])}>
              {stepIcons[step.type] || <FileText className="h-3 w-3" />}
            </div>
            {i < steps.length - 1 && <div className="w-0.5 h-6 bg-gray-200" />}
          </div>
          <div className="pb-4 flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <select
                  value={step.type}
                  onChange={(e) => onUpdateStep?.(i, { type: e.target.value as WorkflowStep["type"] })}
                  className="px-2 py-1 rounded border border-gray-200 text-[11px] font-medium text-gray-600 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-green-600"
                >
                  {Object.entries(stepTypeLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={step.label}
                  onChange={(e) => onUpdateStep?.(i, { label: e.target.value })}
                  className="flex-1 px-2 py-1 rounded border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-green-600"
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  {i > 0 && (
                    <button onClick={() => onMoveStep?.(i, "up")} className="p-1 rounded hover:bg-gray-100" title="Move up">
                      <ChevronDown className="h-3 w-3 text-gray-400 rotate-180" />
                    </button>
                  )}
                  {i < steps.length - 1 && (
                    <button onClick={() => onMoveStep?.(i, "down")} className="p-1 rounded hover:bg-gray-100" title="Move down">
                      <ChevronDown className="h-3 w-3 text-gray-400" />
                    </button>
                  )}
                  {steps.length > 1 && (
                    <button onClick={() => onRemoveStep?.(i)} className="p-1 rounded hover:bg-red-50" title="Remove step">
                      <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="text-xs font-medium text-gray-800">{step.label}</div>
                <div className="text-[10px] text-gray-400">
                  {Object.entries(step.config).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                </div>
              </>
            )}
          </div>
        </div>
      ))}
      {editing && (
        <button
          onClick={() => onAddStep?.(steps.length - 1)}
          className="flex items-center gap-2 ml-9 mt-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-xs text-gray-500 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Step
        </button>
      )}
    </div>
  );
}

function ReportCard({
  report,
  onToggle,
  onRun,
  onDelete,
  onUpdateWorkflow,
}: {
  report: ScheduledReport;
  onToggle: (id: string) => void;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateWorkflow: (id: string, steps: WorkflowStep[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(false);
  const [editSteps, setEditSteps] = useState<WorkflowStep[]>(report.workflow);
  const st = statusConfig[report.status];

  const handleStartEdit = () => {
    setEditSteps([...report.workflow]);
    setEditingWorkflow(true);
    setExpanded(true);
  };

  const handleSaveWorkflow = () => {
    onUpdateWorkflow(report.id, editSteps);
    setEditingWorkflow(false);
  };

  const handleCancelEdit = () => {
    setEditSteps([...report.workflow]);
    setEditingWorkflow(false);
  };

  const handleUpdateStep = (idx: number, updates: Partial<WorkflowStep>) => {
    setEditSteps((prev) => prev.map((s, i) => i === idx ? { ...s, ...updates } : s));
  };

  const handleRemoveStep = (idx: number) => {
    setEditSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddStep = (afterIdx: number) => {
    const newStep: WorkflowStep = {
      id: `s${Date.now()}`,
      type: "model-run",
      label: "New step",
      config: {},
      status: "pending",
    };
    setEditSteps((prev) => [...prev.slice(0, afterIdx), newStep, ...prev.slice(afterIdx)]);
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    setEditSteps((prev) => {
      const arr = [...prev];
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= arr.length) return arr;
      [arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]];
      return arr;
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold text-gray-900">{report.name}</h3>
              <Badge variant={st.variant}>{st.label}</Badge>
              <Badge variant="default">{freqLabels[report.frequency]}</Badge>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{report.description}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {report.status !== "draft" && (
              <button onClick={() => onToggle(report.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={report.status === "active" ? "Pause" : "Resume"}>
                {report.status === "active" ? <Pause className="h-4 w-4 text-gray-400" /> : <Play className="h-4 w-4 text-gray-400" />}
              </button>
            )}
            <button onClick={() => onRun(report.id)} className="p-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors" title="Run now">
              <Play className="h-4 w-4" />
            </button>
            <button onClick={() => onDelete(report.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete">
              <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-5 mt-3 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            <span>Next: <strong className="text-gray-700">{formatNextRun(report.nextRun)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Last: <strong className="text-gray-700">{formatLastRun(report.lastRun)}</strong></span>
            {report.lastRunStatus === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
            {report.lastRunStatus === "error" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
            {report.lastRunStatus === "running" && <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />}
            {report.lastRunDuration && <span className="text-gray-400">({report.lastRunDuration})</span>}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Mail className="h-3.5 w-3.5" />
            <span>{report.recipients.length} recipient{report.recipients.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {report.outputFormat.map((f) => (
              <span key={f} className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-600 uppercase">{f}</span>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 mt-2">
          {report.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Workflow expand */}
      <div className="border-t border-gray-100">
        <div className="flex items-center justify-between px-5 py-2.5">
          <button onClick={() => { setExpanded(!expanded); if (editingWorkflow && !expanded) return; }}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            <Settings2 className="h-3.5 w-3.5" />
            Workflow ({editingWorkflow ? editSteps.length : report.workflow.length} steps)
          </button>
          <div className="flex items-center gap-1.5">
            {editingWorkflow ? (
              <>
                <button onClick={handleCancelEdit}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveWorkflow}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-green-700 text-white hover:bg-green-800 transition-colors flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Save
                </button>
              </>
            ) : (
              <button onClick={handleStartEdit}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 transition-colors">
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
        </div>
        {expanded && (
          <div className="px-5 pb-4">
            <WorkflowTimeline
              steps={editingWorkflow ? editSteps : report.workflow}
              editing={editingWorkflow}
              onUpdateStep={handleUpdateStep}
              onRemoveStep={handleRemoveStep}
              onAddStep={handleAddStep}
              onMoveStep={handleMoveStep}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CreateReportModal({ onClose, onAdd }: { onClose: () => void; onAdd: (r: Partial<ScheduledReport>) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("weekly");
  const [cronDay, setCronDay] = useState("1"); // Mon
  const [cronHour, setCronHour] = useState("6");
  const [outputFormats, setOutputFormats] = useState<OutputFormat[]>(["pdf", "email"]);
  const [recipients, setRecipients] = useState("admin@insightx.com");
  const [steps, setSteps] = useState([
    { type: "data-pull", label: "Pull data from source" },
    { type: "model-run", label: "Run analysis model" },
    { type: "generate-report", label: "Generate report" },
    { type: "deliver", label: "Deliver to recipients" },
  ]);
  const [newStepLabel, setNewStepLabel] = useState("");
  const [newStepType, setNewStepType] = useState("model-run");

  const toggleFormat = (f: OutputFormat) => {
    setOutputFormats((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const addStep = () => {
    if (!newStepLabel.trim()) return;
    setSteps((prev) => [...prev.slice(0, -1), { type: newStepType, label: newStepLabel.trim() }, prev[prev.length - 1]]);
    setNewStepLabel("");
  };

  const removeStep = (i: number) => {
    if (steps.length <= 2) return; // Keep at least pull + deliver
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const cronExpr = frequency === "daily" ? `0 ${cronHour} * * 1-5`
      : frequency === "weekly" ? `0 ${cronHour} * * ${cronDay}`
      : frequency === "monthly" ? `0 ${cronHour} 1 * *`
      : frequency === "quarterly" ? `0 ${cronHour} 1 1,4,7,10 *`
      : "";
    onAdd({
      name: name.trim(),
      description: description.trim(),
      status: frequency === "on-demand" ? "draft" : "active",
      frequency,
      cronExpression: cronExpr,
      nextRun: frequency !== "on-demand" ? new Date(Date.now() + 86400000).toISOString() : null,
      lastRun: null,
      lastRunStatus: null,
      lastRunDuration: null,
      outputFormat: outputFormats,
      recipients: recipients.split(",").map((r) => r.trim()).filter(Boolean),
      workflow: steps.map((s, i) => ({
        id: `s${i + 1}`,
        type: s.type as WorkflowStep["type"],
        label: s.label,
        config: {},
        status: "pending" as const,
      })),
      createdBy: "admin@insightx.com",
      tags: [freqLabels[frequency], name.split(" ")[0]],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl m-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-700" />
            <h3 className="text-base font-semibold text-gray-900">Create Automated Report</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Report Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekly CPH Summary"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this report cover?"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none" />
            </div>
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Schedule</label>
            <div className="flex items-center gap-3">
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="daily">Daily (Weekdays)</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly (1st)</option>
                <option value="quarterly">Quarterly</option>
                <option value="on-demand">On-Demand</option>
              </select>
              {frequency === "weekly" && (
                <select value={cronDay} onChange={(e) => setCronDay(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                  {["1-Mon","2-Tue","3-Wed","4-Thu","5-Fri"].map((d) => (
                    <option key={d} value={d.split("-")[0]}>{d.split("-")[1]}</option>
                  ))}
                </select>
              )}
              {frequency !== "on-demand" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">at</span>
                  <select value={cronHour} onChange={(e) => setCronHour(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Output format */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Output Format</label>
            <div className="flex flex-wrap gap-2">
              {(["pdf", "xlsx", "csv", "dashboard", "email"] as OutputFormat[]).map((f) => (
                <button key={f} onClick={() => toggleFormat(f)}
                  className={cn("px-3 py-1.5 rounded-lg border text-xs font-medium uppercase transition-colors",
                    outputFormats.includes(f) ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Recipients (comma-separated)</label>
            <input type="text" value={recipients} onChange={(e) => setRecipients(e.target.value)}
              placeholder="user@insightx.com, ops.lead@insightx.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
          </div>

          {/* Workflow steps */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Workflow Steps</label>
            <div className="space-y-2 mb-3">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
                  <span className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center text-white text-[10px] font-bold">{i + 1}</span>
                  <span className="text-xs text-gray-400 uppercase w-20 shrink-0">{step.type}</span>
                  <span className="text-sm text-gray-800 flex-1">{step.label}</span>
                  {steps.length > 2 && (
                    <button onClick={() => removeStep(i)} className="p-1 rounded hover:bg-red-50">
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select value={newStepType} onChange={(e) => setNewStepType(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="data-pull">Data Pull</option>
                <option value="model-run">Model Run</option>
                <option value="transform">Transform</option>
                <option value="generate-report">Generate Report</option>
              </select>
              <input type="text" value={newStepLabel} onChange={(e) => setNewStepLabel(e.target.value)}
                placeholder="Step description..." onKeyDown={(e) => e.key === "Enter" && addStep()}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600" />
              <button onClick={addStep} disabled={!newStepLabel.trim()}
                className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors">
                Add Step
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!name.trim()}
            className="px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Create Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function AutomatedReportsPage() {
  const [reports, setReports] = useState(initialReports);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = reports.filter((r) => {
    if (filter !== "all" && r.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q));
    }
    return true;
  });

  const handleToggle = (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: r.status === "active" ? "paused" as ReportStatus : "active" as ReportStatus } : r));
  };

  const handleRun = (id: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, lastRun: new Date().toISOString(), lastRunStatus: "running" as const } : r));
    setTimeout(() => {
      setReports((prev) => prev.map((r) => r.id === id && r.lastRunStatus === "running" ? { ...r, lastRunStatus: "success", lastRunDuration: "1m 15s" } : r));
    }, 3000);
  };

  const handleDelete = (id: string) => setReports((prev) => prev.filter((r) => r.id !== id));

  const handleUpdateWorkflow = (id: string, steps: WorkflowStep[]) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, workflow: steps } : r));
  };

  const handleAdd = (partial: Partial<ScheduledReport>) => {
    const newReport: ScheduledReport = {
      id: String(Date.now()),
      name: partial.name ?? "Untitled",
      description: partial.description ?? "",
      status: partial.status ?? "draft",
      frequency: partial.frequency ?? "on-demand",
      cronExpression: partial.cronExpression ?? "",
      nextRun: partial.nextRun ?? null,
      lastRun: null,
      lastRunStatus: null,
      lastRunDuration: null,
      outputFormat: partial.outputFormat ?? ["pdf"],
      recipients: partial.recipients ?? [],
      workflow: partial.workflow ?? [],
      createdBy: "admin@insightx.com",
      tags: partial.tags ?? [],
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const activeCount = reports.filter((r) => r.status === "active").length;
  const pausedCount = reports.filter((r) => r.status === "paused").length;
  const errorCount = reports.filter((r) => r.status === "error" || r.lastRunStatus === "error").length;

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <FileBarChart className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Automated Reports</h1>
                <p className="text-sm text-gray-500">Orchestrate analytics workflows with scheduled delivery</p>
              </div>
            </div>
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors">
              <Plus className="h-4 w-4" />
              New Report
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Total Reports</div>
            <div className="text-2xl font-bold text-gray-900">{reports.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Active</div>
            <div className="text-2xl font-bold text-green-700">{activeCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Paused</div>
            <div className="text-2xl font-bold text-amber-600">{pausedCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
            <div className="text-[10px] text-gray-400 uppercase font-medium">Errors</div>
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-md">
            <FileBarChart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search reports..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent" />
          </div>
          <div className="flex gap-1.5">
            {(["all", "active", "paused", "error", "draft"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize",
                  filter === f ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                )}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Report list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileBarChart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600 mb-1">No reports found</h3>
            <p className="text-sm text-gray-400">Create your first automated report to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => (
              <ReportCard key={r.id} report={r} onToggle={handleToggle} onRun={handleRun} onDelete={handleDelete} onUpdateWorkflow={handleUpdateWorkflow} />
            ))}
          </div>
        )}
      </div>

      {showCreate && <CreateReportModal onClose={() => setShowCreate(false)} onAdd={handleAdd} />}
    </div>
  );
}
