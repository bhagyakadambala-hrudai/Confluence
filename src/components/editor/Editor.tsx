"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor as EditorType } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Placeholder from "@tiptap/extension-placeholder";
import { common, createLowlight } from "lowlight";
import Toolbar from "./Toolbar";
import { useEffect } from "react";

const lowlight = createLowlight(common);

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  showToolbar?: boolean;
  onEditorReady?: (editor: EditorType) => void;
}

export default function Editor({
  content,
  onChange,
  editable = true,
  placeholder = "Start writing… (type / for commands)",
  showToolbar = true,
  onEditorReady,
}: EditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      CodeBlockLowlight.configure({ lowlight }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content]);

  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor);
  }, [editor]);

  return (
    <div className="flex flex-col min-h-full">
      {showToolbar && editable && editor && <Toolbar editor={editor} />}
      <div className="flex-1">
        <EditorContent
          editor={editor}
          className="prose prose-slate dark:prose-invert max-w-none min-h-[300px] focus:outline-none"
        />
      </div>
    </div>
  );
}
