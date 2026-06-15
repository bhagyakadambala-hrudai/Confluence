"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { PanelLeftOpen, Home, Clock, Star, Globe, Plus } from "lucide-react";

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
    <div className="h-screen overflow-hidden bg-white dark:bg-[#161B22] flex">

      {/* Sidebar — full height, left column */}
      {sidebarOpen ? (
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
          >
            <div className="w-px h-full bg-[#E8EAED] dark:bg-[#30363d] group-hover:bg-[#0052CC]/40 transition-colors" />
          </div>
        </>
      ) : (
        /* Collapsed icon rail */
        <div className="flex flex-col items-center gap-1 pt-2 pb-4 w-12 shrink-0 border-r border-[#E8EAED] dark:border-[#30363d] bg-[#F7F8F9] dark:bg-[#0d1117]">
          <button
            onClick={() => setSidebarOpen(true)}
            title="Expand sidebar"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
          <div className="w-6 border-t border-[#E8EAED] dark:border-[#30363d] my-1" />
          <Link
            href="/"
            title="Home"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Home className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setSidebarOpen(true)}
            title="Recent"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            title="Starred"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Star className="h-4 w-4" />
          </button>
          <Link
            href="/spaces"
            title="Spaces"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Globe className="h-4 w-4" />
          </Link>
          <div className="flex-1" />
          <Link
            href="/pages/new"
            title="Create page"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Plus className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Right column — navbar + main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar
          user={user}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />

        <main className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-[#161B22]">
          {children}
        </main>
      </div>
    </div>
  );
}
