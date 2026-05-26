"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageUpload from "./ImageUpload";
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, CheckSquare,
  Code2, Quote, Minus, Link as LinkIcon,
  Table, Undo, Redo, ChevronDown,
  AlignLeft, AlignCenter, AlignRight,
  AtSign, Smile, Columns, Plus,
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
  { label: "Normal text", value: 0, className: "text-sm" },
  { label: "Heading 1",   value: 1, className: "text-xl font-bold" },
  { label: "Heading 2",   value: 2, className: "text-lg font-semibold" },
  { label: "Heading 3",   value: 3, className: "text-base font-semibold" },
];

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
              {/* Tt icon */}
              <span className="font-serif text-sm leading-none mr-0.5 text-[#42526E]">Tt</span>
              <span className="flex-1 text-left text-[#172B4D] dark:text-slate-200 text-sm">
                {currentStyle.label}
              </span>
              <ChevronDown className="h-3 w-3 text-[#6B778C] shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {TEXT_STYLES.map((s) => (
              <DropdownMenuItem
                key={s.value}
                className={s.className}
                onClick={() => {
                  if (s.value === 0) editor.chain().focus().setParagraph().run();
                  else editor.chain().focus().toggleHeading({ level: s.value as 1|2|3 }).run();
                }}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Bold / Underline / Italic */}
        <Btn title="Bold (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Underline (⌘U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-3.5 w-3.5" />
        </Btn>
        <Btn title="Italic (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Btn>
        {/* More text formatting */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4 mr-2" /> Strikethrough
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
              <Code2 className="h-4 w-4 mr-2" /> Inline code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Lists */}
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
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare className="h-4 w-4 mr-2" /> Task list
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
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => {}}><AlignCenter className="h-4 w-4 mr-2" /> Center</DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}}><AlignRight className="h-4 w-4 mr-2" /> Right</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Sep />

        {/* Checkbox / Image / @ / Emoji */}
        <Btn title="Task list (checkbox)" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
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

        {/* Table / More inserts */}
        <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table className="h-3.5 w-3.5" />
        </Btn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-5 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <ChevronDown className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 className="h-4 w-4 mr-2" /> Code block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4 mr-2" /> Blockquote / Info panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().setHorizontalRule().run()}>
              <Minus className="h-4 w-4 mr-2" /> Divider
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Plus — more inserts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 w-7 flex items-center justify-center rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors shrink-0">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
              <Table className="h-4 w-4 mr-2" /> Table
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare className="h-4 w-4 mr-2" /> Action items
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 className="h-4 w-4 mr-2" /> Code block
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
