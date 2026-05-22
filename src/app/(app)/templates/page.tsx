"use client";

import { useState } from "react";
import { Search, FileText, Users, BarChart2, Calendar, MessageSquare, Lightbulb, ClipboardList, Star, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All templates" },
  { id: "featured", label: "Featured" },
  { id: "product", label: "Product & design" },
  { id: "engineering", label: "Engineering" },
  { id: "hr", label: "HR & people" },
  { id: "marketing", label: "Marketing" },
  { id: "project", label: "Project management" },
  { id: "meetings", label: "Meetings" },
];

const TEMPLATES = [
  {
    id: "project_plan",
    emoji: "📋",
    name: "Project plan",
    category: "project",
    featured: true,
    description: "Plan, track progress, and hit milestones for any type of project. Includes a structured timeline, goals section, and status tracker.",
    author: "Atlassian",
    color: "#DEEBFF",
    uses: "80k+",
  },
  {
    id: "meeting_notes",
    emoji: "📝",
    name: "Meeting notes",
    category: "meetings",
    featured: true,
    description: "Capture decisions, action items, and discussions in a clear structure. Keep everyone aligned on what was discussed and decided.",
    author: "Atlassian",
    color: "#E3FCEF",
    uses: "120k+",
  },
  {
    id: "product_requirements",
    emoji: "🎯",
    name: "Product requirements",
    category: "product",
    featured: true,
    description: "Define the 'what' and 'why' behind your product features. Align teams on scope, goals, and success criteria before building.",
    author: "Atlassian",
    color: "#EAE6FF",
    uses: "55k+",
  },
  {
    id: "retrospective",
    emoji: "🔄",
    name: "Retrospective",
    category: "engineering",
    featured: true,
    description: "Reflect on what went well, what to improve, and action items for next sprint. A simple format your whole team can fill in together.",
    author: "Atlassian",
    color: "#FFFAE6",
    uses: "90k+",
  },
  {
    id: "team_profile",
    emoji: "👥",
    name: "Team poster",
    category: "hr",
    featured: false,
    description: "Introduce your team with roles, responsibilities, working styles, and contact info. Great for new joiners and cross-team collaboration.",
    author: "Atlassian",
    color: "#FFEBE6",
    uses: "40k+",
  },
  {
    id: "brainwriting",
    emoji: "🧠",
    name: "Brainwriting",
    category: "product",
    featured: true,
    description: "Generate ideas from everyone on your team, even the quiet ones. A structured format for silent ideation before group discussion.",
    author: "Atlassian",
    color: "#E6FCFF",
    uses: "30k+",
  },
  {
    id: "status_update",
    emoji: "📊",
    name: "Weekly status update",
    category: "project",
    featured: false,
    description: "Share progress, blockers, and plans with stakeholders in a consistent format. Keep leadership informed without long meetings.",
    author: "Atlassian",
    color: "#DEEBFF",
    uses: "65k+",
  },
  {
    id: "incident_report",
    emoji: "🚨",
    name: "Incident postmortem",
    category: "engineering",
    featured: false,
    description: "Document what happened, the root cause, and follow-up actions after an incident. Build a blameless culture of learning.",
    author: "Atlassian",
    color: "#FFEBE6",
    uses: "25k+",
  },
  {
    id: "onboarding",
    emoji: "🎉",
    name: "Employee onboarding",
    category: "hr",
    featured: false,
    description: "Give new hires a warm welcome with everything they need to get started — tools, contacts, culture, and 30/60/90 day goals.",
    author: "Atlassian",
    color: "#E3FCEF",
    uses: "45k+",
  },
  {
    id: "okr",
    emoji: "🏆",
    name: "OKRs",
    category: "project",
    featured: false,
    description: "Set and track objectives and key results for your team or company. Align work to strategy with measurable outcomes.",
    author: "Atlassian",
    color: "#FFFAE6",
    uses: "70k+",
  },
  {
    id: "design_review",
    emoji: "🎨",
    name: "Design review",
    category: "product",
    featured: false,
    description: "Structure feedback sessions with clear context, goals, and action items. Make design reviews faster and more actionable.",
    author: "Atlassian",
    color: "#EAE6FF",
    uses: "18k+",
  },
  {
    id: "campaign_brief",
    emoji: "📣",
    name: "Campaign brief",
    category: "marketing",
    featured: false,
    description: "Plan marketing campaigns with clear goals, audience, messaging, and success metrics. Keep all stakeholders aligned from day one.",
    author: "Atlassian",
    color: "#E6FCFF",
    uses: "22k+",
  },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(TEMPLATES[0].id);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory || (activeCategory === "featured" && t.featured);
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected) || filtered[0] || null;

  return (
    <div className="flex h-full bg-[#F4F5F7] dark:bg-[#161B22]">
      {/* Left panel */}
      <div className="flex flex-col w-full lg:w-[calc(100%-340px)] overflow-y-auto">
        {/* Header */}
        <div className="bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8 py-6">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-1">Templates</h1>
          <p className="text-sm text-[#6B778C] dark:text-slate-400">
            Start your page faster with a ready-made template from the Confluence community.
          </p>

          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Search templates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-9 rounded-md border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-[#172B4D] dark:text-slate-200 placeholder:text-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Categories sidebar */}
          <div className="w-52 shrink-0 bg-white dark:bg-[#1B2A3B] border-r border-[#DFE1E6] dark:border-slate-700 p-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                  activeCategory === cat.id
                    ? "bg-[#DEEBFF] text-[#0052CC] font-semibold dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Template grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="h-10 w-10 text-[#DFE1E6] mx-auto mb-3" />
                <p className="text-sm font-medium text-[#172B4D] dark:text-slate-300">No templates found</p>
                <p className="text-xs text-[#6B778C] dark:text-slate-500 mt-1">Try a different search or category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {filtered.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelected(tpl.id)}
                    className={`flex flex-col gap-3 p-4 rounded-lg border text-left transition-all group ${
                      selected === tpl.id
                        ? "border-[#0052CC] shadow-sm bg-white dark:bg-slate-800 dark:border-blue-500"
                        : "border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className="h-20 rounded-md flex items-center justify-center text-4xl"
                      style={{ backgroundColor: tpl.color }}
                    >
                      {tpl.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#172B4D] dark:text-slate-200 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                          {tpl.name}
                        </p>
                        {tpl.featured && (
                          <Star className="h-3 w-3 text-[#FF8B00] fill-[#FF8B00] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-1 line-clamp-2">
                        {tpl.description}
                      </p>
                      <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-2">
                        by {tpl.author} · {tpl.uses} uses
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right preview panel */}
      {selectedTemplate && (
        <div className="hidden lg:flex flex-col w-[340px] shrink-0 bg-white dark:bg-[#1B2A3B] border-l border-[#DFE1E6] dark:border-slate-700 overflow-y-auto">
          <div className="p-6 border-b border-[#DFE1E6] dark:border-slate-700">
            <div
              className="h-36 rounded-lg flex items-center justify-center text-6xl mb-4"
              style={{ backgroundColor: selectedTemplate.color }}
            >
              {selectedTemplate.emoji}
            </div>
            <h2 className="text-lg font-bold text-[#172B4D] dark:text-white">{selectedTemplate.name}</h2>
            <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-1">by {selectedTemplate.author} · {selectedTemplate.uses} uses</p>
          </div>

          <div className="p-6 flex-1">
            <p className="text-sm text-[#42526E] dark:text-slate-300 leading-relaxed">
              {selectedTemplate.description}
            </p>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide">What&apos;s included</p>
              <ul className="space-y-1.5">
                {[
                  "Structured page layout",
                  "Pre-filled placeholder text",
                  "Best practice sections",
                  "Customizable to your needs",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#42526E] dark:text-slate-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#0052CC] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-6 border-t border-[#DFE1E6] dark:border-slate-700 space-y-2">
            <button className="w-full h-9 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              Use template
              <ArrowRight className="h-4 w-4" />
            </button>
            <button className="w-full h-9 border border-[#DFE1E6] dark:border-slate-600 text-[#42526E] dark:text-slate-300 rounded text-sm font-medium hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
