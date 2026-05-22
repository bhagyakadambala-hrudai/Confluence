"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X, Hash, Star, Megaphone, Calendar, ChevronRight, BookOpen,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";

interface Page {
  id: string;
  title: string;
  emoji: string;
  space_id: string;
  updated_at: string;
  spaces: { name: string; emoji: string } | null;
}

interface HomeContentProps {
  recentPages: Page[];
  firstName: string;
}

/* Tiny document preview illustration */
function DocPreview({ headerColor }: { headerColor: string }) {
  return (
    <div className="w-full h-20 rounded border border-[#E8EAED] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="h-2 w-full" style={{ backgroundColor: headerColor }} />
      <div className="p-2 space-y-1.5">
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-4/5" />
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-full" />
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-3/5" />
        <div className="flex gap-1 mt-0.5">
          <div className="h-2.5 bg-[#DEEBFF] rounded px-1 flex items-center">
            <div className="h-1 w-6 bg-[#0052CC] rounded opacity-60" />
          </div>
          <div className="h-2.5 bg-[#E3FCEF] rounded px-1 flex items-center">
            <div className="h-1 w-6 bg-[#00875A] rounded opacity-60" />
          </div>
        </div>
      </div>
    </div>
  );
}

const REC_TEMPLATES = [
  { id: "project_plan", name: "Project plan", type: "Document template", color: "#F7B900", headerColor: "#F7B900", initial: "P" },
  { id: "brainwriting", name: "Brainwriting", type: "Whiteboard template", color: "#00B8D9", headerColor: "#00B8D9", initial: "B" },
  { id: "meeting_notes", name: "Meeting notes", type: "Document template", color: "#00875A", headerColor: "#FFAB00", initial: "M" },
  { id: "team_poster", name: "Team Poster", type: "Document template", color: "#6554C0", headerColor: "#6554C0", initial: "T" },
];

const TABS = ["Following", "Popular", "Announcements", "Calendars"] as const;
type Tab = (typeof TABS)[number];

export default function HomeContent({ recentPages, firstName }: HomeContentProps) {
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Following");
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);

  return (
    <>
      <div className="min-h-full bg-white dark:bg-[#161B22]">
        {/* Page header */}
        <div className="px-8 py-5 border-b border-[#DFE1E6] dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">For you</h1>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-8">

          {/* ── Recommended templates ── */}
          {showTemplates && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">
                  Recommended templates for you to try
                </h2>
                <div className="flex items-center gap-3">
                  <Link href="/templates" className="text-sm text-[#0052CC] dark:text-blue-400 hover:underline font-medium">
                    Show 4 more
                  </Link>
                  <button onClick={() => setShowTemplates(false)} className="text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {REC_TEMPLATES.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href="/templates"
                    className="group rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all overflow-hidden bg-white dark:bg-slate-800"
                  >
                    <div className="p-3 pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: tpl.color }}
                        >
                          {tpl.initial}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                            {tpl.name}
                          </p>
                          <p className="text-[10px] text-[#6B778C] dark:text-slate-400">{tpl.type}</p>
                        </div>
                      </div>
                      <DocPreview headerColor={tpl.headerColor} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Pick up where you left off ── */}
          {recentPages.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-3">
                Pick up where you left off
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentPages.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/spaces/${page.space_id}/pages/${page.id}`}
                    className="flex items-start gap-3 p-4 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group bg-white dark:bg-slate-800"
                  >
                    <span className="text-2xl leading-none mt-0.5 shrink-0">{page.emoji || "📄"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {page.title || "Untitled"}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-1 truncate">
                        {page.spaces?.name}
                      </p>
                      <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-0.5">
                        Visited {formatRelativeTime(page.updated_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Discover what's happening ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">
                Discover what&apos;s happening
              </h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1 text-xs text-[#42526E] dark:text-slate-400 px-2.5 py-1 rounded border border-[#DFE1E6] dark:border-slate-600 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
                  Sort by: Most relevant <ChevronRight className="h-3 w-3 rotate-90" />
                </button>
                <button className="text-xs text-[#42526E] dark:text-slate-400 px-2.5 py-1 rounded border border-[#DFE1E6] dark:border-slate-600 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
                  Edit feed
                </button>
              </div>
            </div>

            {/* Tab pills */}
            <div className="flex items-center gap-2 mb-4">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === tab
                      ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
                  }`}
                >
                  {tab === "Following" && <Hash className="h-3 w-3" />}
                  {tab === "Popular" && <Star className="h-3 w-3" />}
                  {tab === "Announcements" && <Megaphone className="h-3 w-3" />}
                  {tab === "Calendars" && <Calendar className="h-3 w-3" />}
                  {tab}
                </button>
              ))}
            </div>

            {/* Activity feed */}
            {(activeTab === "Following" || activeTab === "Popular") && recentPages.length > 0 ? (
              <div className="space-y-0.5">
                {recentPages.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/spaces/${page.space_id}/pages/${page.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 group transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[#0052CC] flex items-center justify-center shrink-0 text-white text-xs font-bold">
                      {firstName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0052CC] dark:text-blue-400 group-hover:underline truncate">
                        {page.emoji} {page.title || "Untitled"}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                        {page.spaces?.name} · {formatRelativeTime(page.updated_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (activeTab === "Following" || activeTab === "Popular") ? (
              <EmptyState
                icon={<BookOpen className="h-10 w-10 text-[#DFE1E6]" />}
                title="Nothing to show yet"
                description="Pages from spaces you follow will appear here."
              />
            ) : activeTab === "Announcements" ? (
              <EmptyState
                icon={<Megaphone className="h-10 w-10 text-[#DFE1E6]" />}
                title="No announcements"
                description="Company and team announcements will appear here."
              />
            ) : (
              <EmptyState
                icon={<Calendar className="h-10 w-10 text-[#DFE1E6]" />}
                title="No calendars"
                description="Connect a calendar to see upcoming events."
              />
            )}
          </section>
        </div>
      </div>

      <CreateSpaceModal
        open={createSpaceOpen}
        onClose={() => setCreateSpaceOpen(false)}
        onCreated={(space) => {
          setCreateSpaceOpen(false);
          window.location.href = `/spaces/${space.id}`;
        }}
      />
    </>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-medium text-[#172B4D] dark:text-slate-300">{title}</p>
      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-1 max-w-xs mx-auto">{description}</p>
    </div>
  );
}
