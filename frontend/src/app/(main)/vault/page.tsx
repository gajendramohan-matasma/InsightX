"use client";

import { useState, useRef } from "react";
import {
  Archive,
  Upload,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  Trash2,
  MoreVertical,
  CloudUpload,
  HardDrive,
  CheckSquare,
  Square,
  ArrowUpDown,
  Play,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/Badge";

// ── Types ───────────────────────────────────────────────────────

interface VaultDocument {
  id: string;
  name: string;
  type: "pdf" | "xlsx" | "csv" | "docx" | "pptx";
  size: string;
  pages: number;
  uploadDate: string;
  sessions: number;
  indexed: boolean;
  selected: boolean;
}

// ── Seed Data ───────────────────────────────────────────────────

const initialDocuments: VaultDocument[] = [
  { id: "1", name: "ETEC_CPH_Report_FY25_Q4.pdf", type: "pdf", size: "4.2 MB", pages: 28, uploadDate: "2026-03-28", sessions: 142, indexed: true, selected: false },
  { id: "2", name: "TWP_Master_Plan_2026.xlsx", type: "xlsx", size: "8.7 MB", pages: 15, uploadDate: "2026-03-25", sessions: 98, indexed: true, selected: false },
  { id: "3", name: "India_Headcount_Analysis.xlsx", type: "xlsx", size: "3.1 MB", pages: 8, uploadDate: "2026-03-22", sessions: 67, indexed: true, selected: false },
  { id: "4", name: "Mexico_Operations_Review.pdf", type: "pdf", size: "12.4 MB", pages: 42, uploadDate: "2026-03-20", sessions: 54, indexed: true, selected: false },
  { id: "5", name: "Brazil_Expansion_Projections.pptx", type: "pptx", size: "6.8 MB", pages: 24, uploadDate: "2026-03-18", sessions: 43, indexed: true, selected: false },
  { id: "6", name: "GCC_Benchmark_Report_2025.pdf", type: "pdf", size: "18.9 MB", pages: 65, uploadDate: "2026-03-15", sessions: 89, indexed: true, selected: false },
  { id: "7", name: "Contingent_Labor_Cost_FY26.csv", type: "csv", size: "1.2 MB", pages: 1, uploadDate: "2026-03-12", sessions: 31, indexed: true, selected: false },
  { id: "8", name: "IPN_Allocation_Model_v3.xlsx", type: "xlsx", size: "5.4 MB", pages: 12, uploadDate: "2026-03-10", sessions: 76, indexed: true, selected: false },
  { id: "9", name: "Attrition_Analysis_Q1_2026.pdf", type: "pdf", size: "2.8 MB", pages: 18, uploadDate: "2026-03-08", sessions: 38, indexed: true, selected: false },
  { id: "10", name: "Utilization_Dashboard_Raw.xlsx", type: "xlsx", size: "9.3 MB", pages: 6, uploadDate: "2026-03-05", sessions: 112, indexed: true, selected: false },
  { id: "11", name: "Hiring_Pipeline_Mar2026.csv", type: "csv", size: "0.8 MB", pages: 1, uploadDate: "2026-03-03", sessions: 25, indexed: false, selected: false },
  { id: "12", name: "AI_Tools_Adoption_Survey.pdf", type: "pdf", size: "3.6 MB", pages: 22, uploadDate: "2026-02-28", sessions: 47, indexed: true, selected: false },
];

// ── Helpers ─────────────────────────────────────────────────────

function fileIcon(type: string) {
  const cls = "h-8 w-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold uppercase";
  switch (type) {
    case "pdf": return <div className={cn(cls, "bg-red-500")}>PDF</div>;
    case "xlsx": return <div className={cn(cls, "bg-green-600")}>XLS</div>;
    case "csv": return <div className={cn(cls, "bg-blue-500")}>CSV</div>;
    case "docx": return <div className={cn(cls, "bg-blue-700")}>DOC</div>;
    case "pptx": return <div className={cn(cls, "bg-orange-500")}>PPT</div>;
    default: return <div className={cn(cls, "bg-gray-400")}>FILE</div>;
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Components ──────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 px-5 py-4">
      <div className="text-xs text-gray-500 font-medium mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function UploadZone({ onUpload }: { onUpload: (files: FileList) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-xl p-6 text-center transition-colors",
        dragOver ? "border-green-500 bg-green-50" : "border-gray-300 bg-gray-50/50"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
      }}
    >
      <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
      <div className="text-sm font-semibold text-gray-700 mb-1">Upload Files</div>
      <div className="text-xs text-gray-500 mb-3">
        <button onClick={() => inputRef.current?.click()} className="text-green-700 font-semibold hover:underline">
          Click to Browse
        </button>{" "}or drag and drop your files
      </div>
      <div className="flex items-center gap-3 justify-center text-xs text-gray-400 mb-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span>or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>
      <div className="text-xs text-gray-500 mb-2">Connect a Public Drive link to analyze documents</div>
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-900 transition-colors">
        <HardDrive className="h-3.5 w-3.5" />
        Connect Drive
      </button>
      <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => e.target.files && onUpload(e.target.files)} />
    </div>
  );
}

function ActionMenu({ onView, onDownload, onDelete }: { onView: () => void; onDownload: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-gray-100 transition-colors">
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-40">
            <button onClick={() => { onView(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Eye className="h-3.5 w-3.5" /> View File
            </button>
            <button onClick={() => { onDownload(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" /> Download File
            </button>
            <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" /> Delete File
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function VaultPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "uploadDate" | "sessions">("uploadDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [showFilter, setShowFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const totalDocs = documents.length;
  const vectorIndexed = documents.filter((d) => d.indexed).length;
  const totalSessions = documents.reduce((s, d) => s + d.sessions, 0);
  const selectedCount = documents.filter((d) => d.selected).length;

  const filtered = documents
    .filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (searchQuery) {
        return d.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortField === "name") return a.name.localeCompare(b.name) * dir;
      if (sortField === "sessions") return (a.sessions - b.sessions) * dir;
      return (new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime()) * dir;
    });

  const toggleSelect = (id: string) => {
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, selected: !d.selected } : d));
  };

  const toggleSelectAll = () => {
    const allSelected = filtered.every((d) => d.selected);
    const ids = new Set(filtered.map((d) => d.id));
    setDocuments((prev) => prev.map((d) => ids.has(d.id) ? { ...d, selected: !allSelected } : d));
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleUpload = (files: FileList) => {
    const newDocs: VaultDocument[] = Array.from(files).map((f, i) => ({
      id: String(Date.now() + i),
      name: f.name,
      type: (f.name.split(".").pop() || "pdf") as VaultDocument["type"],
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      pages: 1,
      uploadDate: new Date().toISOString().split("T")[0],
      sessions: 0,
      indexed: false,
      selected: false,
    }));
    setDocuments((prev) => [...newDocs, ...prev]);
  };

  const handleDelete = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-50/50">
      <div className="flex-1 p-6 overflow-auto max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Archive className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vault</h1>
              <p className="text-sm text-gray-500">Upload, index, and analyze documents for AI-powered insights</p>
            </div>
          </div>
        </div>
        {/* Top section: Stats + Upload */}
        <div className="grid grid-cols-12 gap-4 mb-5">
          {/* Document History stats */}
          <div className="col-span-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Document History</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Documents" value={totalDocs} />
              <StatCard label="Vector Indexed" value={vectorIndexed} />
              <StatCard label="Current Sessions" value={selectedCount || 2} />
              <StatCard label="Total Sessions" value={totalSessions} />
            </div>
          </div>

          {/* File Upload */}
          <div className="col-span-7">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">File Upload</h2>
            <UploadZone onUpload={handleUpload} />
          </div>
        </div>

        {/* File list section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900">All Files</h3>
              <span className="text-xs text-gray-400">({filtered.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or type"
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs w-64 focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                    typeFilter ? "bg-green-50 border-green-300 text-green-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                    <div className="absolute right-0 top-9 z-20 bg-white rounded-lg border border-gray-200 shadow-lg py-1 w-36">
                      <button onClick={() => { setTypeFilter(null); setShowFilter(false); }}
                        className={cn("w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50", !typeFilter && "font-semibold text-green-700")}>
                        All Types
                      </button>
                      {["pdf", "xlsx", "csv", "docx", "pptx"].map((t) => (
                        <button key={t} onClick={() => { setTypeFilter(t); setShowFilter(false); }}
                          className={cn("w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 uppercase", typeFilter === t && "font-semibold text-green-700")}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[40px_1fr_120px_100px_80px] gap-3 px-5 py-2.5 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <div className="flex items-center justify-center">
              <button onClick={toggleSelectAll}>
                {filtered.length > 0 && filtered.every((d) => d.selected)
                  ? <CheckSquare className="h-4 w-4 text-green-600" />
                  : <Square className="h-4 w-4 text-gray-300" />
                }
              </button>
            </div>
            <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-gray-700">
              Document Name <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => handleSort("uploadDate")} className="flex items-center gap-1 hover:text-gray-700">
              Upload Date <ArrowUpDown className="h-3 w-3" />
            </button>
            <button onClick={() => handleSort("sessions")} className="flex items-center gap-1 hover:text-gray-700">
              Sessions <ArrowUpDown className="h-3 w-3" />
            </button>
            <div className="text-center">Actions</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center text-sm text-gray-400">
                No documents found. Upload files to get started.
              </div>
            ) : (
              filtered.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "grid grid-cols-[40px_1fr_120px_100px_80px] gap-3 px-5 py-3 items-center hover:bg-gray-50/50 transition-colors",
                    doc.selected && "bg-green-50/30"
                  )}
                >
                  <div className="flex items-center justify-center">
                    <button onClick={() => toggleSelect(doc.id)}>
                      {doc.selected
                        ? <CheckSquare className="h-4 w-4 text-green-600" />
                        : <Square className="h-4 w-4 text-gray-300" />
                      }
                    </button>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    {fileIcon(doc.type)}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">{doc.name}</span>
                        {doc.indexed && (
                          <span className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center" title="Vector indexed">
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400">{doc.size} / {doc.pages} {doc.pages === 1 ? "page" : "pages"}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{formatDate(doc.uploadDate)}</div>
                  <div className="text-xs font-semibold text-gray-800 text-center">{doc.sessions}</div>
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-green-50 transition-colors" title="Start New Analysis">
                      <Play className="h-4 w-4 text-green-700" />
                    </button>
                    <ActionMenu
                      onView={() => {}}
                      onDownload={() => {}}
                      onDelete={() => handleDelete(doc.id)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
