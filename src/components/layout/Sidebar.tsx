"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import {
  ChevronRight, Plus, MoreHorizontal, Search,
  LayoutGrid, BookOpen, Clock, Star, Globe, Layers,
  Building2, Users, MoreHorizontal as More,
  PanelLeftClose, FileText, ExternalLink, X, Filter,
} from "lucide-react";
import { cn, getInitials, formatRelativeTime } from "@/lib/utils";

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
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  user: import("@supabase/supabase-js").User;
}

export default function Sidebar({ open, onToggle, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [pageSearch, setPageSearch] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  type FlyoutPanel = "recent" | "starred" | "spaces" | null;
  const [flyout, setFlyout] = useState<FlyoutPanel>(null);
  const [recentPages, setRecentPages] = useState<Array<{ id: string; title: string; emoji: string; space_id: string; updated_at: string; spaces: { name: string } | null }>>([]);
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
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [flyout]);

  // Fetch recent pages when recent flyout opens
  useEffect(() => {
    if (flyout === "recent" && recentPages.length === 0) {
      supabase
        .from("pages")
        .select("id,title,emoji,space_id,updated_at,spaces(name)")
        .order("updated_at", { ascending: false })
        .limit(20)
        .then(({ data }) => {
          setRecentPages((data || []).map((p) => ({
            ...p,
            spaces: (p.spaces as unknown) as { name: string } | null,
          })));
        });
    }
  }, [flyout]);

  async function fetchSpaces() {
    const { data } = await supabase
      .from("spaces").select("id,name,emoji").order("created_at");
    setSpaces(data || []);
  }

  async function fetchPages(spaceId: string) {
    const { data } = await supabase
      .from("pages").select("id,title,emoji,parent_id")
      .eq("space_id", spaceId).order("position");
    setPages(data || []);
  }

  async function createPage() {
    if (!activeSpaceId) return;
    const resp = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: activeSpaceId, title: "Untitled", content: "", emoji: "📄" }),
    });
    if (resp.ok) {
      const page = await resp.json();
      fetchPages(activeSpaceId);
      router.push(`/spaces/${activeSpaceId}/pages/${page.id}/edit`);
    }
  }

  const filteredPages = pages.filter((p) =>
    !pageSearch || p.title.toLowerCase().includes(pageSearch.toLowerCase())
  );

  if (!open) return null;

  return (
    <>
      <aside className="w-[280px] shrink-0 flex flex-col h-full bg-white dark:bg-[#161B22] border-r border-[#E8EAED] dark:border-[#30363d] select-none">

        {/* ── Logo bar ── */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E8EAED] dark:border-[#30363d]">
          <div className="flex items-center gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
              <LayoutGrid className="h-4.5 w-4.5 text-[#42526E] dark:text-slate-400" strokeWidth={1.8} />
            </button>
            <Link href="/" className="flex items-center gap-1.5">
              <div className="h-6 w-6 bg-[#0052CC] rounded flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-semibold text-[#172B4D] dark:text-white text-sm">Confluence</span>
            </Link>
          </div>
          <button
            onClick={onToggle}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
          >
            <PanelLeftClose className="h-4 w-4 text-[#6B778C] dark:text-slate-400" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          {/* ── Global nav ── */}
          <nav className="py-1">
            <NavItem icon={<ForYouIcon />} label="For you" href="/" active={pathname === "/"} />
            <NavItem icon={<TemplatesIcon />} label="Templates" href="/templates" active={pathname === "/templates"} />
            <NavItem icon={<Clock className="h-4 w-4" />} label="Recent" href="#" hasChevron
              expanded={flyout === "recent"} onToggle={() => toggleFlyout("recent")} active={flyout === "recent"} />
            <NavItem icon={<Star className="h-4 w-4" />} label="Starred" href="#" hasChevron
              expanded={flyout === "starred"} onToggle={() => toggleFlyout("starred")} active={flyout === "starred"} />
            <NavItem icon={<Globe className="h-4 w-4" />} label="Spaces" href="#" hasChevron
              expanded={flyout === "spaces"} onToggle={() => toggleFlyout("spaces")} active={flyout === "spaces"} />
            <NavItem icon={<Layers className="h-4 w-4" />} label="Apps" href="#" />
          </nav>

          {/* ── Divider ── */}
          <div className="h-px bg-[#E8EAED] dark:bg-[#30363d] mx-0 my-1" />

          {/* ── Space context section ── */}
          {activeSpace ? (
            <div className="py-1">
              {/* Space header row */}
              <div className="flex items-center gap-2 px-3 py-2">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={fullName} className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[#0052CC] flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">{initials.charAt(0)}</span>
                  </div>
                )}
                <Link href={`/spaces/${activeSpace.id}`}
                  className="flex-1 min-w-0 font-semibold text-sm text-[#172B4D] dark:text-white truncate hover:text-[#0052CC]">
                  {activeSpace.name}
                </Link>
                <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d]">
                  <MoreHorizontal className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
              </div>

              {/* Content header */}
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 uppercase tracking-wider">Content</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={createPage}
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
                  />
                ))}
              </div>

              {/* + Create */}
              <button
                onClick={createPage}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors mt-1"
              >
                <Plus className="h-4 w-4 text-[#6B778C]" />
                Create
              </button>
            </div>
          ) : (
            /* No active space — show all spaces */
            <div className="py-2 px-2">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-xs font-semibold text-[#6B778C] uppercase tracking-wider">Spaces</span>
                <button onClick={() => setCreateModalOpen(true)}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#F1F2F4] transition-colors">
                  <Plus className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
              </div>
              {spaces.length === 0 ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-xs text-[#6B778C]">No spaces yet</p>
                  <button onClick={() => setCreateModalOpen(true)} className="text-xs text-[#0052CC] hover:underline mt-1">Create one</button>
                </div>
              ) : (
                spaces.map((s) => (
                  <Link key={s.id} href={`/spaces/${s.id}`}
                    className="flex items-center gap-2.5 px-2 py-2 rounded text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                    <span className="text-lg leading-none">{s.emoji}</span>
                    <span className="truncate font-medium">{s.name}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* ── Divider ── */}
          <div className="h-px bg-[#E8EAED] dark:bg-[#30363d] mx-0 my-1" />

          {/* ── Bottom links ── */}
          <nav className="py-1">
            <BottomLink icon={<Building2 className="h-4 w-4" />} label="Company hub" />
            <BottomLink icon={<Users className="h-4 w-4" />} label="Teams" />
            <BottomLink icon={<More className="h-4 w-4" />} label="More" />
          </nav>
        </ScrollArea>

        {/* ── Invite people ── */}
        <div className="border-t border-[#E8EAED] dark:border-[#30363d] p-3">
          <button className="w-full py-2 text-sm font-medium text-[#172B4D] dark:text-slate-300 border border-[#E8EAED] dark:border-[#30363d] rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
            Invite people
          </button>
        </div>
      </aside>

      <CreateSpaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(space) => {
          fetchSpaces();
          router.push(`/spaces/${space.id}`);
        }}
      />

      {/* ── Flyout panels ── */}
      {flyout && (
        <div ref={flyoutRef} className="fixed left-[280px] top-[48px] bottom-0 w-[340px] bg-white dark:bg-[#1B2A3B] border-r border-[#E8EAED] dark:border-[#30363d] shadow-xl z-40 flex flex-col">

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
                            href={`/spaces/${page.space_id}/pages/${page.id}`}
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
              <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
                {/* Star empty state illustration */}
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
                  Mark items that are important to you with a star to quickly access them. You&apos;ll see those items here.
                </p>
              </div>
            </>
          )}

          {/* Spaces flyout */}
          {flyout === "spaces" && (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8EAED] dark:border-[#30363d]">
                <span className="font-semibold text-sm text-[#172B4D] dark:text-white">Spaces</span>
                <button onClick={() => setFlyout(null)} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors">
                  <X className="h-4 w-4 text-[#6B778C]" />
                </button>
              </div>
              <div className="px-3 py-2 border-b border-[#E8EAED] dark:border-[#30363d]">
                <div className="flex items-center gap-2 px-2 h-8 rounded border border-[#E8EAED] dark:border-[#30363d] bg-white dark:bg-[#0d1117]">
                  <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
                  <input
                    value={flyoutSearch}
                    onChange={(e) => setFlyoutSearch(e.target.value)}
                    placeholder="Filter spaces"
                    className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-300 placeholder:text-[#97A0AF] w-full"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1">
                <div className="px-2 py-2">
                  <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 px-2 py-1.5 uppercase tracking-wide">Starred</p>
                  {spaces
                    .filter((s) => !flyoutSearch || s.name.toLowerCase().includes(flyoutSearch.toLowerCase()))
                    .map((space) => (
                      <Link
                        key={space.id}
                        href={`/spaces/${space.id}`}
                        onClick={() => setFlyout(null)}
                        className="flex items-center gap-2.5 px-2 py-2 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors group"
                      >
                        <div className="h-7 w-7 rounded bg-[#DEEBFF] dark:bg-blue-900/40 flex items-center justify-center text-base shrink-0">
                          {space.emoji || "📁"}
                        </div>
                        <span className="flex-1 text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                          {space.name}
                        </span>
                        <Star className="h-3.5 w-3.5 text-[#FFAB00] fill-[#FFAB00] shrink-0" />
                      </Link>
                    ))}
                </div>
              </ScrollArea>
              <div className="border-t border-[#E8EAED] dark:border-[#30363d] p-2 space-y-0.5">
                {[
                  { icon: <Filter className="h-3.5 w-3.5" />, label: "View all spaces" },
                  { icon: <Plus className="h-3.5 w-3.5" />, label: "Create a space", onClick: () => { setFlyout(null); setCreateModalOpen(true); } },
                  { icon: <ExternalLink className="h-3.5 w-3.5" />, label: "Import from other tools" },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className="w-full text-left text-sm text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
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

function BottomLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] cursor-pointer transition-colors group">
      <span className="text-[#6B778C] dark:text-slate-400 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      <ExternalLink className="h-3.5 w-3.5 text-[#6B778C] opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function PageItem({ page, allPages, spaceId, activePageId, depth }: {
  page: Page; allPages: Page[]; spaceId: string;
  activePageId?: string; depth: number;
}) {
  const children = allPages.filter((p) => p.parent_id === page.id);
  const [expanded, setExpanded] = useState(false);
  const isActive = activePageId === page.id;

  return (
    <div>
      <div className={cn(
        "flex items-center gap-1 py-1 rounded text-sm group transition-colors",
        isActive
          ? "bg-[#E9F0FB] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-300 font-medium"
          : "text-[#172B4D] dark:text-slate-300 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d]"
      )}
        style={{ paddingLeft: `${(depth * 16) + 8}px` }}
      >
        {/* bullet dot */}
        <span className="h-4 w-4 flex items-center justify-center shrink-0">
          {children.length > 0 ? (
            <button onClick={() => setExpanded(!expanded)} className="h-4 w-4 flex items-center justify-center">
              <ChevronRight className={cn("h-3 w-3 text-[#6B778C] transition-transform", expanded && "rotate-90")} />
            </button>
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-[#C1C7D0] dark:bg-slate-500 mx-auto" />
          )}
        </span>
        <Link
          href={`/spaces/${spaceId}/pages/${page.id}`}
          className="flex items-center gap-1.5 flex-1 min-w-0 py-0.5 pr-2"
        >
          <FileText className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-[#0052CC]" : "text-[#6B778C]")} />
          <span className="truncate text-xs">{page.title || "Untitled"}</span>
        </Link>
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
