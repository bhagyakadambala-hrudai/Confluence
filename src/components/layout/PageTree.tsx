"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, FileText, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Page {
  id: string;
  title: string;
  emoji: string;
  parent_id: string | null;
  position: number;
}

interface PageTreeProps {
  spaceId: string;
  userId: string;
  onNavigate: (pageId: string) => void;
}

interface PageNode extends Page {
  children: PageNode[];
}

function buildTree(pages: Page[], parentId: string | null = null): PageNode[] {
  return pages
    .filter((p) => p.parent_id === parentId)
    .sort((a, b) => a.position - b.position)
    .map((p) => ({ ...p, children: buildTree(pages, p.id) }));
}

function TreeNode({
  node,
  spaceId,
  depth = 0,
  onNavigate,
  onCreateChild,
}: {
  node: PageNode;
  spaceId: string;
  depth?: number;
  onNavigate: (pageId: string) => void;
  onCreateChild: (parentId: string) => void;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname.includes(`/pages/${node.id}`);
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors group cursor-pointer",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        )}
        style={{ paddingLeft: `${(depth + 1) * 8}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 rounded shrink-0"
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <span className="h-3 w-3 inline-block" />
          )}
        </button>
        <Link
          href={`/spaces/${spaceId}/pages/${node.id}`}
          className="flex items-center gap-1.5 flex-1 min-w-0"
          onClick={() => onNavigate(node.id)}
        >
          <span>{node.emoji || "📄"}</span>
          <span className="truncate">{node.title || "Untitled"}</span>
        </Link>
        {depth < 2 && (
          <button
            onClick={() => onCreateChild(node.id)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>

      {expanded && node.children.length > 0 && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              spaceId={spaceId}
              depth={depth + 1}
              onNavigate={onNavigate}
              onCreateChild={onCreateChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PageTree({ spaceId, userId, onNavigate }: PageTreeProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchPages();
    const channel = supabase
      .channel(`pages-${spaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pages", filter: `space_id=eq.${spaceId}` },
        fetchPages
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [spaceId]);

  async function fetchPages() {
    const { data } = await supabase
      .from("pages")
      .select("id, title, emoji, parent_id, position")
      .eq("space_id", spaceId)
      .order("position", { ascending: true });
    setPages(data || []);
    setLoading(false);
  }

  async function createPage(parentId: string | null = null) {
    const resp = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        space_id: spaceId,
        parent_id: parentId,
        title: "Untitled",
        content: "",
        emoji: "📄",
      }),
    });
    if (resp.ok) {
      const page = await resp.json();
      onNavigate(page.id);
    } else {
      toast.error("Failed to create page");
    }
  }

  if (loading) return (
    <div className="px-3 py-2">
      <Loader2 className="h-3 w-3 animate-spin text-sidebar-foreground/40" />
    </div>
  );

  const tree = buildTree(pages);

  return (
    <div>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          spaceId={spaceId}
          onNavigate={onNavigate}
          onCreateChild={(parentId) => createPage(parentId)}
        />
      ))}
      <button
        onClick={() => createPage(null)}
        className="flex items-center gap-1.5 px-3 py-1 text-xs text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors w-full"
      >
        <Plus className="h-3 w-3" />
        Add page
      </button>
    </div>
  );
}
