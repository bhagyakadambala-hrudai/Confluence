"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Separator } from "@/components/ui/separator";
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

const TEXT_STYLES = [
  { label: "Normal text", value: 0, icon: <Pilcrow className="h-4 w-4" />, className: "text-sm" },
  { label: "Heading 1",   value: 1, icon: <Heading1 className="h-4 w-4" />, className: "text-xl font-bold" },
  { label: "Heading 2",   value: 2, icon: <Heading2 className="h-4 w-4" />, className: "text-lg font-semibold" },
  { label: "Heading 3",   value: 3, icon: <Heading3 className="h-4 w-4" />, className: "text-base font-semibold" },
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

  const currentStyle = TEXT_STYLES.find((s) =>
    s.value === 0 ? !editor.isActive("heading") : editor.isActive("heading", { level: s.value })
  ) ?? TEXT_STYLES[0];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0 px-2 py-1 border-b border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B] overflow-x-auto">

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
          <DropdownMenuContent align="start" className="w-48">
            {TEXT_STYLES.map((s) => (
              <DropdownMenuItem
                key={s.value}
                className="flex items-center gap-2"
                onClick={() => {
                  if (s.value === 0) editor.chain().focus().setParagraph().run();
                  else editor.chain().focus().toggleHeading({ level: s.value as 1|2|3 }).run();
                }}
              >
                <span className="text-[#6B778C]">{s.icon}</span>
                <span className={s.className}>{s.label}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              className="flex items-center gap-2 text-[#6B778C]"
            >
              <RemoveFormatting className="h-4 w-4" />
              Clear formatting
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Bold / Underline / Italic + dropdown */}
        <Btn title="Bold (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Underline (⌘U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Italic (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()} className="flex items-center gap-2">
              <Strikethrough className="h-4 w-4" /> Strikethrough
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()} className="flex items-center gap-2">
              <Code2 className="h-4 w-4" /> Inline code
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (editor as any).chain().focus().toggleSubscript?.().run()}
              className="flex items-center gap-2"
            >
              <Subscript className="h-4 w-4" /> Subscript
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => (editor as any).chain().focus().toggleSuperscript?.().run()}
              className="flex items-center gap-2"
            >
              <Superscript className="h-4 w-4" /> Superscript
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Lists + dropdown */}
        <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()} className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" /> Task list
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().liftListItem("listItem").run()}
              className="flex items-center gap-2"
            >
              <Outdent className="h-4 w-4" /> Outdent <span className="ml-auto text-xs text-[#6B778C]">⇧Tab</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
              className="flex items-center gap-2"
            >
              <Indent className="h-4 w-4" /> Indent <span className="ml-auto text-xs text-[#6B778C]">Tab</span>
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
              <AlignLeft className="h-4 w-4" /> Left <span className="ml-auto text-xs text-[#6B778C]">⌘⇧L</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignCenter className="h-4 w-4" /> Center <span className="ml-auto text-xs text-[#6B778C]">⌘⇧E</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignRight className="h-4 w-4" /> Right <span className="ml-auto text-xs text-[#6B778C]">⌘⇧R</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className="flex items-center gap-2">
              <AlignJustify className="h-4 w-4" /> Justify
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Checkbox / Image / @ / Emoji */}
        <Btn title="Task list" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare className="h-3.5 w-3.5" />
        </Btn>
        <ImageUpload editor={editor} />
        <Btn title="Mention (@)" onClick={() => editor.chain().focus().insertContent("@").run()}>
          <AtSign className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Emoji" onClick={() => editor.chain().focus().insertContent("😊").run()}>
          <Smile className="h-3.5 w-3.5" />
        </Btn>

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
        <Btn title="Link (⌘K)" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </Btn>

        <Sep />

        {/* Undo / Redo */}
        <Btn title="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Redo (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </Btn>
      </div>
    </TooltipProvider>
  );
}
