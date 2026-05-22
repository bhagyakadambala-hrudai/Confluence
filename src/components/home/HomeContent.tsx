"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText, Users, Lightbulb, UserCircle2, X, ChevronRight,
  Clock, Hash, Star, Megaphone, Calendar, BookOpen, Layout, LayoutTemplate,
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

interface Space {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  created_at: string;
  owner_id: string;
}

interface HomeContentProps {
  recentPages: Page[];
  spaces: Space[];
  currentUserId: string;
  firstName: string;
}

const ONBOARDING_CARDS = [
  {
    id: "create_page",
    icon: <FileText className="h-6 w-6 text-[#0052CC]" />,
    bg: "bg-[#DEEBFF]",
    title: "Create a page",
    description: "Document your ideas, meeting notes, or anything your team needs.",
    cta: "Create a page",
    href: null,
    action: "create_page",
  },
  {
    id: "setup_space",
    icon: <Users className="h-6 w-6 text-[#00875A]" />,
    bg: "bg-[#E3FCEF]",
    title: "Set up a team space",
    description: "Organize your team's work in a dedicated space.",
    cta: "Create a space",
    href: null,
    action: "create_space",
  },
  {
    id: "brainstorm",
    icon: <Lightbulb className="h-6 w-6 text-[#FF8B00]" />,
    bg: "bg-[#FFFAE6]",
    title: "Brainstorm on a whiteboard",
    description: "Visualize ideas with your team in real-time.",
    cta: "Open whiteboard",
    href: null,
    action: "whiteboard",
  },
  {
    id: "team_profile",
    icon: <UserCircle2 className="h-6 w-6 text-[#6554C0]" />,
    bg: "bg-[#EAE6FF]",
    title: "Create a team profile",
    description: "Introduce your team and share what you're working on.",
    cta: "Create profile",
    href: null,
    action: "profile",
  },
];

const TEMPLATES = [
  {
    id: "project_plan",
    emoji: "📋",
    name: "Project plan",
    space: "Software",
    description: "Track progress, milestones, and deliverables for any project.",
    color: "#DEEBFF",
  },
  {
    id: "brainwriting",
    emoji: "🧠",
    name: "Brainwriting",
    space: "Design",
    description: "Generate and capture ideas from your whole team silently.",
    color: "#EAE6FF",
  },
  {
    id: "meeting_notes",
    emoji: "📝",
    name: "Meeting notes",
    space: "General",
    description: "Record decisions, action items, and key points from meetings.",
    color: "#E3FCEF",
  },
  {
    id: "team_poster",
    emoji: "👥",
    name: "Team Poster",
    space: "HR",
    description: "Introduce your team with roles, contacts, and working styles.",
    color: "#FFFAE6",
  },
];

const ACTIVITY_TABS = ["Following", "Popular", "Announcements", "Calendars"] as const;
type ActivityTab = (typeof ACTIVITY_TABS)[number];

export default function HomeContent({ recentPages, spaces, currentUserId, firstName }: HomeContentProps) {
  const router = useRouter();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeTab, setActiveTab] = useState<ActivityTab>("Following");
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);

  function handleOnboardingAction(action: string) {
    if (action === "create_space") {
      setCreateSpaceOpen(true);
    } else if (action === "create_page") {
      if (spaces && spaces.length > 0) {
        router.push(`/spaces/${spaces[0].id}`);
      }
    }
  }

  return (
    <>
      <div className="min-h-full bg-[#F4F5F7] dark:bg-[#161B22]">
        {/* Page header */}
        <div className="bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8 py-5">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">
            For you
          </h1>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

          {/* Get started section */}
          {showOnboarding && (
            <section className="bg-white dark:bg-[#1B2A3B] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#172B4D] dark:text-white text-sm">
                  Get started with Confluence
                </h2>
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ONBOARDING_CARDS.map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleOnboardingAction(card.action)}
                    className="flex flex-col gap-3 p-4 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all text-left group"
                  >
                    <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                      {card.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                        {card.title}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5 leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-[#0052CC] dark:text-blue-400 flex items-center gap-1 mt-auto">
                      {card.cta} <ChevronRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Recommended templates */}
          {showTemplates && (
            <section className="bg-white dark:bg-[#1B2A3B] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-[#172B4D] dark:text-white text-sm">
                    Recommended templates for you to try
                  </h2>
                  <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                    Start faster with ready-made page templates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/templates"
                    className="text-xs text-[#0052CC] dark:text-blue-400 hover:underline font-medium"
                  >
                    View all templates
                  </Link>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors ml-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {TEMPLATES.map((tpl) => (
                  <Link
                    key={tpl.id}
                    href="/templates"
                    className="flex flex-col gap-2 p-4 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group"
                  >
                    <div
                      className="h-16 rounded-md flex items-center justify-center text-3xl"
                      style={{ backgroundColor: tpl.color }}
                    >
                      {tpl.emoji}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                        {tpl.name}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                        {tpl.space}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Two-column layout: Recent + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Pick up where you left off */}
            <div className="lg:col-span-2 bg-white dark:bg-[#1B2A3B] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-[#6B778C]" />
                <h2 className="font-semibold text-[#172B4D] dark:text-white text-sm">
                  Pick up where you left off
                </h2>
              </div>

              {recentPages.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-8 w-8 text-[#DFE1E6] mx-auto mb-2" />
                  <p className="text-sm text-[#6B778C] dark:text-slate-400">No recent pages</p>
                  <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-1">
                    Pages you visit will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentPages.slice(0, 8).map((page) => (
                    <Link
                      key={page.id}
                      href={`/spaces/${page.space_id}/pages/${page.id}`}
                      className="flex items-center gap-3 px-2 py-2 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 group transition-colors"
                    >
                      <span className="text-base leading-none shrink-0">{page.emoji || "📄"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                          {page.title || "Untitled"}
                        </p>
                        <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-0.5">
                          {page.spaces?.emoji} {page.spaces?.name} · {formatRelativeTime(page.updated_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Discover what's happening */}
            <div className="lg:col-span-3 bg-white dark:bg-[#1B2A3B] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-5">
              <h2 className="font-semibold text-[#172B4D] dark:text-white text-sm mb-3">
                Discover what&apos;s happening
              </h2>

              {/* Tabs */}
              <div className="flex items-center gap-0 border-b border-[#DFE1E6] dark:border-slate-700 mb-4">
                {ACTIVITY_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
                      activeTab === tab
                        ? "border-[#0052CC] text-[#0052CC] dark:text-blue-400 dark:border-blue-400"
                        : "border-transparent text-[#6B778C] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white"
                    }`}
                  >
                    {tab === "Following" && <Hash className="h-3 w-3 inline mr-1" />}
                    {tab === "Popular" && <Star className="h-3 w-3 inline mr-1" />}
                    {tab === "Announcements" && <Megaphone className="h-3 w-3 inline mr-1" />}
                    {tab === "Calendars" && <Calendar className="h-3 w-3 inline mr-1" />}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {(activeTab === "Following" || activeTab === "Popular") && recentPages.length > 0 ? (
                <div className="space-y-3">
                  {recentPages.slice(0, 5).map((page) => (
                    <Link
                      key={page.id}
                      href={`/spaces/${page.space_id}/pages/${page.id}`}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 group transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-[#F4F5F7] dark:bg-slate-700 flex items-center justify-center text-xl shrink-0">
                        {page.emoji || "📄"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                          {page.title || "Untitled"}
                        </p>
                        <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-0.5">
                          {page.spaces?.emoji} {page.spaces?.name}
                        </p>
                        <p className="text-xs text-[#97A0AF] dark:text-slate-500">
                          Updated {formatRelativeTime(page.updated_at)}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#DFE1E6] group-hover:text-[#0052CC] transition-colors shrink-0 mt-1" />
                    </Link>
                  ))}
                </div>
              ) : (activeTab === "Following" || activeTab === "Popular") ? (
                <EmptyActivityState
                  icon={activeTab === "Following" ? <Hash className="h-8 w-8 text-[#DFE1E6]" /> : <Star className="h-8 w-8 text-[#DFE1E6]" />}
                  title={activeTab === "Following" ? "Nothing to show yet" : "No popular content"}
                  description={activeTab === "Following" ? "Pages from spaces you follow will appear here." : "Popular pages will show up as your team creates content."}
                />
              ) : activeTab === "Announcements" ? (
                <EmptyActivityState
                  icon={<Megaphone className="h-8 w-8 text-[#DFE1E6]" />}
                  title="No announcements"
                  description="Company and team announcements will appear here."
                />
              ) : (
                <EmptyActivityState
                  icon={<Calendar className="h-8 w-8 text-[#DFE1E6]" />}
                  title="No calendars"
                  description="Connect a calendar to see upcoming events."
                />
              )}
            </div>
          </div>

          {/* Your spaces quick access */}
          {spaces.length > 0 && (
            <section className="bg-white dark:bg-[#1B2A3B] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-[#6B778C]" />
                  <h2 className="font-semibold text-[#172B4D] dark:text-white text-sm">Your spaces</h2>
                </div>
                <button
                  onClick={() => setCreateSpaceOpen(true)}
                  className="text-xs text-[#0052CC] dark:text-blue-400 hover:underline font-medium"
                >
                  Create space
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {spaces.slice(0, 6).map((space) => (
                  <Link
                    key={space.id}
                    href={`/spaces/${space.id}`}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 group transition-colors text-center"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#DEEBFF] dark:bg-blue-900/40 flex items-center justify-center text-xl">
                      {space.emoji || "📁"}
                    </div>
                    <p className="text-xs font-medium text-[#172B4D] dark:text-slate-300 truncate w-full group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                      {space.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}

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

function EmptyActivityState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="text-center py-10">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-sm font-medium text-[#172B4D] dark:text-slate-300">{title}</p>
      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-1 max-w-xs mx-auto">{description}</p>
    </div>
  );
}
