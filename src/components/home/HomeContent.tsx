"use client";

import { useState } from "react";
import Link from "next/link";
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

/* ── Illustrated SVG backgrounds for "Get started" cards ── */
function IllustrationCreatePage() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* background */}
      <rect width="240" height="120" fill="#E8F0FE" />
      {/* document card */}
      <rect x="50" y="15" width="90" height="90" rx="6" fill="white" opacity="0.9" />
      <rect x="60" y="30" width="50" height="4" rx="2" fill="#DFE1E6" />
      <rect x="60" y="40" width="65" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="60" y="48" width="55" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="60" y="56" width="60" height="3" rx="1.5" fill="#DFE1E6" />
      {/* sticky notes */}
      <rect x="120" y="10" width="36" height="30" rx="3" fill="#FFAB00" opacity="0.9" />
      <rect x="128" y="18" width="20" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="128" y="24" width="14" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="140" y="55" width="32" height="26" rx="3" fill="#6554C0" opacity="0.85" />
      <rect x="147" y="62" width="18" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="147" y="68" width="13" height="2.5" rx="1" fill="white" opacity="0.7" />
      {/* avatars */}
      <circle cx="30" cy="40" r="14" fill="#0052CC" />
      <circle cx="30" cy="35" r="5" fill="white" opacity="0.8" />
      <path d="M18 52c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white" opacity="0.8" />
      <circle cx="200" cy="70" r="14" fill="#36B37E" />
      <circle cx="200" cy="65" r="5" fill="white" opacity="0.8" />
      <path d="M188 82c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white" opacity="0.8" />
      {/* colored bar highlights */}
      <rect x="60" y="68" width="30" height="6" rx="3" fill="#FF8B00" opacity="0.8" />
      <rect x="95" y="68" width="20" height="6" rx="3" fill="#36B37E" opacity="0.8" />
    </svg>
  );
}

function IllustrationSetupSpace() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#EDE7F6" />
      {/* main window */}
      <rect x="30" y="10" width="130" height="95" rx="6" fill="white" opacity="0.85" />
      <rect x="30" y="10" width="130" height="22" rx="6" fill="#7B61FF" />
      <rect x="30" y="22" width="130" height="10" fill="#7B61FF" />
      <circle cx="42" cy="21" r="4" fill="white" opacity="0.5" />
      <circle cx="55" cy="21" r="4" fill="white" opacity="0.5" />
      <circle cx="68" cy="21" r="4" fill="white" opacity="0.5" />
      {/* sidebar items */}
      <rect x="38" y="40" width="12" height="12" rx="2" fill="#DEEBFF" />
      <rect x="55" y="43" width="40" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="55" y="50" width="30" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="38" y="60" width="12" height="12" rx="2" fill="#E3FCEF" />
      <rect x="55" y="63" width="35" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="55" y="70" width="25" height="3" rx="1.5" fill="#DFE1E6" />
      {/* chevron */}
      <path d="M100 80l8-8 8 8" stroke="#7B61FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* floating document */}
      <rect x="170" y="25" width="50" height="65" rx="4" fill="white" />
      <rect x="178" y="35" width="34" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="178" y="43" width="28" height="2.5" rx="1" fill="#DFE1E6" />
      <rect x="178" y="50" width="32" height="2.5" rx="1" fill="#DFE1E6" />
      <rect x="178" y="63" width="18" height="6" rx="3" fill="#7B61FF" opacity="0.8" />
    </svg>
  );
}

function IllustrationWhiteboard() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#E3F2FD" />
      {/* main board */}
      <rect x="20" y="15" width="145" height="90" rx="6" fill="white" opacity="0.9" />
      {/* squiggly writing */}
      <path d="M35 45 Q50 35 65 45 Q80 55 95 45" stroke="#DFE1E6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M35 60 Q45 52 55 60 Q65 68 75 60" stroke="#DFE1E6" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* coloured sticky blocks */}
      <rect x="40" y="68" width="28" height="24" rx="3" fill="#FFAB00" opacity="0.9" />
      <rect x="75" y="68" width="28" height="24" rx="3" fill="#36B37E" opacity="0.9" />
      <rect x="110" y="68" width="28" height="24" rx="3" fill="#6554C0" opacity="0.9" />
      {/* arrows */}
      <path d="M68 80l7-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arr)" />
      <path d="M103 80l7-4" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
      {/* emoji face */}
      <circle cx="185" cy="45" r="24" fill="#FF8B00" />
      <circle cx="177" cy="40" r="3.5" fill="white" />
      <circle cx="193" cy="40" r="3.5" fill="white" />
      <path d="M177 52 Q185 60 193 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* sparkles */}
      <path d="M165 20 l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" fill="#FFAB00" />
      <path d="M210 75 l1.5-3 1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5z" fill="#6554C0" opacity="0.8" />
      {/* arrow to emoji */}
      <path d="M155 55 Q165 48 178 52" stroke="#0052CC" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 3" fill="none" />
    </svg>
  );
}

function IllustrationTeamProfile() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#E1F5FE" />
      {/* profile card */}
      <rect x="25" y="12" width="145" height="95" rx="6" fill="white" opacity="0.9" />
      {/* header bar */}
      <rect x="25" y="12" width="145" height="30" rx="6" fill="#DEEBFF" />
      <rect x="25" y="30" width="145" height="12" fill="#DEEBFF" />
      {/* avatar row */}
      <circle cx="55" cy="42" r="12" fill="#0052CC" />
      <circle cx="55" cy="38" r="4.5" fill="white" opacity="0.85" />
      <path d="M45 52c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="white" opacity="0.85" />
      {/* name + role */}
      <rect x="73" y="36" width="50" height="4" rx="2" fill="#172B4D" opacity="0.5" />
      <rect x="73" y="45" width="38" height="3" rx="1.5" fill="#DFE1E6" />
      {/* team grid */}
      {[0,1,2].map((i) => (
        <g key={i}>
          <circle cx={40 + i * 45} cy={82} r={10} fill={["#6554C0","#36B37E","#FF8B00"][i]} />
          <rect x={56 + i * 45} y={78} width={24} height={3} rx="1.5" fill="#DFE1E6" />
          <rect x={56 + i * 45} y={85} width={18} height={2.5} rx="1" fill="#DFE1E6" />
        </g>
      ))}
      {/* floating cards */}
      <rect x="178" y="15" width="45" height="32" rx="4" fill="white" />
      <circle cx="188" cy="25" r="6" fill="#0052CC" />
      <rect x="198" y="21" width="18" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="198" y="28" width="14" height="2.5" rx="1" fill="#DFE1E6" />
      <rect x="178" y="55" width="45" height="32" rx="4" fill="white" />
      <circle cx="188" cy="65" r="6" fill="#36B37E" />
      <rect x="198" y="61" width="18" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="198" y="68" width="14" height="2.5" rx="1" fill="#DFE1E6" />
    </svg>
  );
}

/* ── Template card mini-preview ── */
function TemplateDocPreview({ variant }: { variant: "project" | "brainwriting" | "notes" | "poster" }) {
  if (variant === "brainwriting") {
    return (
      <div className="w-full h-20 bg-[#F8F9FA] dark:bg-slate-900 rounded border border-[#E8EAED] dark:border-slate-700 overflow-hidden flex items-center justify-center">
        <div className="grid grid-cols-3 gap-1 p-3">
          {[["#FFAB00","#36B37E","#6554C0"],["#FF8B00","#0052CC","#00B8D9"]].map((row, i) =>
            row.map((c, j) => <div key={`${i}-${j}`} className="h-5 w-5 rounded-sm" style={{ backgroundColor: c, opacity: 0.85 }} />)
          )}
        </div>
      </div>
    );
  }
  const colors = { project: "#36B37E", notes: "#FFAB00", poster: "#0052CC" } as const;
  const color = colors[variant as keyof typeof colors];
  return (
    <div className="w-full h-20 bg-white dark:bg-slate-900 rounded border border-[#E8EAED] dark:border-slate-700 overflow-hidden">
      <div className="p-2 space-y-1.5">
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-4/5" />
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-full" />
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-3/5" />
        <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-700 rounded w-full mt-1" />
      </div>
      <div className="h-4 mx-2 rounded" style={{ backgroundColor: color, opacity: 0.75 }} />
    </div>
  );
}

/* ── Template doc icon (matches Confluence's "lines" icon) ── */
function DocIcon({ color = "#42526E" }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none">
      <rect x="3" y="2" width="14" height="16" rx="2" stroke={color} strokeWidth="1.6" />
      <line x1="6" y1="7" x2="14" y2="7" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="10" x2="14" y2="10" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="13" x2="10" y2="13" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function WhiteboardIcon({ color = "#42526E" }: { color?: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5 shrink-0" fill="none">
      <rect x="2" y="3" width="16" height="12" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M7 16 h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 15 v1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 9 Q8 6 11 9 Q14 12 17 9" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

const GET_STARTED_CARDS = [
  {
    id: "create_page",
    title: "Create a page",
    description: "Plan projects, take notes, and track tasks.",
    cta: "Create page",
    illustration: <IllustrationCreatePage />,
    action: "create_page",
  },
  {
    id: "setup_space",
    title: "Set up a team space",
    description: "Create a single source of truth for your team's projects and docs.",
    cta: "Set up space",
    illustration: <IllustrationSetupSpace />,
    action: "create_space",
  },
  {
    id: "whiteboard",
    title: "Brainstorm on a whiteboard",
    description: "Dream up new ideas and visualize your work.",
    cta: "Create whiteboard",
    illustration: <IllustrationWhiteboard />,
    action: null,
  },
  {
    id: "team_profile",
    title: "Create a team profile",
    description: "Bring everyone together with one team you can assign work to.",
    cta: "Create team",
    illustration: <IllustrationTeamProfile />,
    action: null,
  },
];

const REC_TEMPLATES = [
  { id: "project_plan", name: "Project plan", type: "Document template", variant: "project" as const },
  { id: "brainwriting", name: "Brainwriting", type: "Whiteboard template", variant: "brainwriting" as const },
  { id: "meeting_notes", name: "Meeting notes", type: "Document template", variant: "notes" as const },
  { id: "team_poster", name: "Team Poster", type: "Document template", variant: "poster" as const },
];

const TABS = ["Following", "Popular", "Announcements", "Calendars"] as const;
type Tab = (typeof TABS)[number];

interface HomeContentProps {
  recentPages: Page[];
  firstName: string;
}

export default function HomeContent({ recentPages, firstName }: HomeContentProps) {
  const [showGetStarted, setShowGetStarted] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Following");
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);

  function handleGetStartedAction(action: string | null) {
    if (action === "create_space") setCreateSpaceOpen(true);
  }

  return (
    <>
      <div className="min-h-full bg-white dark:bg-[#161B22]">
        {/* Page header */}
        <div className="px-8 py-5 border-b border-[#DFE1E6] dark:border-slate-700">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">For you</h1>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-6 space-y-8">

          {/* ── Get started with Confluence ── */}
          {showGetStarted && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">
                  Get started with Confluence
                </h2>
                <button
                  onClick={() => setShowGetStarted(false)}
                  className="text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {GET_STARTED_CARDS.map((card) => (
                  <div
                    key={card.id}
                    className="flex flex-col rounded-lg border border-[#DFE1E6] dark:border-slate-700 overflow-hidden hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group cursor-pointer bg-white dark:bg-slate-800"
                    onClick={() => handleGetStartedAction(card.action)}
                  >
                    {/* Illustration */}
                    <div className="h-[130px] w-full overflow-hidden">
                      {card.illustration}
                    </div>
                    {/* Content */}
                    <div className="flex flex-col gap-2 p-4 flex-1">
                      <p className="text-sm font-bold text-[#172B4D] dark:text-slate-100">
                        {card.title}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 leading-relaxed flex-1">
                        {card.description}
                      </p>
                      <button className="text-sm font-medium text-[#0052CC] dark:text-blue-400 hover:underline text-left mt-1 group-hover:text-[#0065FF] transition-colors">
                        {card.cta}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Recommended templates ── */}
          {showTemplates && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">
                  Recommended templates for you to try
                </h2>
                <div className="flex items-center gap-3">
                  <Link href="/templates" className="text-sm text-[#0052CC] dark:text-blue-400 hover:underline font-medium">
                    Show 4 more
                  </Link>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {REC_TEMPLATES.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href="/templates"
                    className="flex flex-col rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group overflow-hidden bg-white dark:bg-slate-800"
                  >
                    <div className="p-3 pb-2">
                      <div className="flex items-center gap-2 mb-3">
                        {tpl.type === "Whiteboard template"
                          ? <WhiteboardIcon />
                          : <DocIcon />}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors truncate">
                            {tpl.name}
                          </p>
                          <p className="text-xs text-[#6B778C] dark:text-slate-400">{tpl.type}</p>
                        </div>
                      </div>
                      <TemplateDocPreview variant={tpl.variant} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Pick up where you left off ── */}
          {recentPages.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">
                Pick up where you left off
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentPages.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/spaces/${page.space_id}/pages/${page.id}`}
                    className="flex items-start gap-3 p-4 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group bg-white dark:bg-slate-800"
                  >
                    <span className="text-xl leading-none mt-0.5 shrink-0">{page.emoji || "📄"}</span>
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
              <EmptyState icon={<BookOpen className="h-10 w-10 text-[#DFE1E6]" />} title="Nothing to show yet" description="Pages from spaces you follow will appear here." />
            ) : activeTab === "Announcements" ? (
              <EmptyState icon={<Megaphone className="h-10 w-10 text-[#DFE1E6]" />} title="No announcements" description="Company and team announcements will appear here." />
            ) : (
              <EmptyState icon={<Calendar className="h-10 w-10 text-[#DFE1E6]" />} title="No calendars" description="Connect a calendar to see upcoming events." />
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
