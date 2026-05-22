"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
