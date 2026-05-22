"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { PanelLeftOpen } from "lucide-react";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export default function AppShell({ user, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#161B22]">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(false)}
          user={user}
        />

        {/* Collapsed sidebar toggle */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 h-8 w-6 flex items-center justify-center bg-white dark:bg-[#161B22] border border-l-0 border-[#E8EAED] dark:border-[#30363d] rounded-r-md shadow-sm hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
            style={{ top: "calc(50% + 24px)" }}
          >
            <PanelLeftOpen className="h-3.5 w-3.5 text-[#6B778C]" />
          </button>
        )}

        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#161B22]">
          {children}
        </main>
      </div>
    </div>
  );
}
