"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CommentSection from "@/components/comments/CommentSection";
import LabelPicker from "./LabelPicker";
import { toast } from "sonner";
import {
  Trash2, Loader2, Share2, MoreHorizontal, Link as LinkIcon,
  Lock, Smile, Table2, Info, List, ChevronRight, FileText, History,
} from "lucide-react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

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

/* ── Live Doc icon ── */
function LiveDocIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className ?? "h-8 w-8"} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="2" width="17" height="22" rx="2.5" stroke="#42526E" strokeWidth="1.8" />
      <line x1="7" y1="8" x2="16" y2="8" stroke="#42526E" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="12" x2="16" y2="12" stroke="#42526E" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="16" x2="12" y2="16" stroke="#42526E" strokeWidth="1.6" strokeLinecap="round" />
      <polygon points="18,18 26,22 18,26" fill="#42526E" opacity="0.85" />
    </svg>
  );
}

/* ── Quick-insert floating bar (shown when editor is empty) ── */
const TEMPLATE_QUICKPICKS = [
  { label: "1-on-1 Meeting", icon: <FileText className="h-3.5 w-3.5" /> },
  { label: "4 Ls Retrospective", icon: <FileText className="h-3.5 w-3.5" /> },
  { label: "5 Whys Analysis", icon: <FileText className="h-3.5 w-3.5" /> },
];
const ELEMENT_QUICKPICKS = [
  { label: "Table", icon: <Table2 className="h-3.5 w-3.5" /> },
  { label: "Info panel", icon: <Info className="h-3.5 w-3.5" /> },
  { label: "Table of contents", icon: <List className="h-3.5 w-3.5" /> },
];

function QuickInsertBar() {
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1e2d3d] shadow-md overflow-hidden">
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-[#F4F5F7] dark:border-slate-700">
        {TEMPLATE_QUICKPICKS.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-[#6B778C]">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <Link
          href="/templates"
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors ml-auto"
        >
          All templates <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5">
        {ELEMENT_QUICKPICKS.map((item) => (
          <button
            key={item.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-[#6B778C]">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors ml-auto">
          More elements <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function PageEditor({ page, space, parentPage, labels, currentUserId }: PageEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content || "");
  const [pageLabels, setPageLabels] = useState<string[]>(page.labels || []);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({ title: page.title, content: page.content || "" });

  const authorName = page.profiles?.full_name || "Unknown";
  const authorAvatar = page.profiles?.avatar_url;
  const isEmpty = !content || content === "<p></p>" || content.replace(/<[^>]*>/g, "").trim() === "";

  const save = useCallback(async (t: string, c: string) => {
    setSaveStatus("saving");
    const resp = await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, content: c }),
    });
    if (resp.ok) {
      lastSaved.current = { title: t, content: c };
      setSaveStatus("saved");
    } else {
      setSaveStatus("unsaved");
      toast.error("Failed to save");
    }
  }, [page.id]);

  useEffect(() => {
    const changed = title !== lastSaved.current.title || content !== lastSaved.current.content;
    if (!changed) return;
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(title, content), 3000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, save]);

  async function handleDelete() {
    const resp = await fetch(`/api/pages/${page.id}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Page deleted");
      router.push(`/spaces/${page.space_id}`);
    } else {
      toast.error("Failed to delete");
    }
  }

  async function handleLabelChange(labelIds: string[]) {
    setPageLabels(labelIds);
    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ labels: labelIds }),
    });
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B]">

      {/* ── Top action bar ── */}
      <div className="flex items-center justify-end px-5 py-2 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B] sticky top-0 z-10 gap-1.5">

        {/* Save status */}
        <div className="flex items-center gap-1 text-sm text-[#6B778C] dark:text-slate-400 mr-2 min-w-[60px] justify-end">
          {saveStatus === "saving" && (
            <><Loader2 className="h-3 w-3 animate-spin" /><span>Saving</span></>
          )}
          {saveStatus === "saved" && <span>Saved</span>}
          {saveStatus === "unsaved" && <span>Unsaved</span>}
        </div>

        {/* Author avatar(s) */}
        <Avatar className="h-7 w-7 border-2 border-white dark:border-[#1B2A3B]">
          <AvatarImage src={authorAvatar} />
          <AvatarFallback className="text-[10px] bg-[#0052CC] text-white font-bold">
            {getInitials(authorName)}
          </AvatarFallback>
        </Avatar>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors ml-1"
        >
          <Lock className="h-3 w-3" />
          Share
        </button>

        {/* Link */}
        <button
          onClick={handleShare}
          className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </button>

        {/* More */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={`/spaces/${page.space_id}/pages/${page.id}/history`} className="flex items-center gap-2">
                <History className="h-4 w-4" /> Page history
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

      {/* ── Page content ── */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-8 md:px-16 py-10">

        {/* Doc icon + Title */}
        <div className="flex items-start gap-3 mb-5">
          <div className="mt-2.5 shrink-0">
            <LiveDocIcon className="h-7 w-7" />
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give this page a title"
            className="flex-1 text-[2rem] md:text-[2.4rem] font-bold bg-transparent border-none outline-none placeholder:text-[#B3BAC5] dark:placeholder:text-slate-600 text-[#172B4D] dark:text-white leading-tight"
          />
        </div>

        {/* Author + reaction + labels */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-[10px] bg-[#0052CC] text-white font-bold">
                {getInitials(authorName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-[#172B4D] dark:text-slate-300">
              <span className="text-[#6B778C] dark:text-slate-400">By </span>
              <span className="font-medium">{authorName}</span>
            </span>
          </div>

          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#DFE1E6] dark:border-slate-600 text-xs text-[#6B778C] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
            <Smile className="h-3.5 w-3.5" />
            Add a reaction
          </button>

          {pageLabels.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {pageLabels.map((lid) => {
                const label = labels.find((l) => l.id === lid);
                if (!label) return null;
                return (
                  <span key={lid} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: label.color }}>
                    {label.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="min-h-[200px]">
          <Editor
            content={content}
            onChange={setContent}
            placeholder="Press / to insert elements"
          />
        </div>

        {/* Quick-insert bar when empty */}
        {isEmpty && <QuickInsertBar />}

        {/* Comments */}
        <div className="mt-16 border-t border-[#F4F5F7] dark:border-slate-700 pt-8">
          <CommentSection pageId={page.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
