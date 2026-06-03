"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Editor as EditorType } from "@tiptap/react";
import Toolbar from "@/components/editor/Toolbar";
import { toast } from "sonner";
import {
  ChevronDown, Loader2, Lock, Link as LinkIcon,
  MoreHorizontal, Smile, Sparkles, ALargeSmall,
  ArrowLeftRight, AlignJustify,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Editor = dynamic(() => import("@/components/editor/Editor"), { ssr: false });

interface Space {
  id: string; name: string; emoji: string; description: string | null;
}

type SaveStatus = "saved" | "saving" | "unsaved";

export default function SpaceEditorClient({ space, currentUserId }: { space: Space; currentUserId: string }) {
  const router = useRouter();
  const [name, setName] = useState(space.name);
  const [content, setContent] = useState(space.description || "");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [editor, setEditor] = useState<EditorType | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef({ name: space.name, content: space.description || "" });

  const save = useCallback(async (n: string, c: string) => {
    setSaveStatus("saving");
    const resp = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n, description: c }),
    });
    if (resp.ok) {
      lastSaved.current = { name: n, content: c };
      setSaveStatus("saved");
    } else {
      setSaveStatus("unsaved");
      toast.error("Failed to save");
    }
  }, [space.id]);

  useEffect(() => {
    const changed = name !== lastSaved.current.name || content !== lastSaved.current.content;
    if (!changed) return;
    setSaveStatus("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(name, content), 2000);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [name, content, save]);

  async function handleUpdate() {
    await save(name, content);
    toast.success("Space updated");
    router.push(`/spaces/${space.id}`);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/spaces/${space.id}`);
    toast.success("Link copied");
  }

  const isEmpty = !content || content === "<p></p>" || content.replace(/<[^>]*>/g, "").trim() === "";

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-[#161B22]">

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#161B22] h-12">
          {/* Left */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => router.push(`/spaces/${space.id}`)}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <ChevronDown className="h-4 w-4 text-[#42526E] dark:text-slate-300" />
            </button>
            <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0 text-[#42526E] dark:text-slate-400" fill="none">
              <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <line x1="4.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="4.5" y1="7.5" x2="9.5" y2="7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="4.5" y1="10" x2="7.5" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate max-w-[200px] ml-0.5">
              {name || space.name}
            </span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm text-[#6B778C] dark:text-slate-400 mr-1">
              {saveStatus === "saving" && (
                <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" />Saving</span>
              )}
              {saveStatus === "saved" && "Saved"}
              {saveStatus === "unsaved" && "Unsaved changes"}
            </span>

            {/* Update button with dropdown */}
            <div className="flex items-center">
              <button
                onClick={handleUpdate}
                className="flex items-center gap-1 px-3 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-l transition-colors"
              >
                Update
              </button>
              <button className="flex items-center px-1.5 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded-r border-l border-white/20 transition-colors">
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <button
              onClick={() => router.push(`/spaces/${space.id}`)}
              className="px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors border border-[#DFE1E6] dark:border-slate-600"
            >
              Close
            </button>

            <button className="flex items-center gap-1.5 px-2.5 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors">
              <Lock className="h-3 w-3" /> Share
            </button>

            <button
              onClick={copyLink}
              className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors"
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push(`/spaces/${space.id}`)}>
                  Cancel editing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Formatting toolbar */}
        {editor && <Toolbar editor={editor} />}
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Banner */}
        <div className="relative shrink-0">
          <div className="h-44 w-full bg-gradient-to-r from-[#00B8D9] via-[#0052CC] to-[#1A237E]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
            <div className="h-20 w-20 rounded-2xl bg-[#0052CC] flex items-center justify-center shadow-xl border-4 border-white dark:border-[#161B22]">
              {space.emoji ? (
                <span className="text-4xl">{space.emoji}</span>
              ) : (
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                  <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Editor area */}
        <div className="max-w-4xl mx-auto w-full px-8 md:px-16 pt-16 pb-16">

          {/* Meta action bar */}
          <div className="flex items-center gap-0.5 mb-5 -ml-1">
            <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-[#6B778C] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              <AlignJustify className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="w-px h-4 bg-[#DFE1E6] dark:bg-slate-600 mx-1" />
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              <Smile className="h-3.5 w-3.5" />
              <span>Emoji</span>
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Suggest title</span>
            </button>
            <div className="w-px h-4 bg-[#DFE1E6] dark:bg-slate-600 mx-1" />
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              <ALargeSmall className="h-3.5 w-3.5" />
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Space name (editable title) */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Space name"
            className="w-full text-[2.2rem] md:text-[2.6rem] font-bold bg-transparent border-none outline-none placeholder:text-[#B3BAC5] dark:placeholder:text-slate-600 text-[#172B4D] dark:text-white leading-tight mb-6"
          />

          {/* Empty state hint */}
          {isEmpty && (
            <p className="text-[#97A0AF] dark:text-slate-500 text-sm mb-2 pointer-events-none select-none">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-[#F4F5F7] dark:bg-slate-700 border border-[#DFE1E6] dark:border-slate-600 rounded text-xs font-mono text-[#42526E]">space</kbd>
              {" "}or{" "}
              <kbd className="px-1.5 py-0.5 bg-[#F4F5F7] dark:bg-slate-700 border border-[#DFE1E6] dark:border-slate-600 rounded text-xs font-mono text-[#42526E]">/</kbd>
              {" "}to add content
            </p>
          )}

          {/* Rich text editor */}
          <div className="min-h-[300px]">
            <Editor
              content={content}
              onChange={setContent}
              showToolbar={false}
              placeholder=""
              onEditorReady={setEditor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
