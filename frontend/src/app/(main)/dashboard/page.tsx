"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Send,
  SmilePlus,
  ChevronDown,
  TrendingUp,
  Users,
  Zap,
  Award,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { cn } from "@/lib/utils/formatters";

// ── Data ────────────────────────────────────────────────────────

const locations = ["All Locations", "Pune", "Chicago", "Monterrey", "Indore"];
const intervals = ["Monthly", "Quarterly", "Yearly"];

const twpData = {
  planned: 4250, actual: 4102, variance: -148, variancePct: -3.5,
  byLocation: [
    { location: "Pune", planned: 1800, actual: 1745 },
    { location: "Chicago", planned: 1200, actual: 1180 },
    { location: "Monterrey", planned: 680, actual: 652 },
    { location: "Indore", planned: 570, actual: 525 },
  ],
};

const fteData = {
  planned: 3820, actual: 3695, variance: -125, variancePct: -3.3,
  byDivision: [
    { division: "Engineering", planned: 1450, actual: 1410 },
    { division: "Manufacturing", planned: 980, actual: 945 },
    { division: "Embedded", planned: 720, actual: 695 },
    { division: "Quality", planned: 670, actual: 645 },
  ],
};

const aiToolsData = { totalUsers: 1842, adoptionRate: 68.5, avgSessionsPerWeek: 4.2, topTool: "InsightX" };

const cphTrend = [
  { dept: "Engg", plan: 85, actual: 82 },
  { dept: "Mfg", plan: 62, actual: 58 },
  { dept: "Emb", plan: 74, actual: 71 },
  { dept: "Q4", plan: 55, actual: 60 },
];

const fteDistribution = [
  { name: "PPA", value: 35, color: "#367C2B" },
  { name: "SAT", value: 25, color: "#6abf5b" },
  { name: "C&F", value: 22, color: "#DEDE00" },
  { name: "ISG", value: 15, color: "#1e6b3a" },
  { name: "Other", value: 3, color: "#93c47d" },
];

const aiUtilization = [
  { role: "Individual Cont", usage: 8.2 },
  { role: "Managers", usage: 5.6 },
  { role: "Leadership", usage: 3.8 },
];

const attritionTrend = [
  { month: "Oct", voluntary: 2.1, involuntary: 0.4 },
  { month: "Nov", voluntary: 1.8, involuntary: 0.5 },
  { month: "Dec", voluntary: 2.4, involuntary: 0.3 },
  { month: "Jan", voluntary: 1.6, involuntary: 0.6 },
  { month: "Feb", voluntary: 1.9, involuntary: 0.4 },
  { month: "Mar", voluntary: 1.5, involuntary: 0.3 },
];

const summaryParagraphs = [
  "**Workforce is trending 3.5% below plan** with TWP at 4,102 against a target of 4,250. Pune and Indore locations show the largest gaps, primarily in Engineering and Embedded functions.",
  "**FTE distribution remains weighted** toward PPA (35%) and SAT (25%). Manufacturing CPH is running 6.5% below plan — the widest gap across departments — driven by open positions in the Monterrey facility.",
  "**AI tools adoption is at 68.5%**, with Individual Contributors leading at 8.2 avg weekly sessions. Leadership engagement is growing (+12% MoM) but remains the lowest segment at 3.8 sessions/week.",
  "**Key actions recommended:** Accelerate backfill in Mfg (Monterrey), review Indore hiring pipeline for Embedded roles, and schedule AI tools onboarding for new Q4 hires to maintain adoption trajectory.",
  "**Attrition is improving** — voluntary attrition dropped from 2.4% (Dec) to 1.5% (Mar), a 6-month low. Combined attrition rate of 1.8% is well below the 2.5% industry benchmark. Engineering retention improved by 0.6 points after the mid-year compensation review.",
  "**Hiring pipeline health:** 245 candidates sourced this quarter with a 11.4% conversion to joining. Interview-to-offer ratio of 43.8% suggests strong candidate quality. Average time-to-fill stands at 38 days, down from 45 days last quarter.",
];

// ── Components ──────────────────────────────────────────────────

function Dropdown({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border-2 border-gray-300 rounded-lg px-4 py-2 pr-9 text-sm font-semibold text-gray-800 cursor-pointer hover:border-green-600 focus:outline-none focus:border-green-600 transition-colors min-w-[150px]">
        {options.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

function MetricCard({ title, planned, actual, variance, variancePct, rows }: {
  title: string; planned: number; actual: number; variance: number; variancePct: number;
  rows: { label: string; planned: number; actual: number }[];
}) {
  const isNeg = variance < 0;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-3">{title}</h3>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div>
          <div className="text-[10px] text-gray-400 uppercase">Planned</div>
          <div className="text-lg font-bold text-gray-900">{planned.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase">Actual</div>
          <div className="text-lg font-bold text-gray-900">{actual.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] text-gray-400 uppercase">Variance</div>
          <div className={cn("text-lg font-bold", isNeg ? "text-red-600" : "text-green-700")}>
            {isNeg ? "" : "+"}{variancePct}%
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        {rows.map((r) => {
          const v = r.actual - r.planned;
          const vPct = ((v / r.planned) * 100).toFixed(1);
          return (
            <div key={r.label} className="flex items-center text-[11px]">
              <span className="text-gray-600 font-medium w-[85px] shrink-0">{r.label}</span>
              <div className="flex-1 mx-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-green-600" style={{ width: `${Math.min((r.actual / r.planned) * 100, 100)}%` }} />
              </div>
              <span className={cn("font-bold tabular-nums w-11 text-right", v < 0 ? "text-red-600" : "text-green-700")}>
                {v < 0 ? "" : "+"}{vPct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIToolsCard() {
  const gaugeData = [
    { name: "Adoption", value: aiToolsData.adoptionRate, fill: "#367C2B" },
    { name: "Remaining", value: 100 - aiToolsData.adoptionRate, fill: "#e5e7eb" },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col">
      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-2">AI Tools Utilization</h3>
      {/* Radial gauge */}
      <div className="flex items-center justify-center -my-1">
        <div className="relative">
          <ResponsiveContainer width={120} height={80}>
            <RePieChart>
              <Pie data={gaugeData} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={42} outerRadius={55} dataKey="value" stroke="none" paddingAngle={0}>
                {gaugeData.map((entry) => (<Cell key={entry.name} fill={entry.fill} />))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-center">
            <div className="text-xs font-bold text-green-700">{aiToolsData.adoptionRate}%</div>
            <div className="text-[9px] text-gray-400 uppercase">Adoption</div>
          </div>
        </div>
      </div>
      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-100">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Users className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="text-sm font-bold text-gray-900">{aiToolsData.totalUsers.toLocaleString()}</div>
          <div className="text-[9px] text-gray-400">Users</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="text-sm font-bold text-gray-900">{aiToolsData.avgSessionsPerWeek}</div>
          <div className="text-[9px] text-gray-400">Sess/Wk</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Award className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="text-sm font-bold text-green-700">{aiToolsData.topTool}</div>
          <div className="text-[9px] text-gray-400">Top Tool</div>
        </div>
      </div>
      <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center gap-1 text-[10px] text-gray-400">
        <TrendingUp className="h-3 w-3 text-green-600" />
        <span className="text-green-600 font-semibold">+12%</span> adoption growth MoM
      </div>
    </div>
  );
}

function CPHTrendChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">CPH Trend</h4>
      <ResponsiveContainer width="100%" height={185}>
        <BarChart data={cphTrend} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="dept" tick={{ fontSize: 11, fontWeight: 600 }} stroke="#6b7280" />
          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <Bar dataKey="plan" fill="#a3c293" radius={[3, 3, 0, 0]} name="Plan" />
          <Bar dataKey="actual" fill="#367C2B" radius={[3, 3, 0, 0]} name="Actual" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function FTEDistributionChart() {
  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }: any) => {
    const radius = outerRadius + 18;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#374151" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fontSize={11} fontWeight={600}>
        {name} {(percent * 100).toFixed(0)}%
      </text>
    );
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">FTE Distribution</h4>
      <ResponsiveContainer width="100%" height={185}>
        <RePieChart>
          <Pie data={fteDistribution} cx="50%" cy="48%" innerRadius={0} outerRadius={55} dataKey="value" strokeWidth={2} stroke="#fff"
            label={renderLabel} labelLine={{ stroke: "#9ca3af", strokeWidth: 1 }}
          >
            {fteDistribution.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
          </Pie>
        </RePieChart>
      </ResponsiveContainer>
    </div>
  );
}

function AIUtilizationChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">AI Utilization by Role</h4>
      <ResponsiveContainer width="100%" height={185}>
        <BarChart data={aiUtilization} layout="vertical" barSize={22}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[0, 10]} />
          <YAxis dataKey="role" type="category" tick={{ fontSize: 11, fontWeight: 600 }} stroke="#374151" width={90} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [`${v} sessions/wk`]} />
          <Bar dataKey="usage" radius={[0, 6, 6, 0]} name="Sessions/Week">
            {aiUtilization.map((_, i) => (<Cell key={i} fill={i === 0 ? "#367C2B" : i === 1 ? "#6abf5b" : "#a3c293"} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AttritionChart() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">Attrition Trend (%)</h4>
      <ResponsiveContainer width="100%" height={185}>
        <AreaChart data={attritionTrend}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[0, 3.5]} />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} formatter={(v: number) => [`${v}%`]} />
          <Area type="monotone" dataKey="voluntary" fill="#fecaca" stroke="#ef4444" fillOpacity={0.4} name="Voluntary" />
          <Area type="monotone" dataKey="involuntary" fill="#fef08a" stroke="#ca8a04" fillOpacity={0.3} name="Involuntary" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function HiringPipelineChart() {
  const data = [
    { stage: "Sourced", count: 245 },
    { stage: "Screened", count: 182 },
    { stage: "Interview", count: 96 },
    { stage: "Offer", count: 42 },
    { stage: "Joined", count: 28 },
  ];
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 text-center">Hiring Pipeline</h4>
      <ResponsiveContainer width="100%" height={185}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="stage" tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e5e7eb" }} />
          <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => (<Cell key={i} fill={["#367C2B","#4ade80","#FFDE00","#f59e0b","#367C2B"][i]} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AISummaryPanel() {
  const [visibleChars, setVisibleChars] = useState(0);
  const fullText = summaryParagraphs.join("\n\n");

  useEffect(() => {
    if (visibleChars < fullText.length) {
      const timer = setTimeout(() => setVisibleChars((prev) => Math.min(prev + 4, fullText.length)), 6);
      return () => clearTimeout(timer);
    }
  }, [visibleChars, fullText.length]);

  const displayText = fullText.slice(0, visibleChars);
  const rendered = displayText.split("\n\n").map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-[13px] text-gray-700 leading-relaxed mb-3 last:mb-0">
        {parts.map((part, j) =>
          part.startsWith("**") && part.endsWith("**")
            ? <strong key={j} className="text-gray-900 font-semibold">{part.slice(2, -2)}</strong>
            : <span key={j}>{part}</span>
        )}
      </p>
    );
  });

  return (
    <div className="bg-[#e8dcc8] rounded-2xl border-2 border-[#c9bda8] p-5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-green-800" />
        <span className="text-sm font-bold text-gray-900">OpsInsights Summary</span>
      </div>
      <div className="flex-1 overflow-auto">
        {rendered}
        {visibleChars < fullText.length && (
          <span className="inline-block w-1.5 h-4 bg-green-700 animate-pulse ml-0.5 -mb-0.5 rounded-sm" />
        )}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [location, setLocation] = useState("All Locations");
  const [interval, setInterval] = useState("Quarterly");

  const handleAsk = (q?: string) => {
    const query = q || question;
    if (!query.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-green-50/30">
      {/* Top bar */}
      <div className="bg-gray-800 text-white px-6 py-2.5 flex items-center justify-between shrink-0">
        <h1 className="text-base font-bold tracking-wide">ETEC OpsInsights Companion</h1>
        <div className="flex items-center gap-3">
          <Dropdown options={locations} value={location} onChange={setLocation} />
          <Dropdown options={intervals} value={interval} onChange={setInterval} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-auto">

        {/* Main layout: Left (summary + chat) | Right (cards + charts stacked) */}
        <div className="grid grid-cols-12 gap-3">
          {/* Left column */}
          <div className="col-span-4 flex flex-col gap-3">
            <AISummaryPanel />
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <SmilePlus className="h-4 w-4 text-green-700" />
                </div>
                <span className="text-sm font-semibold text-gray-900">Hello! How can I help you?</span>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex items-center gap-2">
                <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about operational data, workforce, CPH..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent placeholder:text-gray-400" />
                <button type="submit" disabled={!question.trim()}
                  className="h-9 w-9 rounded-lg bg-green-700 text-white flex items-center justify-center hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right column: cards then charts, all stacked */}
          <div className="col-span-8 flex flex-col gap-3">
            {/* Metric cards row */}
            <div className="grid grid-cols-3 gap-3">
              <MetricCard
                title="TWP Plan vs Actual"
                planned={twpData.planned} actual={twpData.actual} variance={twpData.variance} variancePct={twpData.variancePct}
                rows={twpData.byLocation.map((r) => ({ label: r.location, planned: r.planned, actual: r.actual }))}
              />
              <MetricCard
                title="FTE Plan vs Actual"
                planned={fteData.planned} actual={fteData.actual} variance={fteData.variance} variancePct={fteData.variancePct}
                rows={fteData.byDivision.map((r) => ({ label: r.division, planned: r.planned, actual: r.actual }))}
              />
              <AIToolsCard />
            </div>
            {/* Charts row 1 */}
            <div className="grid grid-cols-3 gap-3">
              <CPHTrendChart />
              <FTEDistributionChart />
              <AIUtilizationChart />
            </div>
            {/* Charts row 2 */}
            <div className="grid grid-cols-2 gap-3">
              <AttritionChart />
              <HiringPipelineChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
