"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, ChevronDown, Eye, Star, MoreHorizontal, Plus, Trash2, Archive, Settings } from "lucide-react";
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
}

const FILTER_TABS = ["All", "Watching", "Starred", "Communal", "Personal", "Archived", "Trashed"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export default function SpacesPage() {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    const [spacesResp, starsResp] = await Promise.all([
      fetch("/api/spaces"),
      fetch("/api/stars"),
    ]);
    if (spacesResp.ok) setSpaces(await spacesResp.json());
    if (starsResp.ok) {
      const stars = await starsResp.json();
      setStarredIds(new Set((stars.spaces || []).map((s: { id: string }) => s.id)));
    }
    setLoading(false);
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

  async function handleDelete(spaceId: string) {
    const resp = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Space deleted");
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
    } else {
      toast.error("Failed to delete");
    }
  }

  const filtered = spaces.filter((s) => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    if (activeTab === "Starred") return matchSearch && starredIds.has(s.id);
    if (activeTab === "Watching") return matchSearch && false;
    return matchSearch;
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
          ) : (
            <div className="flex flex-wrap gap-3">
              {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex flex-col items-center justify-center w-[152px] h-[152px] rounded-lg border-2 border-dashed border-[#DFE1E6] dark:border-slate-600 hover:border-[#0052CC] hover:bg-[#F8F9FF] dark:hover:bg-slate-700/20 transition-colors group"
              >
                <Plus className="h-6 w-6 text-[#C1C7D0] group-hover:text-[#0052CC] mb-1 transition-colors" />
                <span className="text-xs text-[#6B778C] group-hover:text-[#0052CC] transition-colors">New space</span>
              </button>
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
                  onClick={() => setActiveTab(tab)}
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
          {loading ? (
            <div className="text-sm text-[#6B778C] py-8 text-center">Loading spaces…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-[#6B778C] py-8 text-center">No spaces found</div>
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
                    </div>
                  </Link>

                  {/* Category */}
                  <span className="text-sm text-[#6B778C] dark:text-slate-400 hidden md:block shrink-0 w-32 truncate">
                    {space.description || "collaboration"}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toast("Watch feature coming soon")}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors"
                      title="Watch"
                    >
                      <Eye className="h-4 w-4 text-[#6B778C]" />
                    </button>
                    <button
                      onClick={() => toggleStar(space.id)}
                      className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors"
                      title={starredIds.has(space.id) ? "Unstar" : "Star this space"}
                    >
                      <Star className={`h-4 w-4 ${starredIds.has(space.id) ? "fill-[#FFAB00] text-[#FFAB00]" : "text-[#6B778C]"}`} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4 text-[#6B778C]" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => router.push(`/spaces/${space.id}`)} className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" /> Space settings
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[#97A0AF]">
                          <Archive className="h-4 w-4" /> Archive space
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(space.id)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                          <Trash2 className="h-4 w-4" /> Delete space
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {showCreateModal && (
        <CreateSpaceModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={(space) => {
            setShowCreateModal(false);
            router.push(`/spaces/${space.id}`);
          }}
        />
      )}
    </div>
  );
}

function SpaceCard({ space }: { space: Space }) {
  return (
    <Link
      href={`/spaces/${space.id}`}
      className="flex flex-col w-[152px] h-[152px] rounded-lg border border-[#DFE1E6] dark:border-slate-700 overflow-hidden hover:shadow-md hover:border-[#0052CC]/30 transition-all group bg-white dark:bg-[#1e2d3d]"
    >
      {/* Icon area */}
      <div className="flex-1 w-full flex items-center justify-center bg-[#F4F5F7] dark:bg-slate-700/50 group-hover:bg-[#EBECF0] dark:group-hover:bg-slate-700 transition-colors">
        <div className="h-16 w-16 rounded-2xl bg-[#6554C0] flex items-center justify-center text-3xl shadow-md">
          {space.emoji || "📁"}
        </div>
      </div>
      {/* Name */}
      <div className="px-3 py-2.5 border-t border-[#E8EAED] dark:border-slate-700 bg-white dark:bg-[#1e2d3d]">
        <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] transition-colors">
          {space.name}
        </p>
      </div>
    </Link>
  );
}
