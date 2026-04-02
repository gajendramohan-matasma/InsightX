"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  LayoutDashboard,
  History,
  Database,
  BookOpen,
  Archive,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";
import { JDLogo } from "./JDLogo";

interface SidebarProps {
  userRole?: "user" | "admin";
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { href: "/chat", label: "Chat", icon: <MessageSquare className="h-5 w-5" /> },
  { href: "/prompt-library", label: "Prompt Library", icon: <BookOpen className="h-5 w-5" /> },
  { href: "/history", label: "History", icon: <History className="h-5 w-5" /> },
];

const dataNav: NavItem[] = [
  { href: "/data-cubes", label: "Data Cubes", icon: <Database className="h-5 w-5" /> },
  { href: "/vault", label: "Vault", icon: <Archive className="h-5 w-5" /> },
];

const reportsNav: NavItem[] = [
  { href: "/automated-reports", label: "Automated Reports", icon: <FileBarChart className="h-5 w-5" /> },
];

function NavSection({
  title,
  items,
  pathname,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  collapsed: boolean;
}) {
  function isActive(href: string) {
    if (href === "/chat") return pathname === "/chat" || pathname.startsWith("/chat/");
    return pathname.startsWith(href);
  }

  return (
    <>
      {title && !collapsed && (
        <p className="px-3 pt-5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-jd-green-300/70">
          {title}
        </p>
      )}
      {title && collapsed && <div className="pt-4" />}
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          title={collapsed ? item.label : undefined}
          className={cn(
            "flex items-center rounded-lg text-sm font-medium transition-colors",
            collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
            isActive(item.href)
              ? "bg-jd-green text-white"
              : "text-jd-green-100 hover:bg-jd-green-700/50 hover:text-white"
          )}
        >
          {item.icon}
          {!collapsed && <span>{item.label}</span>}
        </Link>
      ))}
    </>
  );
}

export function Sidebar({ userRole, userName, userEmail, userImage }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col bg-jd-green-dark text-white h-full relative transition-all duration-300 shrink-0",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("border-b border-jd-green-700/50", collapsed ? "p-3 flex justify-center" : "p-4")}>
        {collapsed ? (
          <div className="h-9 w-9 rounded-lg bg-jd-green flex items-center justify-center">
            <span className="text-sm font-bold text-jd-yellow">IX</span>
          </div>
        ) : (
          <JDLogo variant="light" size="md" />
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] z-10 h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow transition-all"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1 overflow-auto", collapsed ? "p-2 pt-8" : "p-3 pt-10")}>
        <NavSection title="Home" items={mainNav} pathname={pathname} collapsed={collapsed} />
        <NavSection title="Data" items={dataNav} pathname={pathname} collapsed={collapsed} />
        <NavSection title="Reports" items={reportsNav} pathname={pathname} collapsed={collapsed} />
      </nav>
    </aside>
  );
}
