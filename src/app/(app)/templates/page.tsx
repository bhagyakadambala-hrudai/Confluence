"use client";

import { useState } from "react";
import {
  Search, Star, ChevronDown, Link2, X, ExternalLink,
  CheckSquare, Users, FileText, User, ClipboardList,
  HelpCircle, Target, Megaphone, BarChart2, UserCircle,
  ChevronLeft, ChevronRight,
} from "lucide-react";

/* ── Template icon: colored square + white lucide icon ── */
function TplIcon({ bg, icon, size = "md" }: { bg: string; icon: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  const sz = size === "lg" ? "h-12 w-12 rounded-xl text-2xl" : size === "sm" ? "h-8 w-8 rounded text-base" : "h-10 w-10 rounded-lg text-xl";
  return (
    <div className={`${sz} flex items-center justify-center shrink-0 text-white`} style={{ backgroundColor: bg }}>
      {icon}
    </div>
  );
}

/* ── Tiny template preview ── */
function TemplatePreviewMini({ bg }: { bg: string }) {
  return (
    <div className="rounded border border-[#E8EAED] dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div className="h-1.5" style={{ backgroundColor: bg }} />
      <div className="p-3 space-y-2">
        <div className="h-2 bg-[#172B4D] dark:bg-slate-300 rounded w-3/5 opacity-70" />
        <table className="w-full border-collapse text-[9px]">
          {[["Driver", "@ mention"], ["Approver", "@ approver"], ["Objective", "Summarize…"], ["Status", ""]].map(([k, v], i) => (
            <tr key={k} className={i % 2 === 0 ? "bg-[#F4F5F7] dark:bg-slate-800" : ""}>
              <td className="py-0.5 px-1 font-semibold text-[#6B778C] border border-[#DFE1E6] dark:border-slate-700 w-2/5">{k}</td>
              <td className="py-0.5 px-1 text-[#97A0AF] border border-[#DFE1E6] dark:border-slate-700">
                {k === "Status" ? (
                  <div className="flex gap-0.5">
                    <span className="bg-[#F4F5F7] text-[#6B778C] px-0.5 rounded font-bold" style={{ fontSize: 7 }}>NOT STARTED</span>
                    <span className="text-[#DFE1E6]">/</span>
                    <span className="bg-[#DEEBFF] text-[#0052CC] px-0.5 rounded font-bold" style={{ fontSize: 7 }}>IN PROGRESS</span>
                    <span className="text-[#DFE1E6]">/</span>
                    <span className="bg-[#E3FCEF] text-[#00875A] px-0.5 rounded font-bold" style={{ fontSize: 7 }}>COMPLETE</span>
                  </div>
                ) : v}
              </td>
            </tr>
          ))}
        </table>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#0052CC]" />
            <div className="h-1 bg-[#DFE1E6] dark:bg-slate-700 rounded w-full" />
          </div>
          <div className="h-1 bg-[#DFE1E6] dark:bg-slate-700 rounded w-4/5 ml-2.5" />
          <div className="h-1 bg-[#DFE1E6] dark:bg-slate-700 rounded w-3/5 ml-2.5" />
        </div>
      </div>
    </div>
  );
}

/* ── Data ── */
const CATEGORY_PILLS = [
  { id: "my", label: "My Templates", icon: "⭐" },
  { id: "featured", label: "Featured", icon: "🏆", count: 5 },
  { id: "popular", label: "Popular", icon: "🔥", count: 15 },
  { id: "promoted", label: "Promoted", count: 5 },
  { id: "customer_support", label: "Customer Support", count: 9 },
  { id: "design", label: "Design", count: 16 },
  { id: "documentation", label: "Documentation", count: 27 },
  { id: "finance", label: "Finance", count: 10 },
  { id: "hr", label: "Human Resources", count: 16 },
  { id: "it", label: "IT", count: 17 },
  { id: "legal", label: "Legal", count: 8 },
  { id: "marketing", label: "Marketing", count: 20 },
  { id: "meetings", label: "Meetings", count: 15 },
  { id: "operations", label: "Operations", count: 13 },
  { id: "personal", label: "Personal", count: 15 },
  { id: "product", label: "Product Management", count: 19 },
  { id: "project_mgmt", label: "Project Management", count: 15 },
  { id: "project_planning", label: "Project Planning", count: 27 },
  { id: "research", label: "Research", count: 8 },
  { id: "sales", label: "Sales", count: 20 },
  { id: "software", label: "Software", count: 19 },
  { id: "strategy", label: "Strategy", count: 25 },
  { id: "teamwork", label: "Teamwork", count: 37 },
];

interface Template {
  id: string;
  bg: string;
  name: string;
  category: string;
  featured: boolean;
  popular: boolean;
  icon: React.ReactNode;
  description: string;
}

const TEMPLATES: Template[] = [
  { id: "project_plan", bg: "#F7B900", name: "Project plan", category: "project_planning", featured: true, popular: true, icon: <CheckSquare className="h-5 w-5" />, description: "Define, scope, and plan milestones for your next project. Align your team on goals, timeline, and deliverables." },
  { id: "meeting_notes", bg: "#00B8D9", name: "Meeting notes", category: "meetings", featured: true, popular: true, icon: <Users className="h-5 w-5" />, description: "Capture key decisions, action items, and discussion points from any meeting." },
  { id: "status_report", bg: "#0052CC", name: "End of week status report", category: "project_planning", featured: false, popular: true, icon: <FileText className="h-5 w-5" />, description: "Share weekly progress, blockers, and upcoming plans with your stakeholders." },
  { id: "one_on_one", bg: "#0052CC", name: "1-on-1 Meeting", category: "meetings", featured: false, popular: true, icon: <User className="h-5 w-5" />, description: "Structure regular check-ins with agenda, talking points, and follow-up actions." },
  { id: "retrospective", bg: "#00875A", name: "4 Ls Retrospective", category: "meetings", featured: true, popular: true, icon: <ClipboardList className="h-5 w-5" />, description: "Reflect on what was Liked, Learned, Lacked, and Longed for as a team." },
  { id: "five_whys", bg: "#0065FF", name: "5 Whys Analysis", category: "strategy", featured: false, popular: true, icon: <HelpCircle className="h-5 w-5" />, description: "Identify root causes of problems by asking 'why' five times." },
  { id: "ninety_day", bg: "#36B37E", name: "90-day plan", category: "project_planning", featured: false, popular: true, icon: <Target className="h-5 w-5" />, description: "Plan your first 30, 60, and 90 days in a new role or project." },
  { id: "all_hands", bg: "#6554C0", name: "All hands meeting", category: "meetings", featured: false, popular: true, icon: <Megaphone className="h-5 w-5" />, description: "Structured agenda and follow-ups for company-wide all-hands meetings." },
  { id: "product_req", bg: "#FF8B00", name: "Product requirements", category: "product", featured: true, popular: false, icon: <Target className="h-5 w-5" />, description: "Define features with clear requirements, scope, and success criteria before building." },
  { id: "okr", bg: "#00875A", name: "OKRs", category: "strategy", featured: true, popular: false, icon: <BarChart2 className="h-5 w-5" />, description: "Set and track objectives and key results to align your team to company strategy." },
  { id: "team_profile", bg: "#6554C0", name: "Team poster", category: "hr", featured: false, popular: false, icon: <UserCircle className="h-5 w-5" />, description: "Introduce your team with roles, responsibilities, contacts, and working styles." },
  { id: "campaign_brief", bg: "#FF5630", name: "Campaign brief", category: "marketing", featured: false, popular: false, icon: <Megaphone className="h-5 w-5" />, description: "Plan marketing campaigns with goals, target audience, and messaging framework." },
];

/* ── Page component ── */
export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("popular");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>("project_plan");
  const [showAllCats, setShowAllCats] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const firstRowCats = CATEGORY_PILLS.slice(0, 8);
  const secondRowCats = CATEGORY_PILLS.slice(8);
  const visibleCats = showAllCats ? CATEGORY_PILLS : firstRowCats;

  const filtered = TEMPLATES.filter((t) => {
    const matchCat =
      activeCategory === "my"
        ? false
        : activeCategory === "featured"
        ? t.featured
        : activeCategory === "popular"
        ? t.popular
        : activeCategory === "promoted"
        ? t.featured
        : t.category === activeCategory;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    return (search ? matchSearch : matchCat || search) || (search && matchSearch);
  });

  const displayList = search
    ? TEMPLATES.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()))
    : filtered.length > 0
    ? filtered
    : TEMPLATES;

  const selectedTemplate = TEMPLATES.find((t) => t.id === selected) ?? TEMPLATES[0];
  const selectedIdx = displayList.findIndex((t) => t.id === selected);

  function navigate(dir: -1 | 1) {
    const next = selectedIdx + dir;
    if (next >= 0 && next < displayList.length) setSelected(displayList[next].id);
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22]">
      {/* ── Header ── */}
      <div className="px-8 py-4 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">Templates</h1>
          <button className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F4F5F7] dark:bg-slate-700 rounded text-sm text-[#172B4D] dark:text-slate-300 hover:bg-[#DFE1E6] dark:hover:bg-slate-600 transition-colors">
            <span>📋</span>
            <span className="font-medium">My first space</span>
            <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
          </button>
        </div>
        <button className="px-3 py-1.5 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
          Manage templates
        </button>
      </div>

      {/* ── Category pills ── */}
      <div className="px-8 py-3 border-b border-[#DFE1E6] dark:border-slate-700 shrink-0">
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Search pill */}
          <div className="flex items-center gap-2 px-3 h-8 rounded-full border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800">
            <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates"
              className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder:text-[#97A0AF] w-32"
            />
          </div>

          {visibleCats.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
              className={`flex items-center gap-1 px-3 h-8 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id && !search
                  ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/30 dark:text-blue-400"
                  : "border border-[#DFE1E6] dark:border-slate-600 text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
              }`}
            >
              {cat.icon && <span className="text-xs">{cat.icon}</span>}
              {cat.label}
              {cat.count !== undefined && (
                <span className="text-xs text-[#6B778C] dark:text-slate-500 ml-0.5">{cat.count}</span>
              )}
            </button>
          ))}

          <button
            onClick={() => setShowAllCats(!showAllCats)}
            className="flex items-center gap-1 px-2.5 h-8 rounded-full border border-[#DFE1E6] dark:border-slate-600 text-sm text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
            title={showAllCats ? "Show fewer" : "Show more"}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllCats ? "rotate-180" : ""}`} />
          </button>

          <div className="ml-auto">
            <button className="flex items-center gap-1 px-3 h-8 rounded-full border border-[#DFE1E6] dark:border-slate-600 text-sm text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors">
              Recommended <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Body: grid + preview panel ── */}
      <div className="flex flex-1 min-h-0">
        {/* Template grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-5">
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-4">
              Displaying all{" "}
              <span className="font-semibold text-[#172B4D] dark:text-slate-200">{displayList.length}</span>{" "}
              templates.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {displayList.map((tpl) => (
                <div
                  key={tpl.id}
                  onMouseEnter={() => { setSelected(tpl.id); setPanelOpen(true); }}
                  onClick={() => { setSelected(tpl.id); setPanelOpen(true); }}
                  className={`group relative rounded-lg border p-5 cursor-pointer transition-all ${
                    selected === tpl.id && panelOpen
                      ? "border-[#0052CC] shadow-md dark:border-blue-500 bg-white dark:bg-slate-800"
                      : "border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm bg-white dark:bg-slate-800"
                  }`}
                >
                  {/* Hover actions */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Link2 className="h-3.5 w-3.5 text-[#6B778C]" />
                    </button>
                    <button className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <Star className="h-3.5 w-3.5 text-[#6B778C]" />
                    </button>
                  </div>

                  <TplIcon bg={tpl.bg} icon={tpl.icon} />
                  <p className="font-semibold text-sm text-[#172B4D] dark:text-slate-200 mt-3 mb-1 group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors leading-tight">
                    {tpl.name}
                  </p>
                  <p className="text-xs text-[#6B778C] dark:text-slate-400 capitalize">
                    {tpl.category.replace(/_/g, " ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right preview panel ── */}
        {panelOpen && selectedTemplate && (
          <div className="hidden lg:flex flex-col w-[320px] shrink-0 border-l border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B]">
            {/* Nav row */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#DFE1E6] dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => navigate(-1)}
                  disabled={selectedIdx <= 0}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 text-[#6B778C]" />
                </button>
                <button
                  onClick={() => navigate(1)}
                  disabled={selectedIdx >= displayList.length - 1}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4 text-[#6B778C]" />
                </button>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-4 w-4 text-[#6B778C]" />
              </button>
            </div>

            {/* Template meta */}
            <div className="p-5 border-b border-[#DFE1E6] dark:border-slate-700 shrink-0">
              <div className="flex items-start gap-3 mb-3">
                <TplIcon bg={selectedTemplate.bg} icon={selectedTemplate.icon} size="lg" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-[#172B4D] dark:text-white leading-tight">
                      {selectedTemplate.name}
                    </h2>
                    <div className="flex items-center gap-1">
                      <button className="h-5 w-5 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors">
                        <Link2 className="h-3.5 w-3.5" />
                      </button>
                      <button className="h-5 w-5 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white transition-colors">
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-sm text-[#42526E] dark:text-slate-300 leading-relaxed">
                {selectedTemplate.description}
              </p>
            </div>

            {/* CTA row */}
            <div className="px-5 py-3 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center gap-3 shrink-0">
              <button className="flex-1 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded text-sm font-semibold transition-colors">
                Use template
              </button>
              <button className="h-8 px-3 text-sm text-[#0052CC] dark:text-blue-400 hover:bg-[#DEEBFF] dark:hover:bg-blue-900/20 rounded transition-colors flex items-center gap-1 font-medium">
                Learn more <ExternalLink className="h-3 w-3" />
              </button>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-5">
              <TemplatePreviewMini bg={selectedTemplate.bg} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
