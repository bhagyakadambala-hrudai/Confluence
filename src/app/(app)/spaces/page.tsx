"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, Eye, EyeOff, Star, MoreHorizontal, Trash2, Archive, Settings, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  status?: string | null;
}

const FILTER_TABS = ["All", "Watching", "Starred", "Archived", "Trashed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function SpacesPage() {
  const router = useRouter();
  const [allSpaces, setAllSpaces] = useState<Space[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadActive(); }, []);

  async function loadActive() {
    setLoading(true);
    const [spacesResp, starsResp, watchesResp] = await Promise.all([
      fetch("/api/spaces"),
      fetch("/api/stars"),
      fetch("/api/watches"),
    ]);

    if (spacesResp.ok) {
      const data: Space[] = await spacesResp.json();
      // Only treat as active — never force-override with archived/trashed
      setAllSpaces(data.map((s) => ({ ...s, status: s.status || "active" })));
    }
    if (starsResp.ok) {
      const stars = await starsResp.json();
      setStarredIds(new Set((stars.spaces || []).map((s: { id: string }) => s.id)));
    }
    if (watchesResp.ok) {
      const watches = await watchesResp.json();
      setWatchedIds(new Set((watches.spaces || []).map((s: { id: string }) => s.id)));
    }
    setLoading(false);
  }

  async function loadTabSpaces(status: "archived" | "trashed") {
    setTabLoading(true);
    const resp = await fetch(`/api/spaces?status=${status}`);
    if (resp.ok) {
      const data: Space[] = await resp.json();
      // Merge into allSpaces — add new ones, update existing ones' status
      setAllSpaces((prev) => {
        const existing = new Map(prev.map((s) => [s.id, s]));
        data.forEach((s) => existing.set(s.id, { ...s, status }));
        // Remove spaces of this status that are no longer returned
        const returnedIds = new Set(data.map((s) => s.id));
        prev.forEach((s) => { if (s.status === status && !returnedIds.has(s.id)) existing.delete(s.id); });
        return Array.from(existing.values());
      });
    }
    setTabLoading(false);
  }

  async function handleTabChange(tab: FilterTab) {
    setActiveTab(tab);
    if (tab === "Archived") loadTabSpaces("archived");
    else if (tab === "Trashed") loadTabSpaces("trashed");
  }

  async function toggleStar(spaceId: string) {
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "space", id: spaceId }),
    });
    if (resp.ok) {
      const { starred } = await resp.json();
      setStarredIds((prev) => {
        const next = new Set(prev);
        if (starred) next.add(spaceId); else next.delete(spaceId);
        return next;
      });
    }
  }

  async function toggleWatch(spaceId: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const resp = await fetch("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: spaceId }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const watched = data.watched ?? data.watching;
      setWatchedIds((prev) => {
        const next = new Set(prev);
        if (watched) next.add(spaceId); else next.delete(spaceId);
        return next;
      });
      toast.success(watched ? "Watching this space" : "Stopped watching");
    } else {
      toast.error("Failed to update watch");
    }
  }

  async function handleTrash(spaceId: string) {
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "trashed" }),
    });
    if (resp.ok) {
      toast.success("Space moved to Trash");
      setAllSpaces((prev) => prev.map((s) => s.id === spaceId ? { ...s, status: "trashed" } : s));
    } else {
      toast.error("Failed to trash space");
    }
  }

  async function handleArchive(spaceId: string) {
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    if (resp.ok) {
      toast.success("Space archived");
      setAllSpaces((prev) => prev.map((s) => s.id === spaceId ? { ...s, status: "archived" } : s));
    } else {
      toast.error("Failed to archive space");
    }
  }

  async function handleRestore(spaceId: string) {
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    if (resp.ok) {
      toast.success("Space restored");
      setAllSpaces((prev) => prev.map((s) => s.id === spaceId ? { ...s, status: "active" } : s));
    } else {
      toast.error("Failed to restore space");
    }
  }

  async function handleDeletePermanent(spaceId: string) {
    if (!confirm("Permanently delete this space? This cannot be undone.")) return;
    const resp = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Space permanently deleted");
      setAllSpaces((prev) => prev.filter((s) => s.id !== spaceId));
    } else {
      toast.error("Failed to delete space");
    }
  }

  const activeSpaces = allSpaces.filter((s) => !s.status || s.status === "active");

  const filtered = allSpaces.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "Starred") return matchSearch && starredIds.has(s.id) && (!s.status || s.status === "active");
    if (activeTab === "Watching") return matchSearch && watchedIds.has(s.id) && (!s.status || s.status === "active");
    if (activeTab === "Archived") return matchSearch && s.status === "archived";
    if (activeTab === "Trashed") return matchSearch && s.status === "trashed";
    return matchSearch && (!s.status || s.status === "active");
  });

  return (
    <div className="min-h-screen bg-white dark:bg-[#1B2A3B]">
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">Spaces</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            Create a space
          </button>
        </div>

        {/* Your spaces */}
        <section className="mb-8">
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-3">Your spaces</h2>
          {loading ? (
            <div className="text-sm text-[#6B778C] py-4">Loading…</div>
          ) : activeSpaces.length === 0 ? (
            <p className="text-sm text-[#6B778C] py-4">No spaces yet. Create one to get started.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {activeSpaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </section>

        {/* All spaces */}
        <section>
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-3">All spaces</h2>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 h-9 rounded border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 w-52 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC] transition-colors">
              <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by title"
                className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] w-full"
              />
            </div>

            {/* Category dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 h-9 rounded border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
                  All categories
                  <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44">
                <DropdownMenuItem>All categories</DropdownMenuItem>
                <DropdownMenuItem>Communal</DropdownMenuItem>
                <DropdownMenuItem>Personal</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Tab filters */}
            <div className="flex items-center gap-0.5 ml-auto flex-wrap">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    activeTab === tab
                      ? "bg-[#DEEBFF] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400 font-medium"
                      : "text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Spaces list */}
          {loading || tabLoading ? (
            <div className="text-sm text-[#6B778C] py-8 text-center">Loading spaces…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-[#6B778C] py-8 text-center">
              {activeTab === "Watching" ? "You are not watching any spaces yet. Click the eye icon on a space to start watching." :
               activeTab === "Starred" ? "No starred spaces. Star a space to find it quickly here." :
               activeTab === "Archived" ? "No archived spaces." :
               activeTab === "Trashed" ? "Trash is empty." :
               "No spaces found"}
            </div>
          ) : (
            <div className="divide-y divide-[#F4F5F7] dark:divide-slate-700 border border-[#DFE1E6] dark:border-slate-700 rounded-lg overflow-hidden">
              {filtered.map((space) => (
                <div
                  key={space.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8F9FF] dark:hover:bg-slate-700/30 transition-colors group bg-white dark:bg-transparent"
                >
                  <Link href={`/spaces/${space.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-[#6554C0] flex items-center justify-center shrink-0 text-xl leading-none">
                      {space.emoji || "📁"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] transition-colors">
                        {space.name}
                      </p>
                      {(space.status === "archived" || space.status === "trashed") && (
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          space.status === "trashed" ? "bg-red-100 text-red-600" : "bg-[#F4F5F7] text-[#6B778C]"
                        }`}>
                          {space.status === "trashed" ? "Trashed" : "Archived"}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {activeTab !== "Trashed" && activeTab !== "Archived" && (
                      <button
                        onClick={(e) => toggleWatch(space.id, e)}
                        className={`h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors ${watchedIds.has(space.id) ? "text-[#0052CC]" : "text-[#6B778C]"}`}
                        title={watchedIds.has(space.id) ? "Stop watching" : "Watch this space"}
                      >
                        {watchedIds.has(space.id)
                          ? <EyeOff className="h-4 w-4" />
                          : <Eye className="h-4 w-4" />}
                      </button>
                    )}
                    {activeTab !== "Trashed" && activeTab !== "Archived" && (
                      <button
                        onClick={(e) => { e.preventDefault(); toggleStar(space.id); }}
                        className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors"
                        title={starredIds.has(space.id) ? "Unstar" : "Star this space"}
                      >
                        <Star className={`h-4 w-4 ${starredIds.has(space.id) ? "fill-[#FFAB00] text-[#FFAB00]" : "text-[#6B778C]"}`} />
                      </button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-[#6B778C]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {space.status !== "archived" && space.status !== "trashed" && (
                          <>
                            <DropdownMenuItem onClick={() => router.push(`/spaces/${space.id}/settings`)} className="flex items-center gap-2 cursor-pointer">
                              <Settings className="h-4 w-4" /> Space settings
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleArchive(space.id)} className="flex items-center gap-2 cursor-pointer">
                              <Archive className="h-4 w-4" /> Archive space
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTrash(space.id)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /> Move to Trash
                            </DropdownMenuItem>
                          </>
                        )}
                        {space.status === "archived" && (
                          <>
                            <DropdownMenuItem onClick={() => handleRestore(space.id)} className="flex items-center gap-2 cursor-pointer">
                              <RotateCcw className="h-4 w-4" /> Restore space
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleTrash(space.id)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /> Move to Trash
                            </DropdownMenuItem>
                          </>
                        )}
                        {space.status === "trashed" && (
                          <>
                            <DropdownMenuItem onClick={() => handleRestore(space.id)} className="flex items-center gap-2 cursor-pointer">
                              <RotateCcw className="h-4 w-4" /> Restore space
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDeletePermanent(space.id)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                              <Trash2 className="h-4 w-4" /> Delete permanently
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CreateSpaceModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(space) => {
          setShowCreateModal(false);
          setAllSpaces((prev) => [{ ...space, status: "active" } as Space, ...prev]);
          router.push(`/spaces/${space.id}`);
        }}
      />
    </div>
  );
}

function SpaceCard({ space }: { space: Space }) {
  return (
    <Link
      href={`/spaces/${space.id}`}
      className="flex flex-col w-[152px] h-[152px] rounded-lg border border-[#DFE1E6] dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-[#0052CC]/30 transition-all group bg-white dark:bg-[#1e2d3d]"
    >
      <div className="flex-1 w-full flex items-center justify-center bg-[#F4F5F7] dark:bg-slate-700/50 group-hover:bg-[#EBECF0] dark:group-hover:bg-slate-700 transition-colors">
        <div className="h-16 w-16 rounded-2xl bg-[#6554C0] flex items-center justify-center text-3xl shadow-md">
          {space.emoji || "📁"}
        </div>
      </div>
      <div className="px-3 py-2.5 border-t border-[#E8EAED] dark:border-slate-700 bg-white dark:bg-[#1e2d3d]">
        <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] transition-colors">
          {space.name}
        </p>
      </div>
    </Link>
  );
}
