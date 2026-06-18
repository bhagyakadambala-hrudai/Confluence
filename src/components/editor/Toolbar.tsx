"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { ALargeSmall } from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ImageUpload from "./ImageUpload";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, CheckSquare,
  Code2, Quote, Minus, Link as LinkIcon,
  Undo, Redo, ChevronDown,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  AtSign, Smile, Plus, RemoveFormatting,
  Subscript, Superscript, Table, Indent, Outdent,
  FileCode, Info, Pilcrow, Heading1, Heading2, Heading3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor;
}

function Btn({ onClick, active, disabled, title, children }: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded text-sm transition-colors shrink-0",
            active
              ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/40 dark:text-blue-300"
              : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700",
            disabled && "opacity-30 cursor-not-allowed",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{title}</TooltipContent>
    </Tooltip>
  );
}

function Sep() {
  return <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-0.5 shrink-0" />;
}

/* Keyboard shortcut badge */
function Kbd({ children }: { children: string }) {
  return (
    <span className="ml-auto shrink-0 text-[10px] text-[#6B778C] dark:text-slate-400 bg-[#F4F5F7] dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono leading-none">
      {children}
    </span>
  );
}

const TEXT_STYLES = [
  { label: "Normal text", value: "normal", kbd: "Ctrl+Alt+0", fontSize: null,     icon: <Pilcrow   className="h-4 w-4" />, labelClass: "text-sm" },
  { label: "Heading 1",   value: "h1",     kbd: "Ctrl+Alt+1", fontSize: "2em",    icon: <Heading1  className="h-4 w-4" />, labelClass: "text-xl font-bold" },
  { label: "Heading 2",   value: "h2",     kbd: "Ctrl+Alt+2", fontSize: "1.5em",  icon: <Heading2  className="h-4 w-4" />, labelClass: "text-lg font-semibold" },
  { label: "Heading 3",   value: "h3",     kbd: "Ctrl+Alt+3", fontSize: "1.25em", icon: <Heading3  className="h-4 w-4" />, labelClass: "text-base font-semibold" },
  { label: "Heading 4",   value: "h4",     kbd: "Ctrl+Alt+4", fontSize: "1.1em",  icon: <span className="text-[10px] font-bold leading-none">H₄</span>, labelClass: "text-sm font-semibold" },
  { label: "Heading 5",   value: "h5",     kbd: "Ctrl+Alt+5", fontSize: "1em",    icon: <span className="text-[10px] font-bold leading-none">H₅</span>, labelClass: "text-sm font-medium" },
  { label: "Heading 6",   value: "h6",     kbd: "Ctrl+Alt+6", fontSize: "0.85em", icon: <span className="text-[10px] font-bold leading-none">H₆</span>, labelClass: "text-sm font-medium text-[#6B778C]" },
  { label: "Quote",       value: "quote",  kbd: "Ctrl+Shift+9", fontSize: null,   icon: <Quote className="h-4 w-4" />, labelClass: "text-sm italic" },
];

/* ── Table size grid picker ── */
const GRID_COLS = 8;
const GRID_ROWS = 6;

function TableGridPicker({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [hovered, setHovered] = useState<{ r: number; c: number } | null>(null);

  return (
    <div className="p-2 select-none">
      <p className="text-xs text-[#6B778C] dark:text-slate-400 mb-2 text-center">
        {hovered ? `${hovered.c} × ${hovered.r}` : "Insert table"}
      </p>
      <div
        className="grid gap-0.5"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1.5rem)` }}
      >
        {Array.from({ length: GRID_ROWS }).map((_, r) =>
          Array.from({ length: GRID_COLS }).map((_, c) => {
            const active = hovered && r < hovered.r && c < hovered.c;
            return (
              <button
                key={`${r}-${c}`}
                onMouseEnter={() => setHovered({ r: r + 1, c: c + 1 })}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onPick(r + 1, c + 1)}
                className={cn(
                  "h-5 w-5 rounded-sm border transition-colors",
                  active
                    ? "bg-[#DEEBFF] border-[#0052CC] dark:bg-blue-900/40 dark:border-blue-400"
                    : "border-[#DFE1E6] dark:border-slate-600 hover:border-[#0052CC]",
                )}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

/* ── Emoji picker popup ── */
function EmojiButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        pickerRef.current && !pickerRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(8, rect.left - 120) });
    }
    setOpen((v) => !v);
  }

  function onEmojiClick(data: EmojiClickData) {
    editor.chain().focus().insertContent(data.emoji).run();
    setOpen(false);
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={btnRef}
            type="button"
            onClick={handleOpen}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded transition-colors shrink-0",
              open
                ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/40 dark:text-blue-300"
                : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700",
            )}
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Emoji</TooltipContent>
      </Tooltip>

      {open && (
        <div
          ref={pickerRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
        >
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            autoFocusSearch
            theme={Theme.LIGHT}
            width={320}
            height={400}
          />
        </div>
      )}
    </>
  );
}

/* ── Color picker popup ── */
const TEXT_COLORS = [
  "#000000","#1a1a2e","#006466","#1b4332","#b45309","#7f1d1d","#581c87",
  "#374151","#1d4ed8","#0891b2","#15803d","#d97706","#dc2626","#7c3aed",
  "#f3f4f6","#bfdbfe","#a5f3fc","#bbf7d0","#fef08a","#fecaca","#e9d5ff",
];

const HIGHLIGHT_COLORS = [
  { bg: "#fef9c3", label: "Yellow" },
  { bg: "#fed7aa", label: "Orange" },
  { bg: "#fecaca", label: "Red" },
  { bg: "#bbf7d0", label: "Green" },
  { bg: "#bfdbfe", label: "Blue" },
  { bg: "#e9d5ff", label: "Purple" },
  { bg: "#f3f4f6", label: "Gray" },
];

function ColorPickerButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: Math.max(8, rect.left - 10) });
    }
    setOpen((v) => !v);
  }

  const currentColor = editor.getAttributes("textStyle").color ?? "#000000";

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={btnRef}
            type="button"
            onClick={handleOpen}
            className={cn(
              "h-7 w-7 flex flex-col items-center justify-center gap-0.5 rounded transition-colors shrink-0",
              open
                ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/40"
                : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700",
            )}
          >
            <span className="text-[11px] font-bold leading-none" style={{ color: currentColor === "#000000" ? undefined : currentColor }}>A</span>
            <span className="h-1 w-4 rounded-sm" style={{ backgroundColor: currentColor }} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">Text color</TooltipContent>
      </Tooltip>

      {open && (
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-slate-600 rounded-lg shadow-xl p-3 w-[220px]"
        >
          {/* Text colors */}
          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-2">Text color</p>
          <div className="grid grid-cols-7 gap-1 mb-3">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                title={color}
                onClick={() => { editor.chain().focus().setColor(color).run(); setOpen(false); }}
                className={cn(
                  "h-7 w-7 rounded border-2 transition-all",
                  currentColor === color
                    ? "border-[#0052CC] scale-110"
                    : "border-transparent hover:border-[#0052CC]/40",
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Highlight colors */}
          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-2">Highlight color</p>
          <div className="flex gap-1 mb-3">
            {HIGHLIGHT_COLORS.map(({ bg, label }) => (
              <button
                key={bg}
                title={label}
                onClick={() => { (editor as any).chain().focus().setHighlight({ color: bg }).run(); setOpen(false); }}
                className="h-7 w-7 rounded border-2 border-transparent hover:border-[#0052CC]/40 transition-all flex items-center justify-center text-xs font-bold text-[#172B4D]"
                style={{ backgroundColor: bg }}
              >
                A
              </button>
            ))}
          </div>

          {/* Remove color */}
          <button
            onClick={() => { editor.chain().focus().unsetColor().run(); (editor as any).chain().focus().unsetHighlight().run(); setOpen(false); }}
            className="w-full py-1.5 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            Remove color
          </button>
        </div>
      )}
    </>
  );
}

export default function Toolbar({ editor }: ToolbarProps) {
  function setLink() {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL:", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }

  const activeFontSize: string | null =
    editor.getAttributes("textStyle").fontSize ?? null;
  const currentStyle =
    TEXT_STYLES.find((s) => {
      if (s.value === "quote") return editor.isActive("blockquote");
      if (s.value === "normal") return !activeFontSize && !editor.isActive("blockquote");
      return s.fontSize !== null && activeFontSize === s.fontSize;
    }) ?? TEXT_STYLES[0];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0 px-2 py-1 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B] overflow-x-auto">

        {/* Improve formatting (AI — UI only) */}
        <button
          type="button"
          disabled
          className="flex items-center gap-1.5 px-2 h-7 rounded text-xs text-[#B3BAC5] dark:text-slate-600 cursor-not-allowed shrink-0 mr-1"
        >
          <ALargeSmall className="h-3.5 w-3.5" />
          Improve formatting
        </button>
        <Sep />

        {/* Text style dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 px-2 h-7 rounded text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0 min-w-[120px]">
              <span className="font-serif text-sm leading-none mr-0.5 text-[#42526E]">Tt</span>
              <span className="flex-1 text-left text-[#172B4D] dark:text-slate-200 text-sm">
                {currentStyle.label}
              </span>
              <ChevronDown className="h-3 w-3 text-[#6B778C] shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {TEXT_STYLES.map((s) => {
              const isActive = s.value === "quote"
                ? editor.isActive("blockquote")
                : s.value === "normal"
                  ? !activeFontSize && !editor.isActive("blockquote")
                  : s.fontSize !== null && activeFontSize === s.fontSize;
              return (
                <DropdownMenuItem
                  key={s.value}
                  className={cn("flex items-center gap-2", isActive && "bg-[#DEEBFF] dark:bg-blue-900/20")}
                  onClick={() => {
                    if (s.value === "quote") {
                      editor.chain().focus().toggleBlockquote().run();
                    } else if (s.value === "normal") {
                      editor.chain().focus().unsetFontSize().run();
                    } else if (s.fontSize) {
                      editor.chain().focus().setFontSize(s.fontSize).run();
                    }
                  }}
                >
                  <span className="text-[#6B778C] w-4 flex items-center justify-center shrink-0">{s.icon}</span>
                  <span className={cn("flex-1", s.labelClass)}>{s.label}</span>
                  <Kbd>{s.kbd}</Kbd>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              className="flex items-center gap-2"
            >
              <RemoveFormatting className="h-4 w-4 text-[#6B778C]" />
              <span className="flex-1">Clear formatting</span>
              <Kbd>Ctrl+\</Kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Bold / Underline / Italic + full formatting dropdown */}
        <Btn title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={cn("flex items-center gap-2", editor.isActive("bold") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <Bold className="h-4 w-4" /> <span className="flex-1">Bold</span> <Kbd>Ctrl+B</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={cn("flex items-center gap-2", editor.isActive("italic") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <Italic className="h-4 w-4" /> <span className="flex-1">Italic</span> <Kbd>Ctrl+I</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={cn("flex items-center gap-2", editor.isActive("underline") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <Underline className="h-4 w-4" /> <span className="flex-1">Underline</span> <Kbd>Ctrl+U</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={cn("flex items-center gap-2", editor.isActive("strike") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <Strikethrough className="h-4 w-4" /> <span className="flex-1">Strikethrough</span> <Kbd>Ctrl+Shift+S</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={cn("flex items-center gap-2", editor.isActive("code") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <Code2 className="h-4 w-4" /> <span className="flex-1">Code</span> <Kbd>Ctrl+Shift+M</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (editor as any).chain().focus().toggleSubscript?.().run()}
              className="flex items-center gap-2"
            >
              <Subscript className="h-4 w-4" /> <span className="flex-1">Subscript</span> <Kbd>Ctrl+Shift+,</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (editor as any).chain().focus().toggleSuperscript?.().run()}
              className="flex items-center gap-2"
            >
              <Superscript className="h-4 w-4" /> <span className="flex-1">Superscript</span> <Kbd>Ctrl+Shift+.</Kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              className="flex items-center gap-2 text-[#6B778C]"
            >
              <RemoveFormatting className="h-4 w-4" /> <span className="flex-1">Clear formatting</span> <Kbd>Ctrl+\</Kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Lists + dropdown with shortcuts */}
        <Btn title="Bullet list (Ctrl+Shift+8)" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Numbered list (Ctrl+Shift+7)" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={cn("flex items-center gap-2", editor.isActive("bulletList") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <List className="h-4 w-4" /> <span className="flex-1">Bulleted list</span> <Kbd>Ctrl+Shift+8</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={cn("flex items-center gap-2", editor.isActive("orderedList") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <ListOrdered className="h-4 w-4" /> <span className="flex-1">Numbered list</span> <Kbd>Ctrl+Shift+7</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={cn("flex items-center gap-2", editor.isActive("taskList") && "bg-[#DEEBFF] dark:bg-blue-900/20")}
            >
              <CheckSquare className="h-4 w-4" /> <span className="flex-1">Task list</span> <Kbd>Ctrl+Shift+6</Kbd>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().liftListItem("listItem").run()}
              className="flex items-center gap-2 text-[#6B778C]"
            >
              <Outdent className="h-4 w-4" /> <span className="flex-1">Outdent</span> <Kbd>Shift+Tab</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
              className="flex items-center gap-2"
            >
              <Indent className="h-4 w-4" /> <span className="flex-1">Indent</span> <Kbd>Tab</Kbd>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Alignment */}
        <Btn title="Align left" onClick={() => {}}>
          <AlignLeft className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignLeft className="h-4 w-4" /> <span className="flex-1">Left</span> <Kbd>Ctrl+Shift+L</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignCenter className="h-4 w-4" /> <span className="flex-1">Center</span> <Kbd>Ctrl+Shift+E</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignRight className="h-4 w-4" /> <span className="flex-1">Right</span> <Kbd>Ctrl+Shift+R</Kbd>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignJustify className="h-4 w-4" /> <span className="flex-1">Justify</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Text / highlight color */}
        <ColorPickerButton editor={editor} />

        <Sep />

        {/* Checkbox / Image / @ / Emoji */}
        <Btn title="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare className="h-3.5 w-3.5" />
        </Btn>
        <ImageUpload editor={editor} />
        <Btn title="Mention (@)" onClick={() => editor.chain().focus().insertContent("@").run()}>
          <AtSign className="h-3.5 w-3.5" />
        </Btn>

        {/* Full emoji picker */}
        <EmojiButton editor={editor} />

        <Sep />

        {/* Table — grid picker */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 px-1.5 flex items-center gap-0.5 rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <Table className="h-3.5 w-3.5" />
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="p-0">
            <TableGridPicker
              onPick={(rows, cols) =>
                editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plus — more inserts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-7 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()} className="flex items-center gap-2">
              <FileCode className="h-4 w-4" /> Code snippet
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()} className="flex items-center gap-2">
              <Info className="h-4 w-4" /> Info panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()} className="flex items-center gap-2">
              <Quote className="h-4 w-4" /> Quote
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()} className="flex items-center gap-2">
              <Minus className="h-4 w-4" /> Divider
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()} className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Action items
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Link */}
        <Btn title="Link (Ctrl+K)" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Undo / Redo */}
        <Btn title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Redo (Ctrl+Shift+Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </TooltipProvider>
  );
}
