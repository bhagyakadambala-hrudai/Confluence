"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageTree from "./PageTree";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import {
  Plus,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
  emoji: string;
  description?: string;
}

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  user: User;
}

export default function Sidebar({ open, user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpaces();
    const channel = supabase
      .channel("spaces-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "spaces" }, fetchSpaces)
      .on("postgres_changes", { event: "*", schema: "public", table: "space_members" }, fetchSpaces)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchSpaces() {
    setLoading(true);
    const { data } = await supabase
      .from("spaces")
      .select("id, name, emoji, description")
      .order("created_at", { ascending: true });
    setSpaces(data || []);
    setLoading(false);
  }

  function toggleSpace(spaceId: string) {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) next.delete(spaceId);
      else next.add(spaceId);
      return next;
    });
  }

  const activeSpaceId = pathname.match(/\/spaces\/([^/]+)/)?.[1];

  if (!open) return null;

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col h-full bg-sidebar border-r border-sidebar-border">
        <div className="p-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            <span className="text-lg font-bold text-sidebar-foreground">Confluence</span>
          </Link>
        </div>

        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </nav>

          <div className="mt-4 px-2">
            <div className="flex items-center justify-between px-3 py-1 mb-1">
              <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                Spaces
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {loading ? (
              <div className="space-y-1 px-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 rounded bg-sidebar-accent/50 animate-pulse" />
                ))}
              </div>
            ) : spaces.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-sidebar-foreground/40">No spaces yet</p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="text-xs text-blue-400 hover:underline mt-1"
                >
                  Create one
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {spaces.map((space) => (
                  <div key={space.id}>
                    <div
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors group",
                        activeSpaceId === space.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <button
                        onClick={() => toggleSpace(space.id)}
                        className="p-0.5 rounded hover:bg-sidebar-accent"
                      >
                        {expandedSpaces.has(space.id) ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </button>
                      <Link
                        href={`/spaces/${space.id}`}
                        className="flex items-center gap-2 flex-1 min-w-0"
                      >
                        <span className="text-base">{space.emoji || "📁"}</span>
                        <span className="truncate text-sm">{space.name}</span>
                      </Link>
                      <Link
                        href={`/spaces/${space.id}/settings`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-sidebar-accent"
                      >
                        <Settings className="h-3 w-3" />
                      </Link>
                    </div>

                    {expandedSpaces.has(space.id) && (
                      <div className="ml-4 mt-0.5">
                        <PageTree
                          spaceId={space.id}
                          userId={user.id}
                          onNavigate={(pageId) =>
                            router.push(`/spaces/${space.id}/pages/${pageId}`)
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      <CreateSpaceModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(space) => {
          fetchSpaces();
          router.push(`/spaces/${space.id}`);
        }}
      />
    </>
  );
}
