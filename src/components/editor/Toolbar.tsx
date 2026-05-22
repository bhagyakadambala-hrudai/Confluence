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
  Type, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolbarProps {
  editor: Editor;
}

function ToolbarBtn({ onClick, active, disabled, tooltip, children, className }: {
  onClick: () => void; active?: boolean; disabled?: boolean; tooltip: string;
  children: React.ReactNode; className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-7 w-7 flex items-center justify-center rounded text-sm transition-colors",
            active
              ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/40 dark:text-blue-300"
              : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700",
            disabled && "opacity-30 cursor-not-allowed",
            className
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

const HEADING_OPTIONS = [
  { label: "Normal text", value: 0, className: "text-sm" },
  { label: "Heading 1", value: 1, className: "text-xl font-bold" },
  { label: "Heading 2", value: 2, className: "text-lg font-bold" },
  { label: "Heading 3", value: 3, className: "text-base font-bold" },
];

export default function Toolbar({ editor }: ToolbarProps) {
  function setLink() {
    const url = window.prompt("URL:", editor.getAttributes("link").href);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const currentHeading = HEADING_OPTIONS.find((h) =>
    h.value === 0
      ? !editor.isActive("heading")
      : editor.isActive("heading", { level: h.value })
  ) ?? HEADING_OPTIONS[0];

  return (
    <TooltipProvider delayDuration={400}>
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b bg-white dark:bg-slate-900 border-[#DFE1E6] dark:border-slate-700 shadow-sm">

        {/* Mode selector */}
        <div className="flex items-center gap-1 mr-2">
          <button className="flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium text-[#172B4D] dark:text-slate-200 bg-[#EBECF0] dark:bg-slate-700 hover:bg-[#DFE1E6] dark:hover:bg-slate-600 transition-colors">
            <Type className="h-3.5 w-3.5" />
            Write
          </button>
        </div>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Heading dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors min-w-[110px]">
              <Hash className="h-3.5 w-3.5 text-[#6B778C] dark:text-slate-400" />
              <span className="flex-1 text-left">{currentHeading.label}</span>
              <ChevronDown className="h-3 w-3 text-[#6B778C]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {HEADING_OPTIONS.map((h) => (
              <DropdownMenuItem
                key={h.value}
                className={h.className}
                onClick={() => {
                  if (h.value === 0) {
                    editor.chain().focus().setParagraph().run();
                  } else {
                    editor.chain().focus().toggleHeading({ level: h.value as 1 | 2 | 3 }).run();
                  }
                }}
              >
                {h.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Text formatting */}
        <ToolbarBtn tooltip="Bold (⌘B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Underline (⌘U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Italic (⌘I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarBtn>

        {/* More text dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 flex items-center justify-center px-1 rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleStrike().run()}>
              <Strikethrough className="h-4 w-4 mr-2" /> Strikethrough
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleCode().run()}>
              <span className="font-mono text-xs mr-2 px-1 bg-muted rounded">{ }</span> Inline Code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Lists */}
        <ToolbarBtn tooltip="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarBtn>
        {/* List type dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 flex items-center justify-center px-0.5 rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>
              <CheckSquare className="h-4 w-4 mr-2" /> Task list
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Align */}
        <ToolbarBtn tooltip="Align left" onClick={() => {}}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Align center" onClick={() => {}}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-7 flex items-center justify-center px-0.5 rounded text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 transition-colors">
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {}}>
              <AlignRight className="h-4 w-4 mr-2" /> Align right
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Special inserts */}
        <ToolbarBtn tooltip="Task / checkbox" active={editor.isActive("taskList")} onClick={() => editor.chain().focus().toggleTaskList().run()}>
          <CheckSquare className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ImageUpload editor={editor} />
        <ToolbarBtn tooltip="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code2 className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          <Table className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* More (+) */}
        <ToolbarBtn tooltip="Link" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarBtn>

        <div className="h-5 w-px bg-[#DFE1E6] dark:bg-slate-600 mx-1" />

        {/* Undo/Redo */}
        <ToolbarBtn tooltip="Undo (⌘Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="h-3.5 w-3.5" />
        </ToolbarBtn>
        <ToolbarBtn tooltip="Redo (⌘⇧Z)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="h-3.5 w-3.5" />
        </ToolbarBtn>
      </div>
    </TooltipProvider>
  );
}
