"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import PageTree from "./PageTree";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import { Plus, ChevronDown, ChevronRight, Settings, Star, Clock, Home, Building2, Users } from "lucide-react";
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
  const [spacesExpanded, setSpacesExpanded] = useState(true);

  useEffect(() => {
    fetchSpaces();
    const channel = supabase
      .channel("spaces-sidebar")
      .on("postgres_changes", { event: "*", schema: "public", table: "spaces" }, fetchSpaces)
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
      if (next.has(spaceId)) next.delete(spaceId); else next.add(spaceId);
      return next;
    });
  }

  const activeSpaceId = pathname.match(/\/spaces\/([^/]+)/)?.[1];

  if (!open) return null;

  return (
    <>
      <aside className="w-60 shrink-0 flex flex-col h-full bg-[#F4F5F7] dark:bg-[#1B2A3B] border-r border-[#DFE1E6] dark:border-slate-700">
        <ScrollArea className="flex-1 py-2">

          {/* Main nav */}
          <div className="px-2 mb-1">
            <SidebarLink href="/" icon={<Home className="h-4 w-4" />} label="Home" active={pathname === "/"} />
            <SidebarLink href="#" icon={<Star className="h-4 w-4" />} label="Starred" active={false} />
            <SidebarLink href="#" icon={<Clock className="h-4 w-4" />} label="Recent" active={false} />
          </div>

          <div className="h-px bg-[#DFE1E6] dark:bg-slate-700 mx-3 my-2" />

          {/* Spaces section */}
          <div className="px-2">
            <button
              onClick={() => setSpacesExpanded(!spacesExpanded)}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded text-xs font-semibold text-[#6B778C] dark:text-slate-400 hover:bg-[#EBECF0] dark:hover:bg-slate-700 uppercase tracking-wider transition-colors"
            >
              <span>Spaces</span>
              <div className="flex items-center gap-1">
                <span
                  onClick={(e) => { e.stopPropagation(); setCreateModalOpen(true); }}
                  className="p-0.5 rounded hover:bg-[#DFE1E6] dark:hover:bg-slate-600"
                >
                  <Plus className="h-3 w-3" />
                </span>
                {spacesExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            </button>

            {spacesExpanded && (
              <div className="mt-0.5 space-y-0.5">
                {loading ? (
                  <div className="space-y-1 px-2 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-7 rounded bg-[#EBECF0] dark:bg-slate-700 animate-pulse" />
                    ))}
                  </div>
                ) : spaces.length === 0 ? (
                  <div className="px-3 py-3 text-center">
                    <p className="text-xs text-[#6B778C] dark:text-slate-500">No spaces yet</p>
                    <button onClick={() => setCreateModalOpen(true)} className="text-xs text-[#0052CC] hover:underline mt-1">
                      Create one
                    </button>
                  </div>
                ) : (
                  spaces.map((space) => (
                    <div key={space.id}>
                      <div
                        className={cn(
                          "flex items-center gap-0.5 px-1 py-1 rounded cursor-pointer text-sm transition-colors group",
                          activeSpaceId === space.id
                            ? "bg-[#DEEBFF] dark:bg-blue-900/40 text-[#0052CC] dark:text-blue-300"
                            : "text-[#172B4D] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700"
                        )}
                      >
                        <button onClick={() => toggleSpace(space.id)} className="p-0.5 rounded hover:bg-[#DFE1E6] dark:hover:bg-slate-600 shrink-0">
                          {expandedSpaces.has(space.id)
                            ? <ChevronDown className="h-3.5 w-3.5" />
                            : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                        <Link href={`/spaces/${space.id}`} className="flex items-center gap-2 flex-1 min-w-0 py-0.5">
                          <span className="text-base leading-none">{space.emoji || "📁"}</span>
                          <span className="truncate text-sm font-medium">{space.name}</span>
                        </Link>
                        <Link
                          href={`/spaces/${space.id}/settings`}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#DFE1E6] dark:hover:bg-slate-600 shrink-0 transition-opacity"
                        >
                          <Settings className="h-3 w-3 text-[#6B778C]" />
                        </Link>
                      </div>

                      {expandedSpaces.has(space.id) && (
                        <div className="ml-5 border-l border-[#DFE1E6] dark:border-slate-600 pl-1 mt-0.5">
                          <PageTree
                            spaceId={space.id}
                            userId={user.id}
                            onNavigate={(pageId) => router.push(`/spaces/${space.id}/pages/${pageId}`)}
                          />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="h-px bg-[#DFE1E6] dark:bg-slate-700 mx-3 my-3" />

          {/* Bottom links */}
          <div className="px-2">
            <SidebarLink href="#" icon={<Building2 className="h-4 w-4" />} label="Company hub" active={false} external />
            <SidebarLink href="#" icon={<Users className="h-4 w-4" />} label="Teams" active={false} external />
          </div>
        </ScrollArea>

        {/* Invite people */}
        <div className="border-t border-[#DFE1E6] dark:border-slate-700 p-3">
          <button className="w-full text-sm text-[#0052CC] dark:text-blue-400 hover:underline font-medium py-1">
            Invite people
          </button>
        </div>
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

function SidebarLink({ href, icon, label, active, external }: {
  href: string; icon: React.ReactNode; label: string; active: boolean; external?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors",
        active
          ? "bg-[#DEEBFF] dark:bg-blue-900/40 text-[#0052CC] dark:text-blue-300 font-medium"
          : "text-[#172B4D] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700"
      )}
    >
      <span className="text-[#6B778C] dark:text-slate-400 shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
      {external && <span className="text-[#6B778C] dark:text-slate-500 text-xs">↗</span>}
    </Link>
  );
}
