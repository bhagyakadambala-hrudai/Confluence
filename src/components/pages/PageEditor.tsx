"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from "./Breadcrumb";
import CommentSection from "@/components/comments/CommentSection";
import LabelPicker from "./LabelPicker";
import EmojiPicker from "@/components/common/EmojiPicker";
import { toast } from "sonner";
import { History, Trash2, ChevronDown, Loader2, Check, Share2, Star, MoreHorizontal, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Editor = dynamic(() => import("@/components/editor/Editor"), { ssr: false });

interface PageEditorProps {
  page: {
    id: string; title: string; content: string; emoji: string;
    space_id: string; parent_id: string | null; author_id: string;
    labels: string[]; updated_at: string;
    profiles: { id: string; full_name: string; avatar_url: string } | null;
  };
  space: { id: string; name: string; emoji: string } | null;
  parentPage: { id: string; title: string; emoji: string } | null;
  labels: { id: string; name: string; color: string }[];
  currentUserId: string;
}

type SaveStatus = "saved" | "saving" | "unsaved";

export default function PageEditor({ page, space, parentPage, labels, currentUserId }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content || "");
  const [emoji, setEmoji] = useState(page.emoji || "📄");
  const [pageLabels, setPageLabels] = useState<string[]>(page.labels || []);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({ title: page.title, content: page.content || "", emoji: page.emoji || "📄" });

  const authorName = page.profiles?.full_name || "Unknown";
  const authorAvatar = page.profiles?.avatar_url;

  const save = useCallback(async (t: string, c: string, e: string, publish = false) => {
    setSaveStatus("saving");
    const resp = await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, content: c, emoji: e }),
    });
    if (resp.ok) {
      lastSaved.current = { title: t, content: c, emoji: e };
      setSaveStatus("saved");
      if (publish) {
        await fetch(`/api/pages/${page.id}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, content: c }),
        });
        toast.success("Version published!");
      }
    } else {
      setSaveStatus("unsaved");
      toast.error("Failed to save");
    }
  }, [page.id]);

  useEffect(() => {
    const changed = title !== lastSaved.current.title || content !== lastSaved.current.content || emoji !== lastSaved.current.emoji;
    if (!changed) return;
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(title, content, emoji), 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, emoji, save]);

  async function handleDelete() {
    const resp = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Page deleted");
      router.push(`/spaces/${page.space_id}`);
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleEmojiChange(newEmoji: string) {
    setEmoji(newEmoji);
    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: newEmoji }),
    });
  }

  async function handleLabelChange(labelIds: string[]) {
    setPageLabels(labelIds);
    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: labelIds }),
    });
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B]">

      {/* Top action bar — like Confluence's */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B] sticky top-0 z-10">
        <Breadcrumb space={space} parentPage={parentPage} currentPage={{ title, emoji }} spaceId={page.space_id} />

        <div className="flex items-center gap-2">
          {/* Save status */}
          <div className="flex items-center gap-1 text-xs text-[#6B778C] dark:text-slate-400 min-w-[90px] justify-end">
            {saveStatus === "saving" && (
              <><Loader2 className="h-3 w-3 animate-spin" /><span>Saving…</span></>
            )}
            {saveStatus === "saved" && (
              <><Check className="h-3 w-3 text-green-500" /><span>Saved</span></>
            )}
            {saveStatus === "unsaved" && <span>Unsaved</span>}
          </div>

          <Link href={`/spaces/${page.space_id}/pages/${page.id}/history`}>
            <button className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
              <History className="h-3.5 w-3.5" />
              <span className="hidden sm:block">Edited {formatRelativeTime(page.updated_at)}</span>
            </button>
          </Link>

          <button className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
            <Share2 className="h-3.5 w-3.5" />
            <span className="hidden sm:block">Share</span>
          </button>

          <button className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
            <Star className="h-3.5 w-3.5" />
          </button>

          <Button
            size="sm"
            className="bg-[#0052CC] hover:bg-[#0065FF] text-white h-8 px-4 text-sm font-semibold"
            onClick={() => save(title, content, emoji, true)}
          >
            Publish…
          </Button>

          <button className="flex items-center justify-center h-8 w-8 text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
            <LinkIcon className="h-3.5 w-3.5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center h-8 w-8 text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/spaces/${page.space_id}/pages/${page.id}/history`}>
                  <History className="h-4 w-4 mr-2" /> Page history
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LabelPicker
                  spaceId={page.space_id}
                  availableLabels={labels}
                  selectedLabelIds={pageLabels}
                  onChange={handleLabelChange}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!deleteConfirm ? (
                <DropdownMenuItem onClick={() => setDeleteConfirm(true)} className="text-red-600 focus:text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete page
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleDelete} className="text-red-600 font-semibold focus:text-red-600">
                  Confirm delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-8 md:px-16 py-8">

        {/* Emoji + Title */}
        <div className="mb-1">
          <EmojiPicker value={emoji} onChange={handleEmojiChange} size="lg" />
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full text-[2rem] md:text-[2.5rem] font-bold mt-2 mb-4 bg-transparent border-none outline-none placeholder:text-[#97A0AF] dark:placeholder:text-slate-600 text-[#172B4D] dark:text-white leading-tight resize-none"
        />

        {/* Author line — like Confluence "By Bhagya" */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#F4F5F7] dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-[10px] bg-purple-500 text-white font-semibold">
                {getInitials(authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-[#172B4D] dark:text-slate-300">
              <span className="text-[#6B778C] dark:text-slate-400">By </span>
              <span className="font-medium">{authorName}</span>
            </span>
          </div>

          {/* Labels inline */}
          {pageLabels.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {pageLabels.map((lid) => {
                const label = labels.find((l) => l.id === lid);
                if (!label) return null;
                return (
                  <span
                    key={lid}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="min-h-[400px]">
          <Editor content={content} onChange={setContent} />
        </div>

        {/* Comments */}
        <div className="mt-16 border-t border-[#F4F5F7] dark:border-slate-700 pt-8">
          <CommentSection pageId={page.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
