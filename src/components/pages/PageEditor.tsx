"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor as EditorType } from "@tiptap/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Toolbar from "@/components/editor/Toolbar";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import {
  Trash2, Loader2, MoreHorizontal, Link as LinkIcon,
  Lock, Table2, Info, List, ChevronRight,
  FileText, ChevronDown,
  Eye, Search, Move, X, ArrowRight,
} from "lucide-react";
import ShareModal from "@/components/pages/ShareModal";
import PublishModal from "@/components/pages/PublishModal";
import MovePageModal from "@/components/pages/MovePageModal";
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

/* ── Template preview HTML ── */
const TEMPLATE_PREVIEWS: Record<string, string> = {
  "Project plan": `<h1>Project plan</h1><h2>Goals</h2><p>Define the objectives and success criteria for this project.</p><h2>Timeline</h2><p>Outline key milestones and target dates.</p><h2>Resources</h2><p>List team members, tools, and budget needed.</p><h2>Risks</h2><p>Identify potential blockers and mitigation strategies.</p>`,
  "Meeting notes": `<h1>Meeting notes</h1><h2>Date &amp; attendees</h2><p>Add the meeting date and list who attended.</p><h2>Agenda</h2><ul><li>Topic 1</li><li>Topic 2</li><li>Topic 3</li></ul><h2>Discussion &amp; decisions</h2><p>Summarize what was discussed and any decisions made.</p><h2>Action items</h2><ul><li>[ ] Owner — Task description</li></ul>`,
  "End of week status": `<h1>End of week status</h1><h2>Status</h2><p>🟢 On track</p><h2>Accomplishments</h2><ul><li>Completed X</li><li>Shipped Y</li></ul><h2>Next week</h2><ul><li>Plan to work on Z</li></ul><h2>Blockers</h2><p>No blockers at this time.</p>`,
  "Table": `<table><tbody><tr><th>Column 1</th><th>Column 2</th><th>Column 3</th></tr><tr><td>Row 1</td><td></td><td></td></tr><tr><td>Row 2</td><td></td><td></td></tr></tbody></table>`,
  "Info panel": `<blockquote><p><strong>ℹ️ Note</strong></p><p>Add your important information or callout text here.</p></blockquote>`,
  "Table of contents": `<h1>Document title</h1><h2>Section 1</h2><p>Content for section one goes here.</p><h2>Section 2</h2><p>Content for section two goes here.</p><h2>Section 3</h2><p>Content for section three goes here.</p>`,
};

/* ── Quick-insert bar (shown when editor content is empty) ── */
const TEMPLATES_BAR = [
  { label: "Project plan", icon: <FileText className="h-3.5 w-3.5" />, key: "Project plan" },
  { label: "Meeting notes", icon: <FileText className="h-3.5 w-3.5" />, key: "Meeting notes" },
  { label: "End of week status r...", icon: <FileText className="h-3.5 w-3.5" />, key: "End of week status" },
];

function QuickInsertBar({
  onInsert,
  onHover,
  onLeave,
}: {
  onInsert: (type: string) => void;
  onHover: (html: string) => void;
  onLeave: () => void;
}) {
  return (
    <div
      className="rounded-xl border border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1e2d3d] overflow-hidden select-none"
      onMouseLeave={onLeave}
    >
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-[#F4F5F7] dark:border-slate-700">
        {TEMPLATES_BAR.map((item) => (
          <button
            key={item.label}
            onMouseEnter={() => onHover(TEMPLATE_PREVIEWS[item.key] || "")}
            onMouseDown={(e) => { e.preventDefault(); onInsert("template:" + item.key); }}
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
        {[
          { label: "Table", icon: <Table2 className="h-3.5 w-3.5" />, action: "table", key: "Table" },
          { label: "Info panel", icon: <Info className="h-3.5 w-3.5" />, action: "info", key: "Info panel" },
          { label: "Table of contents", icon: <List className="h-3.5 w-3.5" />, action: "toc", key: "Table of contents" },
        ].map((item) => (
          <button
            key={item.label}
            onMouseEnter={() => onHover(TEMPLATE_PREVIEWS[item.key] || "")}
            onMouseDown={(e) => { e.preventDefault(); onInsert(item.action); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            <span className="text-[#6B778C]">{item.icon}</span>
            {item.label}
          </button>
        ))}
        <button
          onMouseDown={(e) => { e.preventDefault(); onInsert("more"); }}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors ml-auto"
        >
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
  const [editor, setEditor] = useState<EditorType | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const findInputRef = useRef<HTMLInputElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({ title: page.title, content: page.content || "" });

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

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
    saveTimer.current = setTimeout(() => save(title, content), 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [title, content, save]);

  function generateTitle() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `Page ${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function handleOpenPublishModal() {
    if (!title.trim()) {
      const generated = generateTitle();
      setTitle(generated);
    }
    setShowPublishModal(true);
  }

  async function handlePublish() {
    await save(title, content);
    // Mark page as published (not a draft)
    await fetch(`/api/pages/${page.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_draft: false }),
    });
    const resp = await fetch(`/api/pages/${page.id}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (resp.ok) toast.success("Page published!");
    else toast.error("Failed to publish");
  }

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function openFindReplace() {
    setShowFindReplace(true);
    setTimeout(() => findInputRef.current?.focus(), 50);
  }

  useEffect(() => {
    if (!findText || !editor) { setMatchCount(0); return; }
    let count = 0;
    editor.state.doc.descendants((node) => {
      if (node.isText && node.text) {
        const lower = node.text.toLowerCase();
        const target = findText.toLowerCase();
        let idx = 0;
        while ((idx = lower.indexOf(target, idx)) !== -1) { count++; idx += target.length; }
      }
    });
    setMatchCount(count);
  }, [findText, editor, content]);

  function handleReplaceOne() {
    if (!editor || !findText) return;
    const { doc, tr } = editor.state;
    const target = findText.toLowerCase();
    let replaced = false;
    doc.descendants((node, pos) => {
      if (replaced || !node.isText || !node.text) return;
      const lower = node.text.toLowerCase();
      const idx = lower.indexOf(target);
      if (idx !== -1) {
        editor.view.dispatch(
          tr.insertText(replaceText, pos + idx, pos + idx + findText.length)
        );
        replaced = true;
      }
    });
    if (!replaced) toast("No match found");
  }

  function handleReplaceAll() {
    if (!editor || !findText) return;
    const target = findText.toLowerCase();
    let count = 0;
    // Collect all positions first (reverse order to maintain offsets)
    const positions: { from: number; to: number }[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      const lower = node.text.toLowerCase();
      let idx = 0;
      while ((idx = lower.indexOf(target, idx)) !== -1) {
        positions.push({ from: pos + idx, to: pos + idx + findText.length });
        idx += target.length;
        count++;
      }
    });
    if (positions.length === 0) { toast("No matches found"); return; }
    // Apply in reverse order so positions stay valid
    let tr = editor.state.tr;
    for (let i = positions.length - 1; i >= 0; i--) {
      tr = tr.insertText(replaceText, positions[i].from, positions[i].to);
    }
    editor.view.dispatch(tr);
    toast.success(`Replaced ${count} occurrence${count !== 1 ? "s" : ""}`);
  }

  function handleQuickInsert(type: string) {
    setPreviewHtml(null);
    if (!editor) return;
    if (type === "table") {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    } else if (type === "info") {
      editor.chain().focus().toggleBlockquote().run();
    } else if (type === "toc") {
      const html = TEMPLATE_PREVIEWS["Table of contents"];
      editor.commands.setContent(html);
      setContent(editor.getHTML());
    } else if (type.startsWith("template:")) {
      const key = type.replace("template:", "");
      const html = TEMPLATE_PREVIEWS[key];
      if (html) {
        editor.commands.setContent(html);
        setContent(editor.getHTML());
      } else {
        toast("Template coming soon");
      }
    } else if (type === "more") {
      toast("More elements coming soon");
    }
  }

  // Preview mode — renders within the layout so the sidebar remains visible
  if (showPreview) {
    return (
      <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-[#E8EAED] dark:border-slate-700 bg-white dark:bg-[#1B2A3B]">
          <nav className="flex items-center gap-1.5 text-sm text-[#6B778C] dark:text-slate-400">
            {space && <span className="text-[#172B4D] dark:text-slate-200 font-medium">{space.emoji} {space.name}</span>}
            {space && <span>/</span>}
            {parentPage && <><span className="truncate max-w-[120px]">{parentPage.title}</span><span>/</span></>}
            <span className="text-[#0052CC] dark:text-blue-400 font-medium truncate max-w-[200px]">{title || "Untitled"}</span>
          </nav>
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-1.5 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors"
          >
            Back
          </button>
        </div>
        <div className="max-w-4xl mx-auto w-full px-8 md:px-16 py-10">
          {content && (
            <div
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-col min-h-full bg-white dark:bg-[#1B2A3B]">

      {/* ── Sticky header: top bar + toolbar ── */}
      <div className="sticky top-0 z-20">

        {/* Row 1: top action bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B] h-12">

          {/* Left: collapse + doc icon + title */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => router.push(`/spaces/${page.space_id}`)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-[#42526E] dark:text-slate-300" />
            </button>
            {/* Doc type icon */}
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#42526E] dark:text-slate-400" fill="none">
              <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate max-w-[200px] ml-1">
              {title || "Untitled"}
            </span>
          </div>

          {/* Right: save + publish + close + share + link + more */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Save status */}
            <span className="text-sm text-[#6B778C] dark:text-slate-400 mr-1">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>
              )}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "unsaved" && "Unsaved changes"}
            </span>

            {/* Author avatar */}
            <Avatar className="h-7 w-7">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-[10px] bg-[#0052CC] text-white font-bold">
                {getInitials(authorName)}
              </AvatarFallback>
            </Avatar>

            {/* Publish — split button */}
            <div className="flex items-center">
              <button
                onClick={handleOpenPublishModal}
                className="flex items-center gap-1 px-3 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-l transition-colors"
              >
                Publish…
              </button>
              <button className="flex items-center px-1.5 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded-r border-l border-white/20 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Close */}
            <button
              onClick={() => router.push(`/spaces/${page.space_id}`)}
              className="px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors border border-[#DFE1E6] dark:border-slate-600"
            >
              Close
            </button>

            {/* Share */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-2.5 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors"
            >
              <Lock className="h-3 w-3" />
              Share
            </button>

            {/* Link icon */}
            <button
              onClick={handleCopyLink}
              className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>

            {/* More ··· */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setShowPreview(true)} className="flex items-center gap-2 cursor-pointer">
                  <Eye className="h-4 w-4" /> Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openFindReplace} className="flex items-center gap-2 cursor-pointer">
                  <Search className="h-4 w-4" /> Find and replace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMoveModal(true)} className="flex items-center gap-2 cursor-pointer">
                  <Move className="h-4 w-4" /> Move
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!deleteConfirm ? (
                  <DropdownMenuItem onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer text-red-600 font-semibold focus:text-red-600">
                    <Trash2 className="h-4 w-4" /> Confirm delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Row 2: Toolbar (shown once editor is ready) */}
        {editor && <Toolbar editor={editor} />}

        {/* Row 3: Find & Replace bar */}
        {showFindReplace && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#DFE1E6] dark:border-slate-700 bg-[#F8F9FA] dark:bg-[#161B22]">
            <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            <input
              ref={findInputRef}
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleReplaceOne(); if (e.key === "Escape") setShowFindReplace(false); }}
              placeholder="Find"
              className="w-36 h-7 px-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 outline-none focus:border-[#0052CC]"
            />
            <ArrowRight className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setShowFindReplace(false); }}
              placeholder="Replace"
              className="w-36 h-7 px-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 outline-none focus:border-[#0052CC]"
            />
            {findText && (
              <span className="text-xs text-[#6B778C] dark:text-slate-400 shrink-0 min-w-[4ch]">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
            )}
            <button
              onClick={handleReplaceOne}
              className="px-3 h-7 text-xs border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 text-[#172B4D] dark:text-slate-200 transition-colors shrink-0"
            >
              Replace
            </button>
            <button
              onClick={handleReplaceAll}
              className="px-3 h-7 text-xs border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 text-[#172B4D] dark:text-slate-200 transition-colors shrink-0"
            >
              Replace all
            </button>
            <button
              onClick={() => { setShowFindReplace(false); setFindText(""); setReplaceText(""); }}
              className="ml-auto h-7 w-7 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 text-[#6B778C] transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Page content ── */}
      <div className="max-w-4xl mx-auto w-full px-8 md:px-16 py-10">

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give this page a title"
          className="w-full text-[2.2rem] md:text-[2.6rem] font-bold bg-transparent border-none outline-none placeholder:text-[#B3BAC5] dark:placeholder:text-slate-600 text-[#172B4D] dark:text-white leading-tight mb-4"
        />

        {/* By [author] */}
        <div className="flex items-center gap-2 mb-6">
          <Avatar className="h-6 w-6">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback className="text-[10px] bg-[#0052CC] text-white font-bold">
              {getInitials(authorName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-[#6B778C] dark:text-slate-400">
            By <span className="text-[#172B4D] dark:text-slate-200 font-medium">{authorName}</span>
          </span>

          {/* Labels */}
          {pageLabels.length > 0 && (
            <div className="flex items-center gap-1.5">
              {pageLabels.map((lid) => {
                const label = labels.find((l) => l.id === lid);
                if (!label) return null;
                return (
                  <span key={lid} className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: label.color }}>
                    {label.name}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor (toolbar managed externally) */}
        <div className="min-h-[200px] relative">
          <Editor
            content={content}
            onChange={setContent}
            showToolbar={false}
            placeholder=""
            onEditorReady={setEditor}
          />
          {/* Template hover preview overlay — shown while hovering a template in the bar below */}
          {previewHtml && (
            <div className="absolute inset-0 bg-white dark:bg-[#1B2A3B] pointer-events-none overflow-auto">
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewHtml) }}
              />
            </div>
          )}
        </div>

        {/* Quick-insert bar — inline card below editor, only when empty */}
        {isEmpty && (
          <div className="mt-10">
            <QuickInsertBar
              onInsert={handleQuickInsert}
              onHover={(html) => setPreviewHtml(html)}
              onLeave={() => setPreviewHtml(null)}
            />
          </div>
        )}

      </div>
    </div>

    {showShareModal && (
      <ShareModal
        pageId={page.id}
        spaceId={page.space_id}
        pageTitle={title || "Untitled"}
        onClose={() => setShowShareModal(false)}
      />
    )}
    {showPublishModal && (
      <PublishModal
        page={{ ...page, title, content }}
        space={space}
        parentPage={parentPage}
        onPublish={handlePublish}
        onClose={() => setShowPublishModal(false)}
        onOpenShare={() => { setShowPublishModal(false); setShowShareModal(true); }}
      />
    )}
    {showMoveModal && (
      <MovePageModal
        pageId={page.id}
        currentSpaceId={page.space_id}
        onClose={() => setShowMoveModal(false)}
      />
    )}
    </>
  );
}
