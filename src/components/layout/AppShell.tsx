"use client";

import { useState, useRef, useCallback } from "react";
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
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const isResizing = useRef(false);

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    function onMove(ev: MouseEvent) {
      if (!isResizing.current) return;
      const newWidth = Math.min(480, Math.max(200, startWidth + ev.clientX - startX));
      setSidebarWidth(newWidth);
    }

    function onUp() {
      isResizing.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#161B22]">
      <Navbar
        user={user}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
        sidebarWidth={sidebarOpen ? sidebarWidth : 0}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {sidebarOpen && (
          <>
            <Sidebar
              open={sidebarOpen}
              onToggle={() => setSidebarOpen(false)}
              user={user}
              width={sidebarWidth}
            />
            {/* Resize handle */}
            <div
              onMouseDown={startResize}
              className="w-1 shrink-0 cursor-col-resize hover:bg-[#0052CC]/40 active:bg-[#0052CC]/60 transition-colors z-30 group"
              title="Drag to resize"
            >
              <div className="w-px h-full bg-[#E8EAED] dark:bg-[#30363d] group-hover:bg-[#0052CC]/40 transition-colors" />
            </div>
          </>
        )}

        {/* Collapsed sidebar toggle */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 z-20 h-8 w-6 flex items-center justify-center bg-white dark:bg-[#161B22] border border-l-0 border-[#E8EAED] dark:border-[#30363d] rounded-r-md shadow-sm hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
            style={{ top: "calc(50% + 24px)" }}
          >
            <PanelLeftOpen className="h-3.5 w-3.5 text-[#6B778C]" />
          </button>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto bg-white dark:bg-[#161B22]">
          {children}
        </main>
      </div>
    </div>
  );
}
