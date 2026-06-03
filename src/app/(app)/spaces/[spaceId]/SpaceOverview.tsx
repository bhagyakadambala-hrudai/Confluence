"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import {
  Edit, Link2, MoreHorizontal, Star, Users,
  FileText, Trash2, Settings, Lock, X,
  ChevronDown, MoreHorizontal as More,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Space {
  id: string; name: string; emoji: string;
  description: string | null; owner_id: string;
}
interface Page {
  id: string; title: string; emoji: string;
  updated_at: string;
  profiles: { full_name: string; avatar_url: string } | null;
}
interface Member {
  role: string;
  profiles: { id: string; full_name: string; avatar_url: string; email: string } | null;
}

/* ── Space Share Modal ── */
function SpaceShareModal({ space, members, onClose }: { space: Space; members: Member[]; onClose: () => void }) {
  const [accessMode, setAccessMode] = useState<"open" | "restricted">("open");
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const accessMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) setShowAccessMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/spaces/${space.id}`);
    toast.success("Link copied");
    onClose();
  }

  // Suggestion chips: first 3 members
  const suggestions = members.filter(m => m.profiles).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl w-full max-w-[560px] mx-4 overflow-visible border border-[#DFE1E6] dark:border-[#30363d]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">Share</h2>
          <div className="flex items-center gap-1">
            <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-[#6B778C]">
              <More className="h-4 w-4" />
            </button>
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-[#6B778C]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            type="text"
            placeholder="Add names, teams, groups, or emails"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-[#DFE1E6] dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
          />
          {/* Suggestion chips */}
          {!searchQuery && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((m, i) => m.profiles && (
                <button
                  key={i}
                  onClick={() => toast("Invite sent")}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DFE1E6] dark:border-[#30363d] text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
                >
                  <span className="text-[#0052CC]">+</span>
                  {m.profiles.full_name || m.profiles.email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* General access */}
        <div className="px-5 pb-4">
          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-3">General access</p>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F4F5F7] dark:bg-[#21262d] flex items-center justify-center shrink-0">
              <Lock className={`h-4 w-4 ${accessMode === "restricted" ? "text-red-500" : "text-[#42526E] dark:text-slate-400"}`} />
            </div>
            <div className="flex-1 min-w-0 relative" ref={accessMenuRef}>
              <button
                onClick={() => setShowAccessMenu((v) => !v)}
                className="flex items-center gap-1 text-sm font-medium text-[#0052CC] hover:underline"
              >
                {accessMode === "open" ? "Open" : "Restricted"}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                {accessMode === "open" ? "Anyone in this space" : "Only specific people can view or edit"}
              </p>

              {/* Dropdown */}
              {showAccessMenu && (
                <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-50 overflow-hidden">
                  <button
                    onClick={() => { setAccessMode("open"); setShowAccessMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${accessMode === "open" ? "bg-[#EAF2FF] dark:bg-blue-900/20" : "hover:bg-[#F4F5F7] dark:hover:bg-[#21262d]"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-[#F4F5F7] dark:bg-[#21262d] flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-[#42526E]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-white">Open</p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400">Anyone in this space</p>
                    </div>
                  </button>
                  <button
                    onClick={() => { setAccessMode("restricted"); setShowAccessMenu(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${accessMode === "restricted" ? "bg-[#EAF2FF] dark:bg-blue-900/20" : "hover:bg-[#F4F5F7] dark:hover:bg-[#21262d]"}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center shrink-0">
                      <Lock className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-white">Restricted</p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400">Only specific people can view or edit</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <button className="shrink-0 flex items-center gap-1 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors">
              Can edit <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
            </button>
          </div>
        </div>

        {/* Divider + Copy link */}
        <div className="border-t border-[#F4F5F7] dark:border-[#30363d]" />
        <button
          onClick={copyLink}
          className="flex items-center gap-2.5 w-full px-5 py-3.5 text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
        >
          <Link2 className="h-4 w-4 text-[#42526E] dark:text-slate-400" />
          Copy link
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function SpaceOverview({
  space, pages, members, currentUserId,
}: {
  space: Space; pages: Page[]; members: Member[]; currentUserId: string;
}) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  async function handleStar() {
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "space", id: space.id }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setIsStarred(data.starred);
      toast.success(data.starred ? "Space starred" : "Star removed");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete space "${space.name}"? This cannot be undone.`)) return;
    const resp = await fetch(`/api/spaces/${space.id}`, { method: "DELETE" });
    if (resp.ok) { toast.success("Space deleted"); router.push("/spaces"); }
    else toast.error("Failed to delete");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/spaces/${space.id}`);
    toast.success("Link copied");
  }

  const currentMember = members.find(m => m.profiles?.id === currentUserId);

  return (
    <>
    <div className="flex flex-col min-h-full bg-white dark:bg-[#161B22]">

      {/* ── Breadcrumb bar ── */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-[#E8EAED] dark:border-[#30363d] shrink-0">
        <span className="text-sm font-medium text-[#172B4D] dark:text-slate-300">{space.name}</span>
        <div className="flex items-center gap-1.5">
          {currentMember?.profiles && (
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={currentMember.profiles.avatar_url} />
              <AvatarFallback className="text-xs bg-[#0052CC] text-white font-semibold">
                {getInitials(currentMember.profiles.full_name || "U")}
              </AvatarFallback>
            </Avatar>
          )}
          <Link
            href={`/spaces/${space.id}/edit`}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Lock className="h-3.5 w-3.5" /> Share
          </button>
          <button
            onClick={copyLink}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStar} className="flex items-center gap-2 cursor-pointer">
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                {isStarred ? "Unstar space" : "Star space"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/spaces/${space.id}/settings`)} className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> Space settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4" /> Delete space
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Hero banner ── */}
      <div className="relative shrink-0">
        <div className="h-44 w-full bg-gradient-to-r from-[#00B8D9] via-[#0052CC] to-[#1A237E]" />
        {/* Space icon */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="h-20 w-20 rounded-2xl bg-[#0052CC] flex items-center justify-center shadow-xl border-4 border-white dark:border-[#161B22]">
            {space.emoji ? (
              <span className="text-4xl">{space.emoji}</span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* ── Space name ── */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white">{space.name}</h1>
          <button
            onClick={() => {}}
            className="flex items-center justify-center h-8 w-8 rounded border border-[#DFE1E6] dark:border-[#30363d] text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pb-16">

          {/* Description / rich content */}
          <section className="mb-8">
            {space.description && space.description.startsWith("<") ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-[#172B4D] dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: space.description }}
              />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white mb-3">Description</h2>
                <div className="bg-[#F4F5F7] dark:bg-[#21262d] rounded px-4 py-3 text-sm text-[#6B778C] dark:text-slate-400">
                  {space.description || "In a sentence or two, describe the purpose of this space."}
                </div>
              </>
            )}
          </section>

          {/* Project Tracker */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white mb-3">Project Tracker</h2>
            <div className="text-sm text-[#6B778C] dark:text-slate-400">
              There are no recent updates at this time.
            </div>
          </section>

          {/* Recently updated content */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white">Recently updated content</h2>
              <Link href={`/spaces/${space.id}`} className="text-xs text-[#0052CC] hover:underline">View all</Link>
            </div>
            <div className="bg-[#EAF2FF] dark:bg-blue-900/20 border border-[#DEEBFF] dark:border-blue-800/30 rounded px-4 py-3 text-sm text-[#0052CC] dark:text-blue-300 mb-3 flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">ℹ️</span>
              <span>This list below will automatically update each time somebody in your space creates or updates content.</span>
            </div>
            {pages.length === 0 ? (
              <p className="text-sm text-[#6B778C] dark:text-slate-400">There are no recent updates at this time.</p>
            ) : (
              <div className="space-y-1">
                {pages.map((page) => (
                  <Link
                    key={page.id}
                    href={`/spaces/${space.id}/pages/${page.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors group"
                  >
                    <FileText className="h-4 w-4 text-[#0052CC] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-[#0052CC] group-hover:underline truncate block">
                        {page.title || "Untitled"}
                      </span>
                      <span className="text-xs text-[#6B778C] dark:text-slate-400">
                        {formatRelativeTime(page.updated_at)}
                        {page.profiles?.full_name && ` · contributed by ${page.profiles.full_name}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>

    {showShareModal && (
      <SpaceShareModal
        space={space}
        members={members}
        onClose={() => setShowShareModal(false)}
      />
    )}
    </>
  );
}
