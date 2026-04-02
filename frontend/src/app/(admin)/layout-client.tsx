"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

interface AdminLayoutClientProps {
  children: ReactNode;
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function AdminLayoutClient({
  children,
  userName,
  userEmail,
  userImage,
}: AdminLayoutClientProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userRole="admin"
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar userRole="admin" userName={userName} userEmail={userEmail} userImage={userImage} />
        <main className="flex-1 overflow-auto bg-muted/30">{children}</main>
      </div>
    </div>
  );
}
