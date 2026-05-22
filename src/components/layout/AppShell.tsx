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
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#1B2A3B]">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} user={user} />
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#1B2A3B]">
          {children}
        </main>
      </div>
    </div>
  );
}
