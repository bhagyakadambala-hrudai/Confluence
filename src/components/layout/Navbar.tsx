"use client";

import { useState, useEffect } from "react";
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
import SearchModal from "@/components/search/SearchModal";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";
import { Moon, Sun, Search, LogOut, Settings, User as UserIcon, Plus, HelpCircle, Bell, FileText, LayoutTemplate, Globe, PenLine, Database, Link2, ChevronRight } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface NavbarProps {
  user: User;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function Navbar({ user, onToggleSidebar }: NavbarProps) {
  const router = useRouter();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [createSpaceOpen, setCreateSpaceOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
      <header className="h-12 border-b border-border bg-[#0052CC] dark:bg-slate-900 flex items-center px-3 gap-2 shrink-0 z-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1.5 shrink-0 mr-2">
          <div className="h-6 w-6 bg-white rounded flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5 text-[#0052CC]" />
          </div>
          <span className="text-white font-semibold text-sm hidden sm:block">Confluence</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-0.5 mr-2">
          <Link href="/" className="px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-sm transition-colors">
            Home
          </Link>
          <button className="px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-sm transition-colors">
            Spaces
          </button>
          <button className="px-3 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded text-sm transition-colors">
            Recent
          </button>
        </nav>

        {/* Search — center */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-xl flex items-center gap-2 px-3 h-8 rounded bg-white/20 hover:bg-white/30 text-white/80 text-sm transition-colors border border-white/20"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-white/70 text-sm">Search</span>
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/60">⌘K</span>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-1 ml-2">
          {/* Create button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 h-8 bg-white text-[#0052CC] hover:bg-blue-50 rounded text-sm font-semibold transition-colors shrink-0">
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:block">Create</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 py-1">
              <div className="px-3 py-1.5">
                <p className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide">Create</p>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/templates" className="flex items-center gap-3 px-3 py-2">
                  <div className="h-7 w-7 rounded bg-[#EAE6FF] flex items-center justify-center shrink-0">
                    <LayoutTemplate className="h-4 w-4 text-[#6554C0]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#172B4D]">Start from template</p>
                    <p className="text-xs text-[#6B778C]">Ready-made page layouts</p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/pages/new" className="flex items-center gap-3 px-3 py-2">
                  <div className="h-7 w-7 rounded bg-[#DEEBFF] flex items-center justify-center shrink-0">
                    <PenLine className="h-4 w-4 text-[#0052CC]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#172B4D]">Page</p>
                    <p className="text-xs text-[#6B778C]">Blank document</p>
                  </div>
                </Link>
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

          <button className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors">
            <Bell className="h-4 w-4" />
          </button>
          <button className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors">
            <HelpCircle className="h-4 w-4" />
          </button>

          {mounted && (
            <button
              className="h-8 w-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 rounded-full overflow-hidden hover:ring-2 hover:ring-white/30 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xs bg-purple-500 text-white font-semibold">
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
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4 mr-2" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
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

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
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
