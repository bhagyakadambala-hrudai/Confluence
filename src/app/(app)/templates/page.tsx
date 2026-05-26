"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, X, ChevronLeft, ChevronRight } from "lucide-react";
import { CONFLUENCE_TEMPLATES, TEMPLATE_CATEGORIES, type ConfluenceTemplate } from "@/components/templates/TemplateData";
import { toast } from "sonner";

export default function TemplatesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string>(CONFLUENCE_TEMPLATES[0].id);
  const [panelOpen, setPanelOpen] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);

  const displayList = CONFLUENCE_TEMPLATES.filter((t) => {
    const matchCat = activeCategory === "all" || t.category === activeCategory;
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const selectedTemplate = CONFLUENCE_TEMPLATES.find((t) => t.id === selected) ?? CONFLUENCE_TEMPLATES[0];
  const selectedIdx = displayList.findIndex((t) => t.id === selected);

  function navigate(dir: -1 | 1) {
    const next = selectedIdx + dir;
    if (next >= 0 && next < displayList.length) setSelected(displayList[next].id);
  }

  async function useTemplate(template: ConfluenceTemplate) {
    setCreating(template.id);
    try {
      const spacesResp = await fetch("/api/spaces");
      const spaces = await spacesResp.json();
      const spaceId = Array.isArray(spaces) && spaces[0]?.id;
      if (!spaceId) {
        toast.error("No spaces found. Create a space first.");
        router.push("/spaces/new");
        return;
      }
      const resp = await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: spaceId,
          title: template.name,
          content: template.htmlContent,
          emoji: template.icon,
          labels: [],
          position: 0,
        }),
      });
      if (!resp.ok) { toast.error("Failed to create page"); return; }
      const page = await resp.json();
      router.push(`/spaces/${page.space_id}/pages/${page.id}/edit`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#161B22]">
      {/* Header */}
      <div className="px-8 py-4 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">Templates</h1>
        <div className="text-sm text-[#6B778C] dark:text-slate-400">
          {displayList.length} templates
        </div>
      </div>

      {/* Category pills + search */}
      <div className="px-8 py-3 border-b border-[#DFE1E6] dark:border-slate-700 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <div className="flex items-center gap-2 px-3 h-8 rounded-full border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 mr-1">
            <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveCategory("all"); }}
              placeholder="Search templates"
              className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder:text-[#97A0AF] w-36"
            />
          </div>

          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSearch(""); }}
              className={`px-3 h-8 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeCategory === cat.id && !search
                  ? "bg-[#DEEBFF] text-[#0052CC] dark:bg-blue-900/30 dark:text-blue-400"
                  : "border border-[#DFE1E6] dark:border-slate-600 text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body: grid + preview panel */}
      <div className="flex flex-1 min-h-0">
        {/* Template grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-5">
            {displayList.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#6B778C] dark:text-slate-400">No templates match your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                    <div className="text-3xl mb-3">{tpl.icon}</div>
                    <p className="font-semibold text-sm text-[#172B4D] dark:text-slate-200 mb-1 leading-tight group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                      {tpl.name}
                    </p>
                    <p className="text-xs text-[#6B778C] dark:text-slate-400">{tpl.categoryLabel}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right preview panel */}
        {panelOpen && selectedTemplate && (
          <div className="hidden lg:flex flex-col w-[320px] shrink-0 border-l border-[#DFE1E6] dark:border-slate-700 bg-white dark:bg-[#1B2A3B]">
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

            <div className="p-5 border-b border-[#DFE1E6] dark:border-slate-700 shrink-0">
              <div className="text-4xl mb-3">{selectedTemplate.icon}</div>
              <h2 className="text-base font-bold text-[#172B4D] dark:text-white leading-tight mb-1">
                {selectedTemplate.name}
              </h2>
              <p className="text-xs text-[#6B778C] dark:text-slate-400 mb-3">{selectedTemplate.categoryLabel}</p>
              <p className="text-sm text-[#42526E] dark:text-slate-300 leading-relaxed">
                {selectedTemplate.description}
              </p>
            </div>

            <div className="px-5 py-3 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center gap-3 shrink-0">
              <button
                onClick={() => useTemplate(selectedTemplate)}
                disabled={creating === selectedTemplate.id}
                className="flex-1 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {creating === selectedTemplate.id ? "Creating..." : "Use template"}
              </button>
              <button className="h-8 w-8 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors">
                <Star className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="text-xs text-[#6B778C] dark:text-slate-400 uppercase tracking-wide font-semibold mb-3">Preview</div>
              <div
                className="prose prose-slate dark:prose-invert max-w-none"
                style={{ fontSize: "11px", lineHeight: "1.5", transform: "scale(0.88)", transformOrigin: "top left" }}
                dangerouslySetInnerHTML={{ __html: selectedTemplate.htmlContent }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
