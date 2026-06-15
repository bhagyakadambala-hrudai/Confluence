"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ChevronRight, Plus, MoreHorizontal, Search,
  BookOpen, Clock, Star, Globe,
  Users,
  FileText, ExternalLink, X, Filter, Lock,
  Settings, Trash2, Archive, Link2, Copy, Move, Pencil,
  Eye, UserCog, Folder,
  PenLine, Database, Video,
} from "lucide-react";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  emoji: string;
}

interface Page {
  id: string;
  title: string;
  emoji: string;
  parent_id: string | null;
  access_mode?: string;
  is_draft?: boolean;
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  user: import("@supabase/supabase-js").User;
  width?: number;
}

export default function Sidebar({ open, onToggle, user, width = 280 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [pageSearch, setPageSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [showCreatePopup, setShowCreatePopup] = useState(false);
  const [spaceStarred, setSpaceStarred] = useState(false);
  const createPopupRef = useRef<HTMLDivElement>(null);

  type FlyoutPanel = "recent" | "starred" | "spaces" | null;
  const [flyout, setFlyout] = useState<FlyoutPanel>(null);
  const [recentPages, setRecentPages] = useState<Array<{ id: string; title: string; emoji: string; space_id: string; updated_at: string; spaces: { name: string } | null }>>([]);
  const [starredPages, setStarredPages] = useState<Array<{ id: string; title: string; emoji: string; space_id: string }>>([]);
  const [starredSpaces, setStarredSpaces] = useState<Array<{ id: string; name: string; emoji: string }>>([]);
  const [flyoutSearch, setFlyoutSearch] = useState("");
  const flyoutRef = useRef<HTMLDivElement>(null);

  function toggleFlyout(panel: FlyoutPanel) {
    setFlyout((prev) => (prev === panel ? null : panel));
    setFlyoutSearch("");
  }

  const activeSpaceId = pathname.match(/\/spaces\/([^/]+)/)?.[1];
  const activePageId = pathname.match(/\/pages\/([^/]+)/)?.[1];

  const fullName = user.user_metadata?.full_name || user.email || "User";
  const initials = getInitials(fullName);
  const avatarUrl = user.user_metadata?.avatar_url;

  useEffect(() => {
    fetchSpaces();
    fetch("/api/stars")
      .then((r) => r.ok ? r.json() : { spaces: [] })
      .then((data) => setStarredSpaces(data.spaces || []));
  }, []);

  useEffect(() => {
    if (activeSpaceId) {
      const found = spaces.find((s) => s.id === activeSpaceId);
      if (found) {
        setActiveSpace(found);
        fetchPages(activeSpaceId);
      } else if (spaces.length > 0) {
        // fetch from supabase directly
        supabase.from("spaces").select("id,name,emoji").eq("id", activeSpaceId).single()
          .then(({ data }) => {
            if (data) { setActiveSpace(data); fetchPages(activeSpaceId); }
          });
      }
    } else {
      setActiveSpace(null);
      setPages([]);
    }
  }, [activeSpaceId, spaces]);

  // Close flyout when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (flyout && flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyout(null);
      }
      if (showCreatePopup && createPopupRef.current && !createPopupRef.current.contains(e.target as Node)) {
        setShowCreatePopup(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [flyout, showCreatePopup]);

  // Fetch space star status when active space changes
  useEffect(() => {
    if (!activeSpace) return;
    fetch("/api/stars")
      .then((r) => r.ok ? r.json() : { spaces: [] })
      .then((data) => {
        setSpaceStarred((data.spaces || []).some((s: { id: string }) => s.id === activeSpace.id));
      });
  }, [activeSpace?.id]);

  // Fetch recent pages when recent flyout opens
  useEffect(() => {
    if (flyout === "recent" && recentPages.length === 0) {
      fetch("/api/pages/recent")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setRecentPages(Array.isArray(data) ? data : []));
    }
    if (flyout === "starred") {
      fetch("/api/stars")
        .then((r) => r.ok ? r.json() : { pages: [], spaces: [] })
        .then((data) => {
          setStarredPages(data.pages || []);
          setStarredSpaces(data.spaces || []);
        });
    }
  }, [flyout]);

  async function fetchSpaces() {
    const res = await fetch("/api/spaces");
    const data = res.ok ? await res.json() : [];
    setSpaces(Array.isArray(data) ? data : []);
  }

  async function toggleSpaceStar(spaceId: string) {
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "space", id: spaceId }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setStarredSpaces((prev) =>
        data.starred
          ? [...prev, spaces.find((s) => s.id === spaceId)!].filter(Boolean)
          : prev.filter((s) => s.id !== spaceId)
      );
      if (activeSpace?.id === spaceId) setSpaceStarred(data.starred);
    }
  }

  async function fetchPages(spaceId: string) {
    const res = await fetch(`/api/pages?space_id=${spaceId}`);
    const data = res.ok ? await res.json() : [];
    setPages(Array.isArray(data) ? data : []);
  }

  async function createPage(parentId?: string) {
    if (!activeSpaceId) return;
    const resp = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: activeSpaceId, parent_id: parentId || null, title: "Untitled", content: "", emoji: "📄" }),
    });
    if (resp.ok) {
      const page = await resp.json();
      fetchPages(activeSpaceId);
      router.push(`/spaces/${activeSpaceId}/pages/${page.id}/edit`);
    }
  }

  async function handleStarSpace() {
    if (!activeSpace) return;
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "space", id: activeSpace.id }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setSpaceStarred(data.starred);
      toast.success(data.starred ? "Space starred" : "Star removed");
    }
  }

  async function handleDeleteSpace() {
    if (!activeSpace) return;
    const resp = await fetch(`/api/spaces/${activeSpace.id}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Space deleted");
      router.push("/");
    } else {
      toast.error("Failed to delete space");
    }
  }

  const filteredPages = pages.filter((p) =>
    !pageSearch || p.title.toLowerCase().includes(pageSearch.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      <aside
        className="shrink-0 flex flex-col h-full bg-white dark:bg-[#161B22] select-none overflow-hidden"
        style={{ width }}
      >

        {/* ── Logo bar ── */}
        <div className="flex items-center gap-1 px-2 h-12 border-b border-[#E8EAED] dark:border-[#30363d] shrink-0">
          <Link href="/home" className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className="h-6 w-6 bg-[#0052CC] rounded flex items-center justify-center shrink-0">
              <BookOpen className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[#172B4D] dark:text-white text-sm truncate">Confluence</span>
          </Link>
          <button
            onClick={onToggle}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors shrink-0"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#42526E] dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="4" width="14" height="12" rx="1.5" />
              <line x1="7" y1="4" x2="7" y2="16" />
            </svg>
          </button>
        </div>

        <ScrollArea className="flex-1">
          {/* ── Global nav ── */}
          <nav className="py-1">
            <NavItem icon={<ForYouIcon />} label="For you" href="/home" active={pathname === "/home"} />
            <NavItem icon={<TemplatesIcon />} label="Templates" href="/templates" active={pathname === "/templates"} />
            <NavItem icon={<Clock className="h-4 w-4" />} label="Recent" href="#" hasChevron
              expanded={flyout === "recent"} onToggle={() => toggleFlyout("recent")} active={flyout === "recent"} />
            <NavItem icon={<Star className="h-4 w-4" />} label="Starred" href="#" hasChevron
              expanded={flyout === "starred"} onToggle={() => toggleFlyout("starred")} active={flyout === "starred"} />
            <NavItem icon={<Globe className="h-4 w-4" />} label="Spaces" href="/spaces"
              hasChevron expanded={flyout === "spaces"} onToggle={() => toggleFlyout("spaces")}
              active={flyout === "spaces" || pathname === "/spaces"} />
          </nav>

          {/* ── Starred spaces (only when NOT in a space) ── */}
          {!activeSpace && (
            <div className="px-3 pt-3 pb-2">
              <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 uppercase tracking-wide mb-1.5 px-1">
                Starred spaces
              </p>
              {starredSpaces.length === 0 ? (
                <p className="text-xs text-[#97A0AF] dark:text-slate-500 px-1 mb-2">
                  Spaces you star will appear here
                </p>
              ) : (
                <div className="space-y-0.5 mb-1">
                  {starredSpaces.map((s) => (
                    <Link
                      key={s.id}
                      href={`/spaces/${s.id}`}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
                    >
                      <span className="text-base leading-none">{s.emoji || "📁"}</span>
                      <span className="truncate text-xs font-medium">{s.name}</span>
                    </Link>
                  ))}
                </div>
              )}
              <Link
                href="/spaces"
                className="flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] rounded transition-colors"
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4 text-[#42526E] dark:text-slate-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <line x1="2" y1="4" x2="14" y2="4" strokeLinecap="round" />
                  <line x1="2" y1="8" x2="14" y2="8" strokeLinecap="round" />
                  <line x1="2" y1="12" x2="9" y2="12" strokeLinecap="round" />
                </svg>
                View all spaces
              </Link>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="h-px bg-[#E8EAED] dark:bg-[#30363d] mx-0 my-1" />

          {/* ── Space context section ── */}
          {activeSpace ? (
            <div className="py-1">
              {/* Space header row */}
              <div className="flex items-center gap-2 px-3 py-2 group/space">
                <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 text-base leading-none bg-gradient-to-br from-[#6554C0] to-[#0052CC] shadow-sm">
                  <span className="text-sm leading-none">{activeSpace.emoji || "📁"}</span>
                </div>
                <Link href={`/spaces/${activeSpace.id}`}
                  className="flex-1 min-w-0 font-semibold text-sm text-[#172B4D] dark:text-white truncate hover:text-[#0052CC]">
                  {activeSpace.name}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#E8EAED] dark:hover:bg-[#21262d] opacity-0 group-hover/space:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-3.5 w-3.5 text-[#6B778C]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="right" className="w-52">
                    <DropdownMenuItem onClick={handleStarSpace} className="flex items-center gap-2 cursor-pointer">
                      <Star className={`h-4 w-4 ${spaceStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                      {spaceStarred ? "Unstar space" : "Star space"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/spaces/${activeSpace.id}`)}>
                      <Eye className="h-4 w-4" />
                      Watch space
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1">
                      <p className="text-[10px] font-semibold text-[#97A0AF] uppercase tracking-wide">Space tools</p>
                    </div>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/spaces/${activeSpace.id}?tab=members`)}>
                      <UserCog className="h-4 w-4" />
                      Users
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(`/spaces/${activeSpace.id}`)}>
                      <Settings className="h-4 w-4" />
                      Space settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[#97A0AF]">
                      <Archive className="h-4 w-4" />
                      Archive space
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDeleteSpace} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4" />
                      Delete space
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Shortcuts section */}
              <div className="px-3 py-1">
                <div className="flex items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-[#6B778C]" />
                    <span className="text-xs font-semibold text-[#6B778C] dark:text-slate-400">Shortcuts</span>
                  </div>
                </div>
                <p className="text-xs text-[#97A0AF] dark:text-slate-500 pl-5">No shortcuts in this space</p>
              </div>

              {/* Content header */}
              <div className="flex items-center justify-between px-3 py-1 mt-2">
                <div className="flex items-center gap-1.5">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-[#6B778C]" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <rect x="2" y="2" width="12" height="12" rx="1.5" />
                    <line x1="5" y1="6" x2="11" y2="6" strokeLinecap="round" />
                    <line x1="5" y1="9" x2="9" y2="9" strokeLinecap="round" />
                  </svg>
                  <span className="text-xs font-semibold text-[#6B778C] dark:text-slate-400">Content</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => createPage()}
                    className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                    <Plus className="h-3.5 w-3.5 text-[#6B778C]" />
                  </button>
                  <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                    <MoreHorizontal className="h-3.5 w-3.5 text-[#6B778C]" />
                  </button>
                </div>
              </div>

              {/* Search by title */}
              <div className="px-3 py-1 mb-1">
                <div className="flex items-center gap-2 px-2 h-7 rounded border border-[#E8EAED] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-xs text-[#6B778C]">
                  <Search className="h-3 w-3 shrink-0" />
                  <input
                    value={pageSearch}
                    onChange={(e) => setPageSearch(e.target.value)}
                    placeholder="Search by title"
                    className="bg-transparent outline-none w-full text-xs text-[#172B4D] dark:text-slate-300 placeholder:text-[#97A0AF]"
                  />
                </div>
              </div>

              {/* Page list */}
              <div className="px-2 space-y-0.5">
                {filteredPages.filter(p => !p.parent_id).map((page) => (
                  <PageItem
                    key={page.id}
                    page={page}
                    allPages={filteredPages}
                    spaceId={activeSpace.id}
                    activePageId={activePageId}
                    depth={0}
                    onRefresh={() => fetchPages(activeSpace.id)}
                    onCreateChild={(parentId) => createPage(parentId)}
                  />
                ))}
              </div>

              {/* + Create popup */}
              <div className="relative mt-1" ref={createPopupRef}>
                <button
                  onClick={() => setShowCreatePopup((v) => !v)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
                >
                  <Plus className="h-4 w-4 text-[#6B778C]" />
                  Create
                </button>
                {showCreatePopup && (
                  <div className="absolute left-3 bottom-full mb-1 w-52 bg-white dark:bg-[#1B2A3B] rounded-xl border border-[#DFE1E6] dark:border-slate-700 shadow-xl z-50 py-1.5 overflow-hidden">
                    <SimpleCreateItem
                      icon={<FileText className="h-4 w-4 text-[#0052CC]" />}
                      label="Page"
                      onClick={() => { setShowCreatePopup(false); createPage(); }}
                    />
                    <SimpleCreateItem
                      icon={<PenLine className="h-4 w-4 text-[#6554C0]" />}
                      label="Whiteboard"
                      onClick={() => { setShowCreatePopup(false); toast("Whiteboard coming soon"); }}
                    />
                    <SimpleCreateItem
                      icon={<Database className="h-4 w-4 text-[#36B37E]" />}
                      label="Database"
                      onClick={() => { setShowCreatePopup(false); toast("Database coming soon"); }}
                    />
                    <SimpleCreateItem
                      icon={<Link2 className="h-4 w-4 text-[#00B8D9]" />}
                      label="Smart Link"
                      onClick={() => { setShowCreatePopup(false); toast("Smart Link coming soon"); }}
                    />
                    <SimpleCreateItem
                      icon={<Folder className="h-4 w-4 text-amber-500" />}
                      label="Folder"
                      onClick={() => { setShowCreatePopup(false); toast("Folders coming soon"); }}
                    />
                    <SimpleCreateItem
                      icon={<Video className="h-4 w-4 text-red-500" />}
                      label="Loom video"
                      onClick={() => { setShowCreatePopup(false); toast("Loom video coming soon"); }}
                    />
                  </div>
                )}
              </div>

            </div>
          ) : null}

          {/* ── Divider ── */}
          <div className="h-px bg-[#E8EAED] dark:bg-[#30363d] mx-0 my-1" />

          {/* ── Bottom links ── */}
          <nav className="py-1">
            <BottomLink icon={<Users className="h-4 w-4" />} label="Teams" href="/teams" showExternal />
          </nav>
        </ScrollArea>

      </aside>

      <CreateSpaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(space) => {
          fetchSpaces();
          router.push(`/spaces/${space.id}`);
        }}
      />

      {/* ── Spaces popup flyout ── */}
      {flyout === "spaces" && (
        <div ref={flyoutRef} className="fixed z-50 w-[400px] bg-white dark:bg-[#1B2A3B] rounded-xl border border-[#DFE1E6] dark:border-[#30363d] shadow-2xl flex flex-col overflow-hidden" style={{ left: width + 12, top: 140 }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAED] dark:border-[#30363d]">
            <span className="font-semibold text-sm text-[#172B4D] dark:text-white">Spaces</span>
            <button onClick={() => setFlyout(null)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
              <X className="h-4 w-4 text-[#6B778C]" />
            </button>
          </div>
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-[#E8EAED] dark:border-[#30363d]">
            <div className="flex items-center gap-2 px-3 h-9 rounded-md border border-[#DFE1E6] dark:border-[#30363d] bg-white dark:bg-[#0d1117] focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC] transition-all">
              <Search className="h-4 w-4 text-[#6B778C] shrink-0" />
              <input
                value={flyoutSearch}
                onChange={(e) => setFlyoutSearch(e.target.value)}
                placeholder="Filter spaces"
                autoFocus
                className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-300 placeholder:text-[#97A0AF] w-full"
              />
            </div>
          </div>
          {/* Recent spaces list */}
          <div className="py-1 max-h-72 overflow-y-auto">
            <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 px-4 py-2">Recent</p>
            {spaces
              .filter((s) => !flyoutSearch || s.name.toLowerCase().includes(flyoutSearch.toLowerCase()))
              .map((space) => {
                const isStarred = starredSpaces.some((ss) => ss.id === space.id);
                return (
                  <div key={space.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors group">
                    <Link
                      href={`/spaces/${space.id}`}
                      onClick={() => setFlyout(null)}
                      className="flex items-center gap-2.5 flex-1 min-w-0"
                    >
                      <div className="h-8 w-8 rounded-md bg-gradient-to-br from-[#6554C0] to-[#0052CC] flex items-center justify-center text-base shrink-0">
                        {space.emoji || "📁"}
                      </div>
                      <span className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">
                        {space.name}
                      </span>
                    </Link>
                    <button
                      title="Star this space"
                      onClick={() => toggleSpaceStar(space.id)}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#DFE1E6] dark:hover:bg-[#30363d] transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Star className={`h-4 w-4 ${isStarred ? "fill-[#FFAB00] text-[#FFAB00]" : "text-[#6B778C]"}`} />
                    </button>
                  </div>
                );
              })}
            {spaces.length === 0 && (
              <p className="text-xs text-[#97A0AF] px-4 py-3">No spaces yet</p>
            )}
          </div>
          {/* Footer */}
          <div className="border-t border-[#E8EAED] dark:border-[#30363d] py-1">
            <Link href="/spaces" onClick={() => setFlyout(null)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#42526E] dark:text-slate-400 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6"><line x1="2" y1="4" x2="14" y2="4" strokeLinecap="round"/><line x1="2" y1="8" x2="14" y2="8" strokeLinecap="round"/><line x1="2" y1="12" x2="9" y2="12" strokeLinecap="round"/></svg>
              View all spaces
            </Link>
            <button onClick={() => { setFlyout(null); setCreateModalOpen(true); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#42526E] dark:text-slate-400 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
              <Plus className="h-4 w-4" />
              Create a space
            </button>
          </div>
        </div>
      )}

      {/* ── Recent / Starred side panels ── */}
      {(flyout === "recent" || flyout === "starred") && (
        <div ref={flyoutRef} className="fixed top-0 bottom-0 w-[340px] bg-white dark:bg-[#1B2A3B] border-r border-[#E8EAED] dark:border-[#30363d] shadow-xl z-40 flex flex-col" style={{ left: width + 4 }}>

          {/* Recent flyout */}
          {flyout === "recent" && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAED] dark:border-[#30363d]">
                <span className="font-semibold text-sm text-[#172B4D] dark:text-white">Recent</span>
                <div className="flex items-center gap-1">
                  <button className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                    <Filter className="h-3.5 w-3.5 text-[#6B778C]" />
                  </button>
                  <button onClick={() => setFlyout(null)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                    <X className="h-4 w-4 text-[#6B778C]" />
                  </button>
                </div>
              </div>
              <div className="px-3 py-2 border-b border-[#E8EAED] dark:border-[#30363d]">
                <div className="flex items-center gap-2 px-2 h-8 rounded border border-[#E8EAED] dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
                  <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
                  <input
                    value={flyoutSearch}
                    onChange={(e) => setFlyoutSearch(e.target.value)}
                    placeholder="Filter recent items"
                    className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-300 placeholder:text-[#97A0AF] w-full"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 py-2">
                  {recentPages.length === 0 ? (
                    <p className="text-xs text-[#6B778C] text-center py-8">Loading…</p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 px-2 py-1.5 uppercase tracking-wide">Today</p>
                      {recentPages
                        .filter((p) => !flyoutSearch || p.title.toLowerCase().includes(flyoutSearch.toLowerCase()))
                        .map((page) => (
                          <Link
                            key={page.id}
                            href={`/spaces/${page.space_id}/pages/${page.id}/edit`}
                            onClick={() => setFlyout(null)}
                            className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors group"
                          >
                            <span className="text-base leading-none shrink-0">{page.emoji || "📄"}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                                {page.title || "Untitled"}
                              </p>
                              <p className="text-xs text-[#97A0AF] dark:text-slate-500">
                                {page.spaces?.name} · {formatRelativeTime(page.updated_at)}
                              </p>
                            </div>
                          </Link>
                        ))}
                    </>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-[#E8EAED] dark:border-[#30363d] p-3">
                <button className="w-full text-left text-sm text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                  <Filter className="h-3.5 w-3.5" />
                  View all recent items
                </button>
              </div>
            </>
          )}

          {/* Starred flyout */}
          {flyout === "starred" && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAED] dark:border-[#30363d]">
                <span className="font-semibold text-sm text-[#172B4D] dark:text-white">Starred</span>
                <button onClick={() => setFlyout(null)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                  <X className="h-4 w-4 text-[#6B778C]" />
                </button>
              </div>
              {starredPages.length === 0 && starredSpaces.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="relative mb-4">
                    <div className="h-16 w-16 bg-gradient-to-br from-[#FFAB00] to-[#FF8B00] rounded-xl flex items-center justify-center shadow-md rotate-6">
                      <Star className="h-8 w-8 text-white fill-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 bg-[#6554C0] rounded-lg flex items-center justify-center shadow rotate-12 opacity-80">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-[#172B4D] dark:text-white mb-1">
                    You haven&apos;t starred anything yet
                  </p>
                  <p className="text-xs text-[#6B778C] dark:text-slate-400 leading-relaxed">
                    Mark items that are important to you with a star to quickly access them.
                  </p>
                </div>
              ) : (
                <ScrollArea className="flex-1">
                  <div className="px-2 py-2">
                    {starredSpaces.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 px-2 py-1.5 uppercase tracking-wide">Spaces</p>
                        {starredSpaces.map((space) => (
                          <Link
                            key={space.id}
                            href={`/spaces/${space.id}`}
                            onClick={() => setFlyout(null)}
                            className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors group"
                          >
                            <span className="text-base shrink-0">{space.emoji || "📁"}</span>
                            <span className="flex-1 text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC]">{space.name}</span>
                          </Link>
                        ))}
                      </>
                    )}
                    {starredPages.length > 0 && (
                      <>
                        <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 px-2 py-1.5 uppercase tracking-wide mt-1">Pages</p>
                        {starredPages.map((page) => (
                          <Link
                            key={page.id}
                            href={`/spaces/${page.space_id}/pages/${page.id}/edit`}
                            onClick={() => setFlyout(null)}
                            className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors group"
                          >
                            <span className="text-base shrink-0">{page.emoji || "📄"}</span>
                            <span className="flex-1 text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC]">
                              {page.title || "Untitled"}
                            </span>
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              )}
            </>
          )}

        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function NavItem({ icon, label, href, active, hasChevron, expanded, onToggle }: {
  icon: React.ReactNode; label: string; href: string;
  active?: boolean; hasChevron?: boolean; expanded?: boolean; onToggle?: () => void;
}) {
  const content = (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 text-sm transition-colors cursor-pointer",
      active
        ? "bg-[#E9F0FB] dark:bg-blue-900/30 text-[#172B4D] dark:text-blue-200 font-medium"
        : "text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d]"
    )}>
      <span className={cn("shrink-0", active ? "text-[#0052CC]" : "text-[#6B778C] dark:text-slate-400")}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {hasChevron && (
        <ChevronRight className={cn("h-3.5 w-3.5 text-[#6B778C] transition-transform", expanded && "rotate-90")} />
      )}
    </div>
  );

  if (hasChevron && onToggle) {
    return <div onClick={onToggle}>{content}</div>;
  }
  return <Link href={href}>{content}</Link>;
}

function BottomLink({ icon, label, href, showExternal }: { icon: React.ReactNode; label: string; href?: string; showExternal?: boolean }) {
  const inner = (
    <>
      <span className="text-[#6B778C] dark:text-slate-400 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {showExternal && <ExternalLink className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />}
    </>
  );
  if (href && href !== "#") {
    return (
      <Link href={href} className="flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
        {inner}
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] cursor-pointer transition-colors">
      {inner}
    </div>
  );
}

function CreateMenuItem({ icon, label, description, onClick }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors text-left"
    >
      <span className="shrink-0">{icon}</span>
      <div>
        <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200">{label}</p>
        <p className="text-xs text-[#6B778C] dark:text-slate-400">{description}</p>
      </div>
    </button>
  );
}

function SimpleCreateItem({ icon, label, onClick }: {
  icon: React.ReactNode; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-left"
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-sm text-[#172B4D] dark:text-slate-200">{label}</span>
    </button>
  );
}

function PageItem({ page, allPages, spaceId, activePageId, depth, onRefresh, onCreateChild }: {
  page: Page; allPages: Page[]; spaceId: string;
  activePageId?: string; depth: number;
  onRefresh?: () => void;
  onCreateChild?: (parentId: string) => void;
}) {
  const router = useRouter();
  const children = allPages.filter((p) => p.parent_id === page.id);
  const [expanded, setExpanded] = useState(false);
  const isActive = activePageId === page.id;
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.title || "Untitled");

  async function handleRename() {
    if (!renameValue.trim() || renameValue === page.title) { setRenaming(false); return; }
    const resp = await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: renameValue.trim() }),
    });
    if (resp.ok) { onRefresh?.(); toast.success("Renamed"); }
    setRenaming(false);
  }

  async function handleDelete() {
    const resp = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (resp.ok) { onRefresh?.(); toast.success("Deleted"); router.push(`/spaces/${spaceId}`); }
    else toast.error("Failed to delete");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/spaces/${spaceId}/pages/${page.id}`);
    toast.success("Link copied");
  }

  return (
    <div>
      <div className={cn(
        "flex items-center gap-1 py-1 rounded text-sm group/item transition-colors",
        isActive
          ? "bg-[#E9F0FB] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-300 font-medium"
          : "text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d]"
      )}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
      >
        {/* chevron / bullet */}
        <span className="h-4 w-4 flex items-center justify-center shrink-0">
          {children.length > 0 ? (
            <button onClick={() => setExpanded(!expanded)} className="h-4 w-4 flex items-center justify-center">
              <ChevronRight className={cn("h-3 w-3 text-[#6B778C] transition-transform", expanded && "rotate-90")} />
            </button>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#C1C7D0] dark:bg-slate-500 mx-auto" />
          )}
        </span>

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
            className="flex-1 min-w-0 text-xs px-1 py-0.5 rounded border border-[#0052CC] bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 outline-none"
          />
        ) : (
          <Link
            href={`/spaces/${spaceId}/pages/${page.id}/edit`}
            className="flex items-center gap-1.5 flex-1 min-w-0 py-0.5"
          >
            <span className="text-sm leading-none shrink-0">{page.emoji || "📄"}</span>
            <span className="truncate text-xs flex-1">{page.title || "Untitled"}</span>
            {page.is_draft && (
              <span className="shrink-0 text-[9px] font-semibold text-[#6B778C] dark:text-slate-400 bg-[#F1F2F4] dark:bg-slate-700 px-1 py-px rounded border border-[#DFE1E6] dark:border-slate-600 leading-none">
                DRAFT
              </span>
            )}
            {page.access_mode === "restricted" && (
              <span className="shrink-0">
                <Lock className="h-3 w-3 text-amber-500" />
              </span>
            )}
          </Link>
        )}

        {/* Hover action buttons */}
        {!renaming && (
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity pr-1">
            {/* + child page dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#DFE1E6] dark:hover:bg-slate-600 transition-colors"
                  title="Add child content"
                >
                  <Plus className="h-3 w-3 text-[#6B778C]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-48">
                <DropdownMenuItem
                  onClick={() => onCreateChild?.(page.id)}
                  className="flex items-center gap-2.5 cursor-pointer"
                >
                  <FileText className="h-4 w-4 text-[#42526E]" />
                  <span>Page</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {[
                  { label: "Live Doc", icon: <PenLine className="h-4 w-4 text-[#97A0AF]" /> },
                  { label: "Whiteboard", icon: <Eye className="h-4 w-4 text-[#97A0AF]" /> },
                  { label: "Database", icon: <Database className="h-4 w-4 text-[#97A0AF]" /> },
                  { label: "Smart Link", icon: <Link2 className="h-4 w-4 text-[#97A0AF]" /> },
                  { label: "Folder", icon: <Folder className="h-4 w-4 text-[#97A0AF]" /> },
                  { label: "Loom video", icon: <Video className="h-4 w-4 text-[#97A0AF]" /> },
                ].map(({ label, icon }) => (
                  <DropdownMenuItem
                    key={label}
                    onClick={() => toast(`${label} — coming soon`)}
                    className="flex items-center gap-2.5 cursor-pointer text-[#97A0AF]"
                  >
                    {icon}
                    <span>{label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* ... context menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#DFE1E6] dark:hover:bg-slate-600 transition-colors">
                  <MoreHorizontal className="h-3 w-3 text-[#6B778C]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-48">
                <DropdownMenuItem onClick={() => setRenaming(true)} className="flex items-center gap-2 cursor-pointer">
                  <Pencil className="h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2 cursor-pointer">
                  <Link2 className="h-4 w-4" /> Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/spaces/${spaceId}/pages/${page.id}`)} className="flex items-center gap-2 cursor-pointer text-[#97A0AF]">
                  <Copy className="h-4 w-4" /> Make a copy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/spaces/${spaceId}/pages/${page.id}`)} className="flex items-center gap-2 cursor-pointer">
                  <Move className="h-4 w-4" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[#97A0AF]">
                  <Archive className="h-4 w-4" /> Archive
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {expanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <PageItem
              key={child.id}
              page={child}
              allPages={allPages}
              spaceId={spaceId}
              activePageId={activePageId}
              depth={depth + 1}
              onRefresh={onRefresh}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* tiny custom icon components */
function ForYouIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="6" r="3" />
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
    </svg>
  );
}
function TemplatesIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="2" y="2" width="12" height="12" rx="1.5" />
      <line x1="2" y1="6" x2="14" y2="6" />
      <line x1="7" y1="6" x2="7" y2="14" />
    </svg>
  );
}
