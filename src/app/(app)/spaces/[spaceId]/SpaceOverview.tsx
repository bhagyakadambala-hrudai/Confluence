"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import {
  Edit, Share2, Link2, MoreHorizontal, Star, Users,
  FileText, Trash2, Settings, UserPlus, Plus,
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

export default function SpaceOverview({
  space, pages, members, currentUserId,
}: {
  space: Space; pages: Page[]; members: Member[]; currentUserId: string;
}) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "members">("overview");

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

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#161B22]">

      {/* ── Breadcrumb bar ── */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-[#E8EAED] dark:border-[#30363d] shrink-0">
        <span className="text-sm font-medium text-[#172B4D] dark:text-slate-300">{space.name}</span>
        <div className="flex items-center gap-1">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-xs bg-[#0052CC] text-white font-semibold">
              {getInitials(members.find(m => m.profiles?.id === currentUserId)?.profiles?.full_name || "U")}
            </AvatarFallback>
          </Avatar>
          <Link
            href={`/spaces/${space.id}/pages/new`}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ml-1"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Share2 className="h-3.5 w-3.5" /> Share
          </button>
          <button onClick={copyLink} className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400">
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
        <div className="h-44 w-full bg-gradient-to-r from-[#00B8D9] via-[#0052CC] to-[#403294]" />
        {/* Space icon overlapping banner */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="h-20 w-20 rounded-2xl bg-[#6554C0] flex items-center justify-center text-4xl shadow-xl border-4 border-white dark:border-[#161B22]">
            {space.emoji || "📁"}
          </div>
        </div>
      </div>

      {/* ── Space name ── */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white">{space.name}</h1>
          <button
            onClick={() => setActiveTab("members")}
            className="flex items-center gap-1.5 px-2 py-1 rounded border border-[#DFE1E6] dark:border-[#30363d] text-xs text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            <span>{members.length}</span>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pb-16">

          {/* Description */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white mb-3">Description</h2>
            <div className="bg-[#F4F5F7] dark:bg-[#21262d] rounded px-4 py-3 text-sm text-[#6B778C] dark:text-slate-400">
              {space.description || "In a sentence or two, describe the purpose of this space."}
            </div>
          </section>

          {/* Recently updated content */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white">Recently updated content</h2>
              <Link
                href={`/spaces/${space.id}`}
                className="text-xs text-[#0052CC] hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="bg-[#EAF2FF] dark:bg-blue-900/20 border border-[#DEEBFF] dark:border-blue-800/30 rounded px-4 py-3 text-sm text-[#0052CC] dark:text-blue-300 mb-3 flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">ℹ️</span>
              <span>This list below will automatically update each time somebody in your space creates or updates content.</span>
            </div>
            {pages.length === 0 ? (
              <p className="text-sm text-[#6B778C] dark:text-slate-400">No pages yet.</p>
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

          {/* Contributors */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white mb-3">Contributors</h2>
            <div className="bg-[#EAF2FF] dark:bg-blue-900/20 border border-[#DEEBFF] dark:border-blue-800/30 rounded px-4 py-3 text-sm text-[#0052CC] dark:text-blue-300 mb-3 flex items-start gap-2">
              <span className="text-base leading-none mt-0.5">ℹ️</span>
              <span>This list below will automatically update each time somebody in your space creates or updates content.</span>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-[#6B778C]">No contributors found for the selected page(s)</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {members.map((m, i) => m.profiles && (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#DFE1E6] dark:border-[#30363d] bg-white dark:bg-[#21262d]">
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarImage src={m.profiles.avatar_url} />
                      <AvatarFallback className="text-xs bg-[#6554C0] text-white">{getInitials(m.profiles.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium text-[#172B4D] dark:text-slate-200">{m.profiles.full_name}</p>
                      <p className="text-[10px] text-[#6B778C] capitalize">{m.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
