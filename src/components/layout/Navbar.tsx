"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import {
  Moon, Sun, Search, LogOut, Settings, User as UserIcon,
  Plus, FileText, Globe, PenLine, LayoutTemplate,
  Database, Link2, Users, Loader2,
} from "lucide-react";
import NotificationDropdown from "@/components/layout/NotificationDropdown";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

interface SearchResult {
  id: string; title: string; emoji: string;
  space_id: string;
  spaces: { name: string; emoji: string } | null;
}

interface NavbarProps {
  user: User;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ── Inline search state ──
  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<SearchResult[]>([]);
  const [searchFocus, setSearchFocus] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [selected, setSelected]   = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef    = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const showDropdown = searchFocus && (query.length >= 2 || results.length > 0);

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const resp = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (resp.ok) setResults(await resp.json());
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSearchFocus(false);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function navigateToResult(result: SearchResult) {
    router.push(`/spaces/${result.space_id}/pages/${result.id}/edit`);
    setQuery("");
    setResults([]);
    setSearchFocus(false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    const flat = results;
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    else if (e.key === "Enter" && flat[selected]) { navigateToResult(flat[selected]); }
    else if (e.key === "Escape") { setSearchFocus(false); inputRef.current?.blur(); }
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.space_id]) acc[r.space_id] = [];
    acc[r.space_id].push(r);
    return acc;
  }, {});

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.push("/login");
    router.refresh();
  }

  const fullName = user.user_metadata?.full_name || user.email || "User";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <>
      <header className="h-12 border-b border-[#E8EAED] dark:border-[#30363d] bg-white dark:bg-[#161B22] flex items-center px-3 gap-2 shrink-0 z-20">

        {/* Inline search */}
        <div ref={dropdownRef} className="flex-1 max-w-2xl mx-auto relative">
          <div className={`flex items-center gap-2 px-3 h-9 rounded-md text-sm transition-colors border ${
            searchFocus
              ? "bg-white dark:bg-[#0d1117] border-[#0052CC] shadow-sm"
              : "bg-[#F1F2F4] dark:bg-[#21262d] border-transparent hover:border-[#DFE1E6] dark:hover:border-[#444]"
          }`}>
            <Search className="h-4 w-4 shrink-0 text-[#6B778C] dark:text-slate-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
              onFocus={() => setSearchFocus(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search"
              className="flex-1 bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder:text-[#6B778C] dark:placeholder:text-slate-400"
            />
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6B778C] shrink-0" />
              : !searchFocus && (
                <span className="text-xs bg-white dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#30363d] px-1.5 py-0.5 rounded text-[#6B778C] dark:text-slate-400 font-mono">⌘K</span>
              )
            }
          </div>

          {/* Dropdown results */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-lg z-50 overflow-hidden">
              {query.length < 2 ? (
                <p className="py-8 text-center text-sm text-[#6B778C]">Type at least 2 characters to search</p>
              ) : results.length === 0 && !loading ? (
                <p className="py-8 text-center text-sm text-[#6B778C]">No results for &quot;{query}&quot;</p>
              ) : (
                <div className="max-h-80 overflow-y-auto p-2">
                  {Object.entries(grouped).map(([spaceId, pages]) => {
                    const space = pages[0]?.spaces;
                    return (
                      <div key={spaceId} className="mb-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold text-[#6B778C] dark:text-slate-400">
                          <span>{space?.emoji}</span>
                          <span>{space?.name || "Space"}</span>
                        </div>
                        {pages.map((result) => {
                          const idx = results.indexOf(result);
                          return (
                            <button
                              key={result.id}
                              onMouseDown={() => navigateToResult(result)}
                              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors text-sm ${
                                idx === selected
                                  ? "bg-[#DEEBFF] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-300"
                                  : "text-[#172B4D] dark:text-slate-200 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d]"
                              }`}
                            >
                              <span className="text-base shrink-0">{result.emoji || "📄"}</span>
                              <span className="font-medium truncate">{result.title || "Untitled"}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="px-4 py-2 border-t border-[#F4F5F7] dark:border-[#30363d] flex items-center gap-4 text-xs text-[#97A0AF] dark:text-slate-500 bg-[#F7F8F9] dark:bg-[#0d1117]">
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>esc close</span>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Create button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 h-8 bg-[#0052CC] hover:bg-[#0065FF] text-white rounded text-sm font-semibold transition-colors">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Create</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide">Create</p>
              </div>
              <DropdownMenuItem onClick={() => router.push("/templates")} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#EAE6FF] flex items-center justify-center shrink-0">
                  <LayoutTemplate className="h-4 w-4 text-[#6554C0]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Start from template</p>
                  <p className="text-xs text-[#6B778C]">Ready-made page layouts</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/pages/new")} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#DEEBFF] flex items-center justify-center shrink-0">
                  <PenLine className="h-4 w-4 text-[#0052CC]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Page</p>
                  <p className="text-xs text-[#6B778C]">Blank document</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#E3FCEF] flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-[#00875A]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Live Doc</p>
                  <p className="text-xs text-[#6B778C]">Collaborative document</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#FFFAE6] flex items-center justify-center shrink-0">
                  <Database className="h-4 w-4 text-[#FF8B00]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Database</p>
                  <p className="text-xs text-[#6B778C]">Structured data table</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#FFEBE6] flex items-center justify-center shrink-0">
                  <Link2 className="h-4 w-4 text-[#DE350B]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Smart Link</p>
                  <p className="text-xs text-[#6B778C]">Link with rich preview</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setCreateSpaceOpen(true)} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                <div className="h-7 w-7 rounded bg-[#F4F5F7] flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-[#42526E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#172B4D]">Space</p>
                  <p className="text-xs text-[#6B778C]">New team workspace</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationDropdown />

          {mounted && (
            <button
              className="h-8 w-8 flex items-center justify-center text-[#42526E] dark:text-slate-400 hover:bg-[#F1F2F4] dark:hover:bg-[#21262d] rounded transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full overflow-hidden hover:ring-2 hover:ring-[#0052CC]/30 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xs bg-[#0052CC] text-white font-semibold">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-semibold truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/teams")}>
                <Users className="h-4 w-4 mr-2" /> Teams
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
