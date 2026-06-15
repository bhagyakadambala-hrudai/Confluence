"use client";

import { useState, useEffect, useMemo } from "react";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentSection from "@/components/comments/CommentSection";
import ReactionBar from "@/components/pages/ReactionBar";
import MovePageModal from "@/components/pages/MovePageModal";
import ShareModal from "@/components/pages/ShareModal";
import {
  Star,
  Eye,
  Edit2,
  MoreHorizontal,
  Link2,
  Trash2,
  ChevronRight,
  Move,
  Share2,
  Lock,
} from "lucide-react";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface PageViewProps {
  page: {
    id: string;
    title: string;
    content: string;
    emoji: string;
    space_id: string;
    parent_id: string | null;
    author_id: string;
    labels: string[];
    updated_at: string;
    created_at: string;
    access_mode?: string;
    profiles: { id: string; full_name: string; avatar_url: string } | null;
  };
  space: { id: string; name: string; emoji: string } | null;
  parentPage: { id: string; title: string; emoji: string } | null;
  labels: { id: string; name: string; color: string }[];
  currentUserId: string;
  canEdit?: boolean;
}

export default function PageView({
  page,
  space,
  parentPage,
  labels,
  currentUserId,
  canEdit = true,
}: PageViewProps) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const authorName = page.profiles?.full_name || "Unknown";
  const authorAvatar = page.profiles?.avatar_url;

  useEffect(() => {
    Promise.all([
      fetch("/api/stars").then((r) => (r.ok ? r.json() : { pages: [] })),
      fetch("/api/watches").then((r) => (r.ok ? r.json() : [])),
    ]).then(([stars, watches]) => {
      setIsStarred((stars.pages || []).some((p: { id: string }) => p.id === page.id));
      setIsWatching((watches as string[]).includes(page.id));
    });
  }, [page.id]);

  async function handleStar() {
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "page", id: page.id }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setIsStarred(data.starred);
      toast.success(data.starred ? "Page starred" : "Star removed");
    }
  }

  async function handleWatch() {
    const resp = await fetch("/api/watches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: page.id }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setIsWatching(data.watching);
      toast.success(data.watching ? "Watching this page" : "Stopped watching");
    }
  }

  async function handleDelete() {
    const resp = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Page deleted");
      router.push(`/spaces/${page.space_id}`);
    } else {
      toast.error("Failed to delete page");
    }
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="bg-white dark:bg-[#1B2A3B]">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 h-12 flex items-center justify-between px-4 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B]">
        {/* Left: breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-[#6B778C] dark:text-slate-400 min-w-0">
          {space && (
            <>
              <Link
                href={`/spaces/${space.id}`}
                className="flex items-center gap-1 hover:text-[#0052CC] dark:hover:text-blue-400 transition-colors shrink-0"
              >
                <span>{space.emoji}</span>
                <span className="font-medium text-[#172B4D] dark:text-slate-200 hover:text-[#0052CC]">
                  {space.name}
                </span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          )}
          {parentPage && (
            <>
              <Link
                href={`/spaces/${page.space_id}/pages/${parentPage.id}`}
                className="flex items-center gap-1 hover:text-[#0052CC] dark:hover:text-blue-400 transition-colors shrink-0"
              >
                <span>{parentPage.emoji}</span>
                <span className="hover:text-[#0052CC] truncate max-w-[120px]">
                  {parentPage.title}
                </span>
              </Link>
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </>
          )}
          <span className="truncate max-w-[200px] text-[#172B4D] dark:text-slate-200 font-medium">
            {page.title || "Untitled"}
          </span>
          {page.access_mode === "restricted" && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs rounded border border-amber-200 dark:border-amber-700 shrink-0">
              <Lock className="h-3 w-3" />
              Restricted
            </span>
          )}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Star */}
          <button
            onClick={handleStar}
            title={isStarred ? "Remove star" : "Star this page"}
            className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
              isStarred
                ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700"
            }`}
          >
            <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-500" : ""}`} />
          </button>

          {/* Watch */}
          <button
            onClick={handleWatch}
            title={isWatching ? "Stop watching" : "Watch this page"}
            className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
              isWatching
                ? "text-[#0052CC] bg-[#DEEBFF] dark:bg-blue-900/20"
                : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700"
            }`}
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* Edit button or read-only badge */}
          {canEdit ? (
            <Link
              href={`/spaces/${page.space_id}/pages/${page.id}/edit`}
              className="flex items-center gap-1.5 px-3 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded transition-colors"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 px-3 h-8 bg-[#F4F5F7] dark:bg-slate-700 text-[#6B778C] dark:text-slate-400 text-sm font-medium rounded">
              <Lock className="h-3.5 w-3.5" />
              View only
            </span>
          )}

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Link2 className="h-4 w-4" />
                Copy link
              </DropdownMenuItem>
              {canEdit && (
                <DropdownMenuItem
                  onClick={() => setShowMoveModal(true)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Move className="h-4 w-4" />
                  Move to
                </DropdownMenuItem>
              )}
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Page content ── */}
      <div className="max-w-4xl mx-auto px-16 py-10">
        {/* Title */}
        <h1 className="text-4xl font-bold text-[#172B4D] dark:text-white leading-tight mb-4">
          {page.emoji && <span className="mr-2">{page.emoji}</span>}
          {page.title || "Untitled"}
        </h1>

        {/* Author + date */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar className="h-6 w-6">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback className="text-[10px] bg-[#0052CC] text-white font-bold">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-[#6B778C] dark:text-slate-400">
            By{" "}
            <span className="text-[#172B4D] dark:text-slate-200 font-medium">{authorName}</span>
          </span>
          <span className="text-xs text-[#97A0AF] dark:text-slate-500">·</span>
          <span className="text-sm text-[#6B778C] dark:text-slate-400">
            Last updated {formatRelativeTime(page.updated_at)}
          </span>
        </div>

        {/* Labels */}
        {page.labels && page.labels.length > 0 && (
          <div className="flex items-center gap-1.5 mb-4">
            {page.labels.map((lid) => {
              const label = labels.find((l) => l.id === lid);
              if (!label) return null;
              return (
                <span
                  key={lid}
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                </span>
              );
            })}
          </div>
        )}

        {/* Divider */}
        <hr className="border-[#DFE1E6] dark:border-slate-700 mb-8" />

        {/* Rendered content */}
        <div
          className="prose prose-slate dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || "") }}
        />

        {/* Reactions */}
        <ReactionBar pageId={page.id} />

        {/* Comments */}
        <div className="mt-16 border-t border-[#F4F5F7] dark:border-slate-700 pt-8">
          <CommentSection pageId={page.id} currentUserId={currentUserId} />
        </div>
      </div>

      {showMoveModal && (
        <MovePageModal
          pageId={page.id}
          currentSpaceId={page.space_id}
          onClose={() => setShowMoveModal(false)}
        />
      )}
      {showShareModal && (
        <ShareModal
          pageId={page.id}
          spaceId={page.space_id}
          pageTitle={page.title || "Untitled"}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
