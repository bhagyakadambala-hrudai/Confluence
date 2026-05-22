"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, FileText, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  emoji: string;
  space_id: string;
  spaces: { name: string; emoji: string } | null;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const resp = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (resp.ok) setResults(await resp.json());
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  function navigate(result: SearchResult) {
    router.push(`/spaces/${result.space_id}/pages/${result.id}`);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      navigate(results[selected]);
    }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    const spaceId = r.space_id;
    if (!acc[spaceId]) acc[spaceId] = [];
    acc[spaceId].push(r);
    return acc;
  }, {});

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search pages..."
            className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base"
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.length < 2 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(grouped).map(([spaceId, pages]) => {
                const space = pages[0]?.spaces;
                return (
                  <div key={spaceId} className="mb-3">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-muted-foreground">
                      <span>{space?.emoji}</span>
                      <span>{space?.name || "Space"}</span>
                    </div>
                    {pages.map((result) => {
                      const globalIdx = results.indexOf(result);
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigate(result)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${globalIdx === selected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
                        >
                          <span className="text-base shrink-0">{result.emoji || "📄"}</span>
                          <span className="text-sm font-medium truncate">{result.title || "Untitled"}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
