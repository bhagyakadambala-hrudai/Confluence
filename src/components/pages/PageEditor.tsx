"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Breadcrumb from "./Breadcrumb";
import CommentSection from "@/components/comments/CommentSection";
import LabelPicker from "./LabelPicker";
import EmojiPicker from "@/components/common/EmojiPicker";
import { toast } from "sonner";
import {
  History, Trash2, ChevronDown, Loader2, Check,
} from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Editor = dynamic(() => import("@/components/editor/Editor"), { ssr: false });

interface PageEditorProps {
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
    const changed =
      title !== lastSaved.current.title ||
      content !== lastSaved.current.content ||
      emoji !== lastSaved.current.emoji;

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
    <div className="flex flex-col min-h-full">
      <div className="flex items-center justify-between px-8 py-3 border-b bg-background sticky top-0 z-10">
        <Breadcrumb space={space} parentPage={parentPage} currentPage={{ title, emoji }} spaceId={page.space_id} />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span>Saved</span>
              </>
            )}
            {saveStatus === "unsaved" && <span>Unsaved changes</span>}
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => save(title, content, emoji, true)}
          >
            Publish
          </Button>

          <Link href={`/spaces/${page.space_id}/pages/${page.id}/history`}>
            <Button size="sm" variant="ghost">
              <History className="h-4 w-4 mr-1.5" />
              History
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!deleteConfirm ? (
                <DropdownMenuItem
                  onClick={() => setDeleteConfirm(true)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete page
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive font-medium">
                  Confirm delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-6">
        <div className="mb-6">
          <EmojiPicker value={emoji} onChange={handleEmojiChange} size="lg" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-4xl font-bold mt-3 bg-transparent border-none outline-none placeholder:text-muted-foreground/40 resize-none"
          />
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <LabelPicker
              spaceId={page.space_id}
              availableLabels={labels}
              selectedLabelIds={pageLabels}
              onChange={handleLabelChange}
            />
            {pageLabels.map((lid) => {
              const label = labels.find((l) => l.id === lid);
              if (!label) return null;
              return (
                <Badge
                  key={lid}
                  style={{ backgroundColor: label.color, color: "#fff" }}
                  className="text-xs"
                >
                  {label.name}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Last updated {formatRelativeTime(page.updated_at)}
          </p>
        </div>

        <Editor content={content} onChange={setContent} />

        <div className="mt-12 border-t pt-8">
          <CommentSection pageId={page.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
