"use client";

import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

interface MainLayoutClientProps {
  children: ReactNode;
  userRole?: "user" | "admin";
  userName?: string | null;
  userEmail?: string | null;
  userImage?: string | null;
}

export function MainLayoutClient({
  children,
  userRole,
  userName,
  userEmail,
  userImage,
}: MainLayoutClientProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        userRole={userRole}
        userName={userName}
        userEmail={userEmail}
        userImage={userImage}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar userRole={userRole} userName={userName} userEmail={userEmail} userImage={userImage} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
