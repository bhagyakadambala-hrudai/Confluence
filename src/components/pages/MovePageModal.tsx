"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronRight, Search, FileText } from "lucide-react";
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
  parent_id: string | null;
}

interface MovePageModalProps {
  pageId: string;
  currentSpaceId: string;
  onClose: () => void;
}

type TabType = "browse" | "search";

interface TreeNode extends Page {
  children: TreeNode[];
}

function buildTree(pages: Page[], parentId: string | null): TreeNode[] {
  return pages
    .filter((p) => p.parent_id === parentId)
    .map((p) => ({ ...p, children: buildTree(pages, p.id) }));
}

function PageTreeNode({
  node,
  depth,
  pageId,
  selectedParentId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  pageId: string;
  selectedParentId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const isCurrent = node.id === pageId;
  const isSelected = selectedParentId === node.id;
  const hasChildren = node.children.length > 0;

  return (
    <>
      <button
        disabled={isCurrent}
        onClick={() => !isCurrent && onSelect(isSelected ? null : node.id)}
        className={`w-full text-left flex items-center gap-1 py-1.5 pr-3 text-sm transition-colors rounded ${
          isCurrent
            ? "text-[#0052CC] bg-[#DEEBFF] cursor-default"
            : isSelected
            ? "bg-[#DEEBFF] text-[#0052CC]"
            : "text-[#42526E] hover:bg-[#F4F5F7]"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span
          className="shrink-0 w-4 h-4 flex items-center justify-center"
          onClick={(e) => {
            if (!hasChildren) return;
            e.stopPropagation();
            setExpanded((v) => !v);
          }}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#6B778C]" />
            )
          ) : null}
        </span>
        <span className="shrink-0 text-sm">{node.emoji || "📄"}</span>
        <span className="truncate">{node.title || "Untitled"}</span>
      </button>
      {expanded &&
        hasChildren &&
        node.children.map((child) => (
          <PageTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            pageId={pageId}
            selectedParentId={selectedParentId}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

export default function MovePageModal({ pageId, currentSpaceId, onClose }: MovePageModalProps) {
  const router = useRouter();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState(currentSpaceId);
  const [selectedParentId, setSelectedParentId] = useState<string | null | "ROOT">(null);
  const [activeTab, setActiveTab] = useState<TabType>("browse");
  const [search, setSearch] = useState("");
  const [spaceDropdownOpen, setSpaceDropdownOpen] = useState(false);
  const [moving, setMoving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/spaces")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSpaces);
  }, []);

  useEffect(() => {
    if (selectedSpaceId) {
      fetch(`/api/pages?space_id=${selectedSpaceId}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Page[]) => setPages(data || []));
    }
  }, [selectedSpaceId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSpaceDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId);
  const tree = buildTree(pages.filter((p) => p.id !== pageId), null);

  // "ROOT" means move to root of space (no parent), null means nothing selected yet
  const isLocationChanged = selectedSpaceId !== currentSpaceId || selectedParentId !== null;

  async function handleContinue() {
    setMoving(true);
    const body: { space_id: string; parent_id: string | null } = {
      space_id: selectedSpaceId,
      parent_id: selectedParentId === "ROOT" ? null : (selectedParentId as string | null),
    };
    const resp = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      const page = await resp.json() as Page;
      toast.success("Page moved successfully");
      router.push(`/spaces/${page.space_id}/pages/${page.id}/edit`);
      onClose();
    } else {
      toast.error("Failed to move page");
    }
    setMoving(false);
  }

  const searchResults = search
    ? pages.filter(
        (p) =>
          p.id !== pageId &&
          (p.title || "Untitled").toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6]">
          <h2 className="font-semibold text-[#172B4D]">Move</h2>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] transition-colors"
          >
            <X className="h-4 w-4 text-[#6B778C]" />
          </button>
        </div>

        <p className="px-5 pt-4 pb-2 text-sm text-[#6B778C]">
          Select a destination space and location, then click Continue.
        </p>

        {/* Tabs */}
        <div className="flex border-b border-[#DFE1E6] px-5">
          {(["browse", "search"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? "border-[#0052CC] text-[#0052CC]"
                  : "border-transparent text-[#6B778C] hover:text-[#172B4D]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {activeTab === "browse" ? (
            <>
              {/* Space selector */}
              <div>
                <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">
                  Select space <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setSpaceDropdownOpen((v) => !v)}
                    className={`w-full border rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-[#172B4D] transition-colors ${
                      spaceDropdownOpen ? "border-[#0052CC]" : "border-[#DFE1E6] hover:border-[#0052CC]"
                    }`}
                  >
                    <span className="flex items-center gap-2 flex-1 min-w-0">
                      <span>{selectedSpace?.emoji ?? "🌐"}</span>
                      <span className="truncate">{selectedSpace?.name ?? "Select a space"}</span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-[#6B778C] shrink-0" />
                  </button>

                  {spaceDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#DFE1E6] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      <p className="px-3 py-2 text-xs font-semibold text-[#6B778C] uppercase tracking-wide">
                        Recent spaces
                      </p>
                      {spaces.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            setSelectedSpaceId(s.id);
                            setSelectedParentId(null);
                            setSpaceDropdownOpen(false);
                          }}
                          className={`w-full text-left flex items-center gap-2 px-3 py-2.5 text-sm transition-colors hover:bg-[#F4F5F7] ${
                            s.id === selectedSpaceId ? "bg-[#DEEBFF] text-[#0052CC]" : "text-[#172B4D]"
                          }`}
                        >
                          <span>{s.emoji}</span>
                          <span className="truncate">{s.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Page tree */}
              <div>
                <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">
                  Location
                </label>
                <div className="border border-[#DFE1E6] rounded-lg max-h-56 overflow-y-auto py-1">
                  {/* Space root option */}
                  <button
                    onClick={() => setSelectedParentId(selectedParentId === "ROOT" ? null : "ROOT")}
                    className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm transition-colors rounded ${
                      selectedParentId === "ROOT"
                        ? "bg-[#DEEBFF] text-[#0052CC]"
                        : "text-[#172B4D] hover:bg-[#F4F5F7]"
                    }`}
                  >
                    <span className="w-4" />
                    <span className="shrink-0">{selectedSpace?.emoji ?? "🌐"}</span>
                    <span className="font-medium truncate">{selectedSpace?.name ?? "Space root"}</span>
                  </button>

                  {tree.length === 0 ? (
                    <p className="px-8 py-3 text-sm text-[#97A0AF]">No other pages in this space</p>
                  ) : (
                    tree.map((node) => (
                      <PageTreeNode
                        key={node.id}
                        node={node}
                        depth={1}
                        pageId={pageId}
                        selectedParentId={typeof selectedParentId === "string" && selectedParentId !== "ROOT" ? selectedParentId : null}
                        onSelect={(id) => setSelectedParentId(id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Search tab */
            <div>
              <div className="flex items-center gap-2 border border-[#DFE1E6] rounded-lg px-3 py-2.5 focus-within:border-[#0052CC] transition-colors">
                <Search className="h-4 w-4 text-[#6B778C] shrink-0" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search pages..."
                  className="flex-1 bg-transparent outline-none text-sm text-[#172B4D] placeholder:text-[#97A0AF]"
                />
              </div>
              {search && (
                <div className="mt-2 border border-[#DFE1E6] rounded-lg max-h-56 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-[#97A0AF] text-center">No pages found</p>
                  ) : (
                    searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() =>
                          setSelectedParentId(selectedParentId === p.id ? null : p.id)
                        }
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          selectedParentId === p.id
                            ? "bg-[#DEEBFF] text-[#0052CC]"
                            : "text-[#42526E] hover:bg-[#F4F5F7]"
                        }`}
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-[#6B778C]" />
                        <span className="truncate">{p.title || "Untitled"}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#DFE1E6]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#42526E] hover:bg-[#F4F5F7] rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!isLocationChanged || moving}
            className={`px-4 py-2 text-sm text-white rounded font-semibold transition-colors ${
              isLocationChanged && !moving
                ? "bg-[#0052CC] hover:bg-[#0065FF]"
                : "bg-[#0052CC] opacity-40 cursor-not-allowed"
            }`}
          >
            {moving ? "Moving..." : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
