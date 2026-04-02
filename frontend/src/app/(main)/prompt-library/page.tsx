"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Play,
  Plus,
  Star,
  StarOff,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Send,
  ChevronDown,
  ChevronRight,
  Copy,
  Pencil,
  X,
  Lightbulb,
  Users,
  BarChart3,
  Target,
  Cpu,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";

// ── Types ───────────────────────────────────────────────────────

interface Prompt {
  id: string;
  title: string;
  prompt: string;
  category: string;
  area: string;
  isSystem: boolean;
  isFavorite: boolean;
  effectiveness: number; // 0-100
  usageCount: number;
  lastUsed: string | null;
  suggestedImprovement: string | null;
}

// ── Seed Data ───────────────────────────────────────────────────

const categories = [
  { id: "benchmarking", label: "Benchmarking & Strategy", icon: <Target className="h-4 w-4" /> },
  { id: "cph-trends", label: "CPH Trends & Analysis", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "cost-drivers", label: "Cost Drivers & Levers", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "scenarios", label: "What-If Scenarios", icon: <Cpu className="h-4 w-4" /> },
  { id: "twp", label: "TWP & Workforce Mix", icon: <Users className="h-4 w-4" /> },
  { id: "reporting", label: "Reporting & Insights", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "custom", label: "My Prompts", icon: <Pencil className="h-4 w-4" /> },
];

const initialPrompts: Prompt[] = [
  // ── Benchmarking & Strategy ──────────────────────────────
  {
    id: "1", title: "ETEC CPH: India, Mexico, Brazil vs USA",
    prompt: "What is the ETEC CPH for India, Mexico, Brazil in comparison with USA?",
    category: "benchmarking", area: "Regional CPH", isSystem: true, isFavorite: true,
    effectiveness: 94, usageCount: 62, lastUsed: "1h ago", suggestedImprovement: null,
  },
  {
    id: "2", title: "10-Year CPH Trend vs HCC (USA)",
    prompt: "Can you share the past 10 years CPH trend of ETEC India, Mexico, Brazil? How it is in comparison with HCC (USA)?",
    category: "benchmarking", area: "Historical Trend", isSystem: true, isFavorite: true,
    effectiveness: 91, usageCount: 45, lastUsed: "3h ago", suggestedImprovement: null,
  },
  {
    id: "3", title: "ETEC vs Global GCC Competitiveness",
    prompt: "How is ETEC CPH compared with other GCC's across Industries. Is ETEC still competitive for the value delivered?",
    category: "benchmarking", area: "GCC Benchmark", isSystem: true, isFavorite: true,
    effectiveness: 87, usageCount: 28, lastUsed: "2d ago", suggestedImprovement: null,
  },
  {
    id: "4", title: "Best-in-Class GCC Comparison",
    prompt: "Hey, what better we can do on our CPH with reference to best-in-class GCC available globally?",
    category: "benchmarking", area: "GCC Benchmark", isSystem: true, isFavorite: false,
    effectiveness: 83, usageCount: 19, lastUsed: "5d ago", suggestedImprovement: "Consider specifying industries: 'Compare against automotive, ag-tech, and heavy machinery GCCs specifically.'",
  },
  {
    id: "5", title: "Differentiated Capability vs Execution Cost",
    prompt: "What portion of ETEC cost per hour is for differentiated technical capability versus simply funding execution capacity?",
    category: "benchmarking", area: "Value Analysis", isSystem: true, isFavorite: false,
    effectiveness: 80, usageCount: 15, lastUsed: "1w ago", suggestedImprovement: null,
  },
  {
    id: "6", title: "3-Year Strategic CPH Outlook",
    prompt: "Three years from now, will today's CPH and TWP decisions make Deere faster, safer, and more technology capable? or it will make us just cheaper?",
    category: "benchmarking", area: "Strategy", isSystem: true, isFavorite: true,
    effectiveness: 88, usageCount: 32, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "7", title: "Strategic CPH in High-Value Areas",
    prompt: "Are we seeing higher CPH in areas that are intentionally strategic (Embedded, simulation, autonomy projects, digital), and lower CPH where work should be standardized or commoditized?",
    category: "benchmarking", area: "Strategy", isSystem: true, isFavorite: false,
    effectiveness: 85, usageCount: 22, lastUsed: "3d ago", suggestedImprovement: null,
  },

  // ── CPH Trends & Analysis ────────────────────────────────
  {
    id: "8", title: "Month-on-Month CPH (IN, MX, BR)",
    prompt: "What is month on month CPH for IN, MX, BR",
    category: "cph-trends", area: "Monthly Trend", isSystem: true, isFavorite: true,
    effectiveness: 95, usageCount: 78, lastUsed: "30m ago", suggestedImprovement: null,
  },
  {
    id: "9", title: "Year-on-Year CPH Trend (IN, MX, BR)",
    prompt: "What is year on year trend of CPH for IN, MX, BR",
    category: "cph-trends", area: "YoY Trend", isSystem: true, isFavorite: true,
    effectiveness: 93, usageCount: 65, lastUsed: "2h ago", suggestedImprovement: null,
  },
  {
    id: "10", title: "CPH Drivers for Specific Month",
    prompt: "What are the major contributors for CPH increase or decrease for a specific month?",
    category: "cph-trends", area: "Root Cause", isSystem: true, isFavorite: false,
    effectiveness: 89, usageCount: 41, lastUsed: "4h ago", suggestedImprovement: "Specify the month: 'What are the major contributors for CPH increase in Jan 2026?'",
  },
  {
    id: "11", title: "Jan'26 CPH Inflated — Why?",
    prompt: "I am not sure why CPH is showing inflated in Jan'26? Share your insights",
    category: "cph-trends", area: "Root Cause", isSystem: true, isFavorite: false,
    effectiveness: 86, usageCount: 33, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "12", title: "YoY CPH vs Output & Quality",
    prompt: "How does the YoY change in cost per hour compare to YoY change in output, quality, and delivery performance?",
    category: "cph-trends", area: "Value Correlation", isSystem: true, isFavorite: true,
    effectiveness: 82, usageCount: 24, lastUsed: "3d ago", suggestedImprovement: null,
  },
  {
    id: "13", title: "SCM CPH in Q1",
    prompt: "what was CPH of SCM in Q1 ?",
    category: "cph-trends", area: "Function CPH", isSystem: true, isFavorite: false,
    effectiveness: 92, usageCount: 38, lastUsed: "6h ago", suggestedImprovement: null,
  },
  {
    id: "14", title: "Functions Meeting OB CPH",
    prompt: "Which functions are meeting their OB CPH, and which are not. What are the reasons for not meeting the OB.",
    category: "cph-trends", area: "OB Tracking", isSystem: true, isFavorite: true,
    effectiveness: 90, usageCount: 52, lastUsed: "1h ago", suggestedImprovement: null,
  },
  {
    id: "15", title: "YTD CPH Drivers — Why Higher Than OB?",
    prompt: "Tell me factors driving the YTD CPH going higher than my OB?",
    category: "cph-trends", area: "OB Tracking", isSystem: true, isFavorite: false,
    effectiveness: 88, usageCount: 36, lastUsed: "5h ago", suggestedImprovement: null,
  },

  // ── Cost Drivers & Levers ────────────────────────────────
  {
    id: "16", title: "True Cost vs Absorbable Inefficiency",
    prompt: "How much of today's cost per hour is \"true cost\" versus temporary or absorbable inefficiency (under-utilization, admin roles, grade-mix, IPN etc)?",
    category: "cost-drivers", area: "Cost Structure", isSystem: true, isFavorite: true,
    effectiveness: 84, usageCount: 27, lastUsed: "2d ago", suggestedImprovement: null,
  },
  {
    id: "17", title: "Structural vs Management-Driven CPH Increase",
    prompt: "What portion of the YoY CPH increase is structural (salary, IPN allocation etc) versus management-driven (grade mix, suppliers, staffing delays etc)?",
    category: "cost-drivers", area: "Cost Decomposition", isSystem: true, isFavorite: true,
    effectiveness: 86, usageCount: 31, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "18", title: "Contingent Cost Insights & Reduction",
    prompt: "Share your insights on contingent cost based on current trend of CPH? What should I do to reduce this cost by 5 % in totality? Give me options",
    category: "cost-drivers", area: "Contingent", isSystem: true, isFavorite: false,
    effectiveness: 81, usageCount: 20, lastUsed: "3d ago", suggestedImprovement: null,
  },
  {
    id: "19", title: "IPN Cost Comparison Across Cost Centers",
    prompt: "Show me IPN cost comparison of all different cost centers (YTD level). Can u corelate with number of employees at respective departments?",
    category: "cost-drivers", area: "IPN", isSystem: true, isFavorite: false,
    effectiveness: 85, usageCount: 25, lastUsed: "2d ago", suggestedImprovement: null,
  },
  {
    id: "20", title: "Travel Cost Contribution to CPH",
    prompt: "What is contribution of Travel cost ( Non-Chargeable) on current CPH?",
    category: "cost-drivers", area: "Non-Chargeable", isSystem: true, isFavorite: false,
    effectiveness: 88, usageCount: 22, lastUsed: "4d ago", suggestedImprovement: null,
  },
  {
    id: "21", title: "Churn & Contract Dependency Risk",
    prompt: "Which competencies are most sensitive to workforce churn or contract dependency, and what is the long-term technology risk of that mix?",
    category: "cost-drivers", area: "Risk", isSystem: true, isFavorite: false,
    effectiveness: 79, usageCount: 14, lastUsed: "1w ago", suggestedImprovement: null,
  },

  // ── What-If Scenarios ────────────────────────────────────
  {
    id: "22", title: "$250M India Infrastructure Investment Impact",
    prompt: "If we invest $250 M in infrastructure at India over next 5 years, what impact it will have on CPH? How much CPH will increase for every additional $1Mn spending?",
    category: "scenarios", area: "Investment", isSystem: true, isFavorite: true,
    effectiveness: 78, usageCount: 18, lastUsed: "3d ago", suggestedImprovement: null,
  },
  {
    id: "23", title: "Flat Rates for 3 Years — Sustainable?",
    prompt: "If ETEC rates are kept flat or down for stakeholders for next 3 years, will we be able to absorb inflation internally—and is that sustainable?",
    category: "scenarios", area: "Pricing", isSystem: true, isFavorite: true,
    effectiveness: 82, usageCount: 21, lastUsed: "2d ago", suggestedImprovement: null,
  },
  {
    id: "24", title: "Non-Chargeable Expense Give-Away Impact",
    prompt: "If we hold or give away xx% of non-chargeable expenses, how much would it reduce CPH?",
    category: "scenarios", area: "Cost Reduction", isSystem: true, isFavorite: false,
    effectiveness: 87, usageCount: 30, lastUsed: "1d ago", suggestedImprovement: "Replace xx% with a specific value for more precise analysis, e.g., 'If we give away 15% of non-chargeable expenses...'",
  },
  {
    id: "25", title: "TWP & Non-Deere Adjustment Impact",
    prompt: "If we reduce/increase TWP by xx% and reduce/increase Non-Deere by xx%, what would be the impact on CPH",
    category: "scenarios", area: "Workforce Mix", isSystem: true, isFavorite: false,
    effectiveness: 84, usageCount: 26, lastUsed: "2d ago", suggestedImprovement: "Specify values: 'If we reduce TWP by 5% and increase Non-Deere by 10%...'",
  },
  {
    id: "26", title: "Open Position Give-Away Impact",
    prompt: "If we give away xx% of open positions, would it impact CPH?",
    category: "scenarios", area: "Workforce Mix", isSystem: true, isFavorite: false,
    effectiveness: 83, usageCount: 19, lastUsed: "4d ago", suggestedImprovement: "Specify: 'If we give away 20% of open positions in Engineering and Manufacturing...'",
  },
  {
    id: "27", title: "Mexico Utilization at 35% — New CPH?",
    prompt: "If Mexico utilization goes to 35 %, what will be new CPH?",
    category: "scenarios", area: "Utilization", isSystem: true, isFavorite: false,
    effectiveness: 91, usageCount: 34, lastUsed: "6h ago", suggestedImprovement: null,
  },
  {
    id: "28", title: "Keep CPH at OB While Reducing HC",
    prompt: "What are my options to keep my CPH at OB but rescuing Deere HC by 5 numbers ( 2 LG 8, 1 LG 7, 2 LG 6)?",
    category: "scenarios", area: "HC Optimization", isSystem: true, isFavorite: true,
    effectiveness: 85, usageCount: 29, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "29", title: "Utilization Target for 10-Cent CPH Improvement",
    prompt: "What utilization should be targeted to improve CPH by 10 cents ?",
    category: "scenarios", area: "Utilization", isSystem: true, isFavorite: false,
    effectiveness: 90, usageCount: 37, lastUsed: "5h ago", suggestedImprovement: null,
  },
  {
    id: "30", title: "CPH Below 21.6 — Immediate Steps",
    prompt: "To make my CPH stay less than 21.6, what immediate steps can I take with immediate effect?",
    category: "scenarios", area: "Cost Reduction", isSystem: true, isFavorite: true,
    effectiveness: 88, usageCount: 40, lastUsed: "2h ago", suggestedImprovement: null,
  },
  {
    id: "31", title: "Employment Cost +5% Impact on CPH",
    prompt: "If my department's employment cost goes up by 5 %, what will be CPH at same billable hours ?",
    category: "scenarios", area: "Cost Modeling", isSystem: true, isFavorite: false,
    effectiveness: 92, usageCount: 33, lastUsed: "8h ago", suggestedImprovement: null,
  },
  {
    id: "32", title: "3000 Missed Billable Hours Impact",
    prompt: "Can u estimate CPH impact if my employees missed 3000 hours to invoice in current month?",
    category: "scenarios", area: "Billable Hours", isSystem: true, isFavorite: false,
    effectiveness: 89, usageCount: 27, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "33", title: "INR 95 Dollar Conversion Impact",
    prompt: "If dollar conversion changes to INR 95, what impact will be on CPH?",
    category: "scenarios", area: "Forex", isSystem: true, isFavorite: false,
    effectiveness: 93, usageCount: 42, lastUsed: "3h ago", suggestedImprovement: null,
  },
  {
    id: "34", title: "Move Entire ND Business to Cyient",
    prompt: "If I move my entire ND business to Cyient, what will be new CPH?",
    category: "scenarios", area: "Outsourcing", isSystem: true, isFavorite: false,
    effectiveness: 77, usageCount: 11, lastUsed: "1w ago", suggestedImprovement: null,
  },
  {
    id: "35", title: "Double Innovation & AI Output — CPH Impact",
    prompt: "If ETEC is asked to double the innovation and AI output in a product engineering domain, what would be the impact of this on CPH?",
    category: "scenarios", area: "Innovation", isSystem: true, isFavorite: true,
    effectiveness: 80, usageCount: 16, lastUsed: "5d ago", suggestedImprovement: null,
  },

  // ── TWP & Workforce Mix ──────────────────────────────────
  {
    id: "36", title: "TWP Off-Target Gaps & CPH Impact",
    prompt: "Where are we currently off-target versus TWP (by region or competency), and what is the quantified CPH impact of those gaps?",
    category: "twp", area: "TWP Gaps", isSystem: true, isFavorite: true,
    effectiveness: 87, usageCount: 35, lastUsed: "4h ago", suggestedImprovement: null,
  },
  {
    id: "37", title: "Leading Indicators for Future CPH",
    prompt: "What leading indicators tell us whether today's TWP decisions will increase or decrease ETEC cost per hour in six to twelve months from now?",
    category: "twp", area: "Predictive", isSystem: true, isFavorite: true,
    effectiveness: 81, usageCount: 20, lastUsed: "3d ago", suggestedImprovement: null,
  },
  {
    id: "38", title: "Employees Pulling Billable Hours Down",
    prompt: "Tell me the employees who are continuously pulling my team's billable hours down ( Plan vs actual)?",
    category: "twp", area: "Utilization", isSystem: true, isFavorite: false,
    effectiveness: 86, usageCount: 31, lastUsed: "1d ago", suggestedImprovement: null,
  },
  {
    id: "39", title: "Supervisor Utilization Report FY26",
    prompt: "make a supervisor level utilization report (month on month) for FY26 YTD. Also predict the CPH if the utilization would have be constant at 96%",
    category: "twp", area: "Utilization", isSystem: true, isFavorite: false,
    effectiveness: 84, usageCount: 18, lastUsed: "2d ago", suggestedImprovement: null,
  },

  // ── Reporting & Insights ─────────────────────────────────
  {
    id: "40", title: "YTD One-Pager Summary",
    prompt: "Make me a quick one pager showing my YTD values of Employment cost, IPN cost, Support cost, Contingent cost, Billable hours, CPH. The report must include some positive factors of YTD CPH & improvement areas to work upon.",
    category: "reporting", area: "Executive Summary", isSystem: true, isFavorite: true,
    effectiveness: 93, usageCount: 55, lastUsed: "1h ago", suggestedImprovement: null,
  },
  {
    id: "41", title: "3-Year Net Expense, Hours & CPH Trendline",
    prompt: "Prepare a Trend line of Net expense, billable Hour & CPH for last 3 years of PU030708? Share your insights also.",
    category: "reporting", area: "Trendline", isSystem: true, isFavorite: false,
    effectiveness: 86, usageCount: 23, lastUsed: "3d ago", suggestedImprovement: null,
  },
];

// ── Components ──────────────────────────────────────────────────

function EffectivenessBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-green-500" : value >= 70 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-semibold text-gray-600 tabular-nums w-8">{value}%</span>
    </div>
  );
}

function PromptCard({
  prompt,
  onRun,
  onToggleFavorite,
  onRate,
}: {
  prompt: Prompt;
  onRun: (p: Prompt) => void;
  onToggleFavorite: (id: string) => void;
  onRate: (id: string, positive: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">{prompt.title}</h3>
            {prompt.isSystem && (
              <Badge variant="info" className="text-[9px] px-1.5 py-0">System</Badge>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 text-left leading-relaxed hover:text-gray-700 transition-colors"
          >
            {expanded ? prompt.prompt : prompt.prompt.length > 120 ? prompt.prompt.slice(0, 120) + "..." : prompt.prompt}
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleFavorite(prompt.id)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title={prompt.isFavorite ? "Remove favorite" : "Add favorite"}
          >
            {prompt.isFavorite
              ? <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              : <StarOff className="h-4 w-4 text-gray-300" />
            }
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(prompt.prompt)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            title="Copy prompt"
          >
            <Copy className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => onRun(prompt)}
            className="p-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
            title="Run in chat"
          >
            <Play className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 mt-3 pt-2.5 border-t border-gray-100">
        <div className="flex-1">
          <div className="text-[10px] text-gray-400 uppercase mb-0.5">Effectiveness</div>
          <EffectivenessBar value={prompt.effectiveness} />
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-400 uppercase">Used</div>
          <div className="text-xs font-semibold text-gray-700">{prompt.usageCount}x</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-gray-400 uppercase">Last</div>
          <div className="text-xs text-gray-500">{prompt.lastUsed ?? "Never"}</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onRate(prompt.id, true)} className="p-1 rounded hover:bg-green-50 transition-colors" title="Good prompt">
            <ThumbsUp className="h-3.5 w-3.5 text-gray-400 hover:text-green-600" />
          </button>
          <button onClick={() => onRate(prompt.id, false)} className="p-1 rounded hover:bg-red-50 transition-colors" title="Needs improvement">
            <ThumbsDown className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>

      {/* Suggested improvement */}
      {prompt.suggestedImprovement && (
        <div className="mt-2.5 p-2.5 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="text-[10px] font-semibold text-amber-700 uppercase mb-0.5">Suggested Improvement</div>
              <p className="text-xs text-amber-800 leading-relaxed">{prompt.suggestedImprovement}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AddPromptModal({ onClose, onAdd }: { onClose: () => void; onAdd: (p: Partial<Prompt>) => void }) {
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState("custom");
  const [expectedOutcome, setExpectedOutcome] = useState("");
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleGetSuggestion = () => {
    if (!promptText.trim()) return;
    // Simulated AI suggestion
    setSuggestion(
      `Consider restructuring: "${promptText.slice(0, 50)}..." → Add specific metrics, time ranges, and comparison baselines. For example: "Include YoY comparison and highlight deviations > 5% from plan."`
    );
  };

  const handleAdd = () => {
    if (!title.trim() || !promptText.trim()) return;
    onAdd({
      title: title.trim(),
      prompt: promptText.trim(),
      category,
      area: "Custom",
      isSystem: false,
      isFavorite: false,
      effectiveness: 0,
      usageCount: 0,
      lastUsed: null,
      suggestedImprovement: suggestion,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl m-4 flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-700" />
            <h3 className="text-base font-semibold text-gray-900">Create New Prompt</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Quarterly Headcount Review"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600">
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Prompt</label>
            <textarea
              value={promptText} onChange={(e) => setPromptText(e.target.value)}
              placeholder="Write your prompt here. Be specific about metrics, time periods, and expected format..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Expected Outcome <span className="text-gray-400 font-normal">(optional — helps the system suggest better prompts)</span>
            </label>
            <textarea
              value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)}
              placeholder="Describe what a good answer looks like. e.g., 'A table with department, headcount, and variance % with red highlights for gaps > 5%'"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none"
            />
          </div>

          {/* AI Suggestion */}
          <button
            onClick={handleGetSuggestion}
            disabled={!promptText.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm font-medium hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Suggest Improvements
          </button>

          {suggestion && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-amber-700 mb-1">AI Suggestion</div>
                  <p className="text-xs text-amber-800 leading-relaxed">{suggestion}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!title.trim() || !promptText.trim()}
            className="px-5 py-2 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Add Prompt
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function PromptLibraryPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = prompts.filter((p) => {
    if (activeCategory && p.category !== activeCategory) return false;
    if (showFavoritesOnly && !p.isFavorite) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
    }
    return true;
  });

  const handleRun = (p: Prompt) => {
    router.push(`/chat?q=${encodeURIComponent(p.prompt)}`);
  };

  const handleToggleFavorite = (id: string) => {
    setPrompts((prev) => prev.map((p) => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const handleRate = (id: string, positive: boolean) => {
    setPrompts((prev) => prev.map((p) =>
      p.id === id ? { ...p, effectiveness: Math.min(100, Math.max(0, p.effectiveness + (positive ? 2 : -3))) } : p
    ));
  };

  const handleAdd = (partial: Partial<Prompt>) => {
    const newPrompt: Prompt = {
      id: String(Date.now()),
      title: partial.title ?? "Untitled",
      prompt: partial.prompt ?? "",
      category: partial.category ?? "custom",
      area: partial.area ?? "Custom",
      isSystem: false,
      isFavorite: false,
      effectiveness: 0,
      usageCount: 0,
      lastUsed: null,
      suggestedImprovement: partial.suggestedImprovement ?? null,
    };
    setPrompts((prev) => [newPrompt, ...prev]);
  };

  const categoryCount = (catId: string) => prompts.filter((p) => p.category === catId).length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50/50">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Prompt Library</h1>
              <p className="text-sm text-gray-500">Pre-engineered prompts by metric and area. Run, rate, and create your own.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-700 text-white text-sm font-medium hover:bg-green-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Prompt
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
              showFavoritesOnly ? "bg-yellow-50 border-yellow-300 text-yellow-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            )}
          >
            <Star className={cn("h-4 w-4", showFavoritesOnly ? "fill-yellow-500 text-yellow-500" : "")} />
            Favorites
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Category sidebar */}
        <div className="w-64 shrink-0 bg-white border-r border-gray-200 p-3 overflow-auto">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
              !activeCategory ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <span>All Prompts</span>
            <span className="text-xs text-gray-400">{prompts.length}</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                activeCategory === cat.id ? "bg-green-50 text-green-800" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className="flex items-center gap-2 truncate">
                {cat.icon}
                <span className="truncate">{cat.label}</span>
              </span>
              <span className="text-xs text-gray-400 ml-2 shrink-0">{categoryCount(cat.id)}</span>
            </button>
          ))}
        </div>

        {/* Prompt list */}
        <div className="flex-1 overflow-auto p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <BookOpen className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-semibold text-gray-600 mb-1">No prompts found</h3>
              <p className="text-sm text-gray-400">Try a different search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filtered.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  onRun={handleRun}
                  onToggleFavorite={handleToggleFavorite}
                  onRate={handleRate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && <AddPromptModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}
    </div>
  );
}
