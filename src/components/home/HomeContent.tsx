"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, LayoutGrid, Users } from "lucide-react";
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

/* ── SVG Illustrations for Get Started cards ── */
function IllustrationCreatePage() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#E8F0FE" />
      <rect x="50" y="15" width="90" height="90" rx="6" fill="white" opacity="0.9" />
      <rect x="60" y="30" width="50" height="4" rx="2" fill="#DFE1E6" />
      <rect x="60" y="40" width="65" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="60" y="48" width="55" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="60" y="56" width="60" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="120" y="10" width="36" height="30" rx="3" fill="#FFAB00" opacity="0.9" />
      <rect x="128" y="18" width="20" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="128" y="24" width="14" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="140" y="55" width="32" height="26" rx="3" fill="#6554C0" opacity="0.85" />
      <rect x="147" y="62" width="18" height="2.5" rx="1" fill="white" opacity="0.7" />
      <rect x="147" y="68" width="13" height="2.5" rx="1" fill="white" opacity="0.7" />
      <circle cx="30" cy="40" r="14" fill="#0052CC" />
      <circle cx="30" cy="35" r="5" fill="white" opacity="0.8" />
      <path d="M18 52c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white" opacity="0.8" />
      <circle cx="200" cy="70" r="14" fill="#36B37E" />
      <circle cx="200" cy="65" r="5" fill="white" opacity="0.8" />
      <path d="M188 82c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white" opacity="0.8" />
      <rect x="60" y="68" width="30" height="6" rx="3" fill="#FF8B00" opacity="0.8" />
      <rect x="95" y="68" width="20" height="6" rx="3" fill="#36B37E" opacity="0.8" />
    </svg>
  );
}

function IllustrationSetupSpace() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#EDE7F6" />
      <rect x="30" y="10" width="130" height="95" rx="6" fill="white" opacity="0.85" />
      <rect x="30" y="10" width="130" height="22" rx="6" fill="#7B61FF" />
      <rect x="30" y="22" width="130" height="10" fill="#7B61FF" />
      <circle cx="42" cy="21" r="4" fill="white" opacity="0.5" />
      <circle cx="55" cy="21" r="4" fill="white" opacity="0.5" />
      <circle cx="68" cy="21" r="4" fill="white" opacity="0.5" />
      <rect x="38" y="40" width="12" height="12" rx="2" fill="#DEEBFF" />
      <rect x="55" y="43" width="40" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="55" y="50" width="30" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="38" y="60" width="12" height="12" rx="2" fill="#E3FCEF" />
      <rect x="55" y="63" width="35" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="55" y="70" width="25" height="3" rx="1.5" fill="#DFE1E6" />
      <path d="M100 80l8-8 8 8" stroke="#7B61FF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="170" y="25" width="50" height="65" rx="4" fill="white" />
      <rect x="178" y="35" width="34" height="3" rx="1.5" fill="#DFE1E6" />
      <rect x="178" y="43" width="28" height="2.5" rx="1" fill="#DFE1E6" />
      <rect x="178" y="50" width="32" height="2.5" rx="1" fill="#DFE1E6" />
      <rect x="178" y="63" width="18" height="6" rx="3" fill="#7B61FF" opacity="0.8" />
    </svg>
  );
}

function IllustrationTeams() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#E1F5FE" />
      <rect x="25" y="12" width="145" height="95" rx="6" fill="white" opacity="0.9" />
      <rect x="25" y="12" width="145" height="30" rx="6" fill="#DEEBFF" />
      <rect x="25" y="30" width="145" height="12" fill="#DEEBFF" />
      <circle cx="55" cy="42" r="12" fill="#0052CC" />
      <circle cx="55" cy="38" r="4.5" fill="white" opacity="0.85" />
      <path d="M45 52c0-5.523 4.477-10 10-10s10 4.477 10 10" fill="white" opacity="0.85" />
      <rect x="73" y="36" width="50" height="4" rx="2" fill="#172B4D" opacity="0.5" />
      <rect x="73" y="45" width="38" height="3" rx="1.5" fill="#DFE1E6" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={40 + i * 45} cy={82} r={10} fill={["#6554C0", "#36B37E", "#FF8B00"][i]} />
          <rect x={56 + i * 45} y={78} width={24} height={3} rx="1.5" fill="#DFE1E6" />
          <rect x={56 + i * 45} y={85} width={18} height={2.5} rx="1" fill="#DFE1E6" />
        </g>
      ))}
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

function IllustrationBrowseTemplates() {
  return (
    <svg viewBox="0 0 240 120" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="120" fill="#FFF3E0" />
      <rect x="20" y="15" width="145" height="90" rx="6" fill="white" opacity="0.9" />
      <path d="M35 45 Q50 35 65 45 Q80 55 95 45" stroke="#DFE1E6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M35 60 Q45 52 55 60 Q65 68 75 60" stroke="#DFE1E6" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="40" y="68" width="28" height="24" rx="3" fill="#FFAB00" opacity="0.9" />
      <rect x="75" y="68" width="28" height="24" rx="3" fill="#36B37E" opacity="0.9" />
      <rect x="110" y="68" width="28" height="24" rx="3" fill="#6554C0" opacity="0.9" />
      <circle cx="185" cy="45" r="24" fill="#FF8B00" />
      <circle cx="177" cy="40" r="3.5" fill="white" />
      <circle cx="193" cy="40" r="3.5" fill="white" />
      <path d="M177 52 Q185 60 193 52" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M165 20 l2-4 2 4 4 2-4 2-2 4-2-4-4-2z" fill="#FFAB00" />
    </svg>
  );
}

/* ── Feature tab mock screenshots ── */
function MockPageEditor() {
  return (
    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-600 overflow-hidden shadow-lg">
      {/* top bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] dark:bg-slate-700 border-b border-[#DFE1E6] dark:border-slate-600">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-2 h-4 bg-white dark:bg-slate-600 rounded text-[9px] text-[#97A0AF] flex items-center px-2">confluence.example.com/pages/new</div>
      </div>
      <div className="flex h-[calc(100%-32px)]">
        {/* sidebar */}
        <div className="w-28 border-r border-[#DFE1E6] dark:border-slate-600 p-2 space-y-1 shrink-0">
          <div className="h-2 bg-[#DEEBFF] rounded w-full" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-4/5" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-3/4 ml-3" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-4/5 ml-3" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-full" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-4/5 ml-3" />
        </div>
        {/* content */}
        <div className="flex-1 p-3 space-y-2">
          <div className="h-3 bg-[#172B4D] dark:bg-slate-300 rounded w-3/5 opacity-70" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-full" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-11/12" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-full" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-4/5" />
          <div className="mt-2 flex gap-2">
            <div className="h-8 flex-1 bg-[#E8F0FE] dark:bg-slate-700 rounded border border-[#DEEBFF] dark:border-slate-500" />
            <div className="h-8 flex-1 bg-[#E3FCEF] rounded border border-[#ABF5D1]" />
          </div>
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-full" />
          <div className="h-2 bg-[#DFE1E6] dark:bg-slate-600 rounded w-3/4" />
        </div>
      </div>
    </div>
  );
}

function MockSpacesGrid() {
  const colors = ["#DEEBFF", "#E3FCEF", "#EDE7F6", "#FFF0B3", "#FFEBE6", "#E6FCFF"];
  const labels = ["Engineering", "Product", "Design", "Marketing", "HR", "Sales"];
  return (
    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-600 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] dark:bg-slate-700 border-b border-[#DFE1E6] dark:border-slate-600">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="h-3 w-24 bg-[#DFE1E6] dark:bg-slate-600 rounded ml-2" />
      </div>
      <div className="p-3">
        <div className="h-3 bg-[#172B4D] dark:bg-slate-300 rounded w-1/3 mb-3 opacity-60" />
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color, i) => (
            <div key={i} className="rounded-lg border border-[#DFE1E6] dark:border-slate-600 overflow-hidden">
              <div className="h-8" style={{ backgroundColor: color }} />
              <div className="p-1.5 space-y-1">
                <div className="h-1.5 bg-[#172B4D] dark:bg-slate-400 rounded w-4/5 opacity-50" />
                <div className="text-[7px] text-[#6B778C] dark:text-slate-400">{labels[i]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MockTeamCards() {
  const members = [
    { color: "#0052CC", name: "Alice" },
    { color: "#36B37E", name: "Bob" },
    { color: "#FF8B00", name: "Carol" },
  ];
  return (
    <div className="w-full h-full bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-600 overflow-hidden shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F4F5F7] dark:bg-slate-700 border-b border-[#DFE1E6] dark:border-slate-600">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="h-3 w-20 bg-[#DFE1E6] dark:bg-slate-600 rounded ml-2" />
      </div>
      <div className="p-3 space-y-2">
        <div className="h-3 bg-[#172B4D] dark:bg-slate-300 rounded w-1/4 mb-2 opacity-60" />
        {members.map((m, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-lg border border-[#DFE1E6] dark:border-slate-600">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: m.color }}>
              {m.name[0]}
            </div>
            <div className="flex-1 space-y-1">
              <div className="h-2 bg-[#172B4D] dark:bg-slate-300 rounded w-16 opacity-50" />
              <div className="h-1.5 bg-[#DFE1E6] dark:bg-slate-600 rounded w-24" />
            </div>
            <div className="h-5 w-12 rounded bg-[#DEEBFF] dark:bg-blue-900/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Feature tabs config ── */
type FeatureTab = "Pages" | "Spaces" | "Teams";

const FEATURE_TABS: {
  id: FeatureTab;
  icon: React.ReactNode;
  headline: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  mock: React.ReactNode;
}[] = [
  {
    id: "Pages",
    icon: <FileText className="h-4 w-4" />,
    headline: "Get everyone on the same page",
    bullets: [
      "Countless templates to get started fast",
      "Draft and publish polished pages",
      "Rich editor with tables, images, and more",
    ],
    ctaLabel: "Try it out →",
    ctaHref: "/pages/new",
    mock: <MockPageEditor />,
  },
  {
    id: "Spaces",
    icon: <LayoutGrid className="h-4 w-4" />,
    headline: "Your team's knowledge, all in one place",
    bullets: [
      "Organize docs by team, project, or topic",
      "Share and collaborate in one workspace",
      "Find everything fast with search",
    ],
    ctaLabel: "View spaces →",
    ctaHref: "/spaces",
    mock: <MockSpacesGrid />,
  },
  {
    id: "Teams",
    icon: <Users className="h-4 w-4" />,
    headline: "Collaborate with your colleagues",
    bullets: [
      "Create teams and invite members by email",
      "Assign spaces and docs to teams",
      "Keep everyone in the loop",
    ],
    ctaLabel: "View teams →",
    ctaHref: "/teams",
    mock: <MockTeamCards />,
  },
];

/* ── Get started cards ── */
const GET_STARTED_CARDS = [
  {
    id: "create_page",
    title: "Create a page",
    description: "Plan projects, take notes, and track tasks.",
    cta: "Create page",
    illustration: <IllustrationCreatePage />,
    action: "create_page",
    href: "/pages/new",
  },
  {
    id: "setup_space",
    title: "Set up a team space",
    description: "Create a single source of truth for your team's projects and docs.",
    cta: "Set up space",
    illustration: <IllustrationSetupSpace />,
    action: "create_space",
    href: null,
  },
  {
    id: "create_team",
    title: "Create a team",
    description: "Bring everyone together with a shared team workspace.",
    cta: "Create team",
    illustration: <IllustrationTeams />,
    action: "navigate",
    href: "/teams",
  },
  {
    id: "browse_templates",
    title: "Browse templates",
    description: "Start fast with hundreds of templates for any use case.",
    cta: "Browse templates",
    illustration: <IllustrationBrowseTemplates />,
    action: "navigate",
    href: "/templates",
  },
];

interface HomeContentProps {
  recentPages: Page[];
  firstName: string;
}

export default function HomeContent({ recentPages, firstName }: HomeContentProps) {
  const router = useRouter();
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTab>("Pages");
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);

  const currentTab = FEATURE_TABS.find((t) => t.id === activeFeatureTab)!;

  function handleGetStartedAction(action: string, href: string | null) {
    if (action === "create_space") {
      setCreateSpaceOpen(true);
    } else if (href) {
      router.push(href);
    }
  }

  return (
    <>
      <div className="min-h-full bg-white dark:bg-[#1B2A3B]">

        {/* ── 1. Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-r from-[#E8F0FE] to-[#F0F4FF] dark:from-slate-900 dark:to-[#1B2A3B] px-6 py-12 md:px-16 md:py-16">
          {/* Decorative blocks */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-6 right-16 h-24 w-10 rounded-md bg-[#FF8B00] opacity-70 rotate-12" />
            <div className="absolute top-8 right-28 h-16 w-8 rounded-md bg-[#0052CC] opacity-50 -rotate-6" />
            <div className="absolute bottom-4 right-10 h-12 w-12 rounded-md bg-[#6554C0] opacity-40 rotate-3" />
            <div className="absolute top-4 left-1/2 h-10 w-6 rounded-md bg-[#36B37E] opacity-30 rotate-45" />
          </div>

          <div className="relative max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#172B4D] dark:text-white mb-2">
              Welcome back, {firstName}.
            </h1>
            <p className="text-base text-[#6B778C] dark:text-slate-400 mb-8">
              Pick up where you left off.
            </p>

            {/* Hero card */}
            <div className="inline-flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl shadow-md px-6 py-4 border border-[#DFE1E6] dark:border-slate-700">
              {/* App logo */}
              <div className="h-10 w-10 rounded-lg bg-[#0052CC] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                  <path d="M2.5 16.5C2.5 16.5 7 9 12 9C17 9 21.5 16.5 21.5 16.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M12 9V4" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx="12" cy="17" r="3" fill="white" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-[#172B4D] dark:text-white">Confluence</p>
                <p className="text-xs text-[#6B778C] dark:text-slate-400">{firstName}</p>
              </div>
              <Link
                href="/spaces"
                className="ml-4 px-4 py-2 rounded-lg bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Go to my spaces →
              </Link>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-10 space-y-16">

          {/* ── 2. Feature tabs ── */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-2">
                Explore more of Confluence
              </h2>
              <p className="text-sm text-[#6B778C] dark:text-slate-400">
                Create, collaborate, and connect your team&apos;s knowledge, all in one place
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex items-center justify-center gap-1 mb-8 border-b border-[#DFE1E6] dark:border-slate-700">
              {FEATURE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeFeatureTab === tab.id
                      ? "border-[#0052CC] text-[#0052CC] dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-[#6B778C] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.id}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Left: text */}
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-bold text-[#172B4D] dark:text-white">
                  {currentTab.headline}
                </h3>
                <ul className="space-y-2">
                  {currentTab.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-[#6B778C] dark:text-slate-300">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#0052CC] dark:bg-blue-400 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={currentTab.ctaHref}
                  className="inline-block mt-2 text-sm font-semibold text-[#0052CC] dark:text-blue-400 hover:text-[#0065FF] dark:hover:text-blue-300 transition-colors"
                >
                  {currentTab.ctaLabel}
                </Link>
              </div>

              {/* Right: mock screenshot */}
              <div className="flex-1 w-full md:max-w-md h-52">
                {currentTab.mock}
              </div>
            </div>
          </section>

          {/* ── 3. Recent pages ── */}
          {recentPages.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">
                Pick up where you left off
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentPages.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/spaces/${page.space_id}/pages/${page.id}/edit`}
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

          {/* ── 4. Get started cards ── */}
          <section>
            <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">
              Get started
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {GET_STARTED_CARDS.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col rounded-lg border border-[#DFE1E6] dark:border-slate-700 overflow-hidden hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all group cursor-pointer bg-white dark:bg-slate-800"
                  onClick={() => handleGetStartedAction(card.action, card.href)}
                >
                  <div className="h-[130px] w-full overflow-hidden">
                    {card.illustration}
                  </div>
                  <div className="flex flex-col gap-2 p-4 flex-1">
                    <p className="text-sm font-bold text-[#172B4D] dark:text-slate-100">
                      {card.title}
                    </p>
                    <p className="text-xs text-[#6B778C] dark:text-slate-400 leading-relaxed flex-1">
                      {card.description}
                    </p>
                    <span className="text-sm font-medium text-[#0052CC] dark:text-blue-400 hover:underline text-left mt-1 group-hover:text-[#0065FF] transition-colors">
                      {card.cta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>

      <CreateSpaceModal
        open={createSpaceOpen}
        onClose={() => setCreateSpaceOpen(false)}
        onCreated={(space) => {
          setCreateSpaceOpen(false);
          router.push(`/spaces/${space.id}`);
        }}
      />
    </>
  );
}
