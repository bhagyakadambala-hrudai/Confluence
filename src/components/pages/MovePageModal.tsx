"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Space {
  id: string;
  name: string;
  emoji: string;
}

interface Page {
  id: string;
  title: string;
  emoji: string;
  space_id: string;
}

interface MovePageModalProps {
  pageId: string;
  currentSpaceId: string;
  onClose: () => void;
}

export default function MovePageModal({ pageId, currentSpaceId, onClose }: MovePageModalProps) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(currentSpaceId);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpaces);
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      fetch(`/api/pages?space_id=${selectedSpaceId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setPages((data || []).filter((p: Page) => p.id !== pageId)));
    }
  }, [selectedSpaceId, pageId]);

  async function handleMove() {
    setMoving(true);
    const resp = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        space_id: selectedSpaceId,
        parent_id: selectedParentId,
      }),
    });
    if (resp.ok) {
      const page = await resp.json();
      toast.success("Page moved successfully");
      router.push(`/spaces/${page.space_id}/pages/${page.id}`);
      onClose();
    } else {
      toast.error("Failed to move page");
    }
    setMoving(false);
  }

  const filteredPages = pages.filter(
    (p) => !search || (p.title || "Untitled").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
          <h2 className="font-semibold text-[#172B4D] dark:text-white">Move page</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4 text-[#6B778C]" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              Space
            </label>
            <select
              value={selectedSpaceId}
              onChange={(e) => {
                setSelectedSpaceId(e.target.value);
                setSelectedParentId(null);
              }}
              className="w-full px-3 py-2 border border-[#DFE1E6] dark:border-slate-600 rounded text-sm text-[#172B4D] dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:border-[#0052CC]"
            >
              {spaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              Parent page (optional)
            </label>
            <div className="border border-[#DFE1E6] dark:border-slate-600 rounded overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-[#DFE1E6] dark:border-slate-600">
                <Search className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder:text-[#97A0AF]"
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                <button
                  onClick={() => setSelectedParentId(null)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#F4F5F7] dark:hover:bg-slate-700 ${
                    selectedParentId === null
                      ? "bg-[#DEEBFF] dark:bg-blue-900/20 text-[#0052CC]"
                      : "text-[#42526E] dark:text-slate-300"
                  }`}
                >
                  <span className="text-[#97A0AF]">—</span>
                  <span>No parent (top-level)</span>
                </button>
                {filteredPages.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedParentId(p.id)}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-[#F4F5F7] dark:hover:bg-slate-700 ${
                      selectedParentId === p.id
                        ? "bg-[#DEEBFF] dark:bg-blue-900/20 text-[#0052CC]"
                        : "text-[#42526E] dark:text-slate-300"
                    }`}
                  >
                    <span>{p.emoji || "📄"}</span>
                    <span className="truncate">{p.title || "Untitled"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#DFE1E6] dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleMove}
            disabled={moving}
            className="px-4 py-2 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors disabled:opacity-50"
          >
            {moving ? "Moving..." : "Move"}
          </button>
        </div>
      </div>
    </div>
  );
}
