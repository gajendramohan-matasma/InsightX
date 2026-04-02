"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  ChevronRight,
  User,
  Settings,
  Activity,
  BarChart3,
  AlertTriangle,
  Gauge,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils/formatters";

interface TopBarProps {
  className?: string;
  userRole?: "user" | "admin";
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

const breadcrumbMap: Record<string, string> = {
  "/chat": "Chat",
  "/dashboard": "Dashboard",
  "/history": "History",
  "/data-cubes": "Data Cubes",
  "/vault": "Vault",
  "/prompt-library": "Prompt Library",
  "/admin": "Admin Overview",
  "/admin/metrics": "Metrics",
  "/admin/logs": "Logs",
  "/admin/usage": "Usage Patterns",
};

export function TopBar({ className, userRole, userName, userEmail, userImage }: TopBarProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  function getBreadcrumbs(): { label: string; href?: string }[] {
    const crumbs: { label: string; href?: string }[] = [{ label: "Home" }];
    if (pathname.startsWith("/admin")) {
      crumbs.push({ label: "Admin", href: "/admin" });
      const subLabel = breadcrumbMap[pathname];
      if (subLabel && pathname !== "/admin") {
        crumbs.push({ label: subLabel });
      }
    } else {
      const label = breadcrumbMap[pathname];
      if (label) crumbs.push({ label });
    }
    return crumbs;
  }

  const breadcrumbs = getBreadcrumbs();
  const initials = (userName?.charAt(0) ?? "U").toUpperCase();

  return (
    <header
      className={cn(
        "flex items-center justify-between h-14 px-6 bg-white border-b border-border shrink-0",
        className
      )}
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            {crumb.href ? (
              <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {crumb.label}
              </a>
            ) : i === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <span className="text-muted-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Right: Notification + User dropdown */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-jd-yellow border-2 border-white" />
        </button>

        {/* User profile dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
              {userImage ? (
                <img src={userImage} alt={userName ?? "User"} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-medium text-gray-900 leading-tight">{userName ?? "User"}</div>
              <div className="text-[11px] text-gray-400 leading-tight">{userEmail ?? ""}</div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", dropdownOpen && "rotate-180")} />
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-xl z-50 py-2 overflow-hidden">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {userImage ? (
                      <img src={userImage} alt={userName ?? "User"} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{userName ?? "User"}</div>
                    <div className="text-xs text-gray-400 truncate">{userEmail ?? ""}</div>
                    {userRole === "admin" && (
                      <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Settings section */}
              <div className="py-1">
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  Settings
                </div>
                <DropdownItem href="/profile" icon={<User className="h-4 w-4" />} label="Profile" onClick={() => setDropdownOpen(false)} />
                <DropdownItem href="/settings" icon={<Settings className="h-4 w-4" />} label="Preferences" onClick={() => setDropdownOpen(false)} />
              </div>

              {/* Performance section (admin only) */}
              {userRole === "admin" && (
                <div className="py-1 border-t border-gray-100">
                  <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    Performance
                  </div>
                  <DropdownItem href="/admin" icon={<Activity className="h-4 w-4" />} label="Overview" onClick={() => setDropdownOpen(false)} />
                  <DropdownItem href="/admin/metrics" icon={<BarChart3 className="h-4 w-4" />} label="Metrics" onClick={() => setDropdownOpen(false)} />
                  <DropdownItem href="/admin/logs" icon={<AlertTriangle className="h-4 w-4" />} label="Logs" onClick={() => setDropdownOpen(false)} />
                  <DropdownItem href="/admin/usage" icon={<Gauge className="h-4 w-4" />} label="Usage" onClick={() => setDropdownOpen(false)} />
                </div>
              )}

              {/* Sign out */}
              <div className="pt-1 border-t border-gray-100">
                <DropdownItem href="/api/auth/signout" icon={<LogOut className="h-4 w-4" />} label="Sign Out" onClick={() => setDropdownOpen(false)} destructive />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  href,
  icon,
  label,
  onClick,
  destructive,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
        destructive
          ? "text-red-600 hover:bg-red-50"
          : "text-gray-700 hover:bg-gray-50"
      )}
    >
      <span className={destructive ? "text-red-400" : "text-gray-400"}>{icon}</span>
      {label}
    </Link>
  );
}
