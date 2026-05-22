"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SearchModal from "@/components/search/SearchModal";
import { Menu, Moon, Sun, Search, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

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
      <header className="h-14 border-b border-border bg-background flex items-center px-4 gap-3 shrink-0 z-10">
        <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
          <Menu className="h-4 w-4" />
        </Button>

        <button
          onClick={() => setSearchOpen(true)}
          className="flex-1 max-w-md flex items-center gap-2 px-3 h-9 rounded-md border border-input bg-muted/40 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search className="h-4 w-4" />
          <span>Search...</span>
          <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">⌘K</span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {getInitials(fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block max-w-32 truncate">
                  {fullName}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">{fullName}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
