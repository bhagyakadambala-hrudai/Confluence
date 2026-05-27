"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Lock, Globe, Users, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface Permission {
  id: string;
  can_view: boolean;
  can_edit: boolean;
  user_id: string | null;
  team_id: string | null;
  profile: { id: string; full_name: string; avatar_url: string; email: string } | null;
  team: { id: string; name: string } | null;
}

interface ShareModalProps {
  pageId: string;
  spaceId: string;
  pageTitle: string;
  onClose: () => void;
}

export default function ShareModal({ pageId, spaceId, pageTitle, onClose }: ShareModalProps) {
  const [accessMode, setAccessMode] = useState<"inherit" | "restricted">("inherit");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [spaceMemberCount, setSpaceMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: "user" | "team"; id: string; label: string; sublabel: string; avatar?: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"viewer" | "editor">("viewer");
  const [spaceMembers, setSpaceMembers] = useState<{ id: string; full_name: string; email: string; avatar_url: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; member_count: number }[]>([]);

  useEffect(() => {
    loadPermissions();
    loadSpaceMembersAndTeams();
  }, []);

  async function loadPermissions() {
    setLoading(true);
    const resp = await fetch(`/api/pages/${pageId}/permissions`);
    if (resp.ok) {
      const data = await resp.json();
      setAccessMode(data.access_mode);
      setPermissions(data.permissions);
      setSpaceMemberCount(data.space_member_count);
    }
    setLoading(false);
  }

  async function loadSpaceMembersAndTeams() {
    const [membersResp, teamsResp] = await Promise.all([
      fetch(`/api/spaces/${spaceId}/members`),
      fetch("/api/teams"),
    ]);
    if (membersResp.ok) {
      const data = await membersResp.json();
      setSpaceMembers(
        (data || []).map((m: { profiles: { id: string; full_name: string; email: string; avatar_url: string } }) => m.profiles).filter(Boolean)
      );
    }
    if (teamsResp.ok) {
      setTeams(await teamsResp.json());
    }
  }

  async function handleToggleAccessMode(mode: "inherit" | "restricted") {
    setAccessMode(mode);
    const resp = await fetch(`/api/pages/${pageId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_mode: mode }),
    });
    if (!resp.ok) toast.error("Failed to update access mode");
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const lower = q.toLowerCase();
    const existingUserIds = new Set(permissions.filter(p => p.user_id).map(p => p.user_id));
    const existingTeamIds = new Set(permissions.filter(p => p.team_id).map(p => p.team_id));

    const userResults = spaceMembers
      .filter(m => !existingUserIds.has(m.id) && (m.full_name?.toLowerCase().includes(lower) || m.email?.toLowerCase().includes(lower)))
      .map(m => ({ type: "user" as const, id: m.id, label: m.full_name || m.email, sublabel: m.email, avatar: m.avatar_url }));

    const teamResults = teams
      .filter(t => !existingTeamIds.has(t.id) && t.name.toLowerCase().includes(lower))
      .map(t => ({ type: "team" as const, id: t.id, label: t.name, sublabel: `${t.member_count} members` }));

    setSearchResults([...userResults, ...teamResults]);
    setShowDropdown(true);
  }

  async function handleAddPermission(subject: { type: "user" | "team"; id: string }) {
    const body: Record<string, unknown> = {
      can_view: true,
      can_edit: selectedRole === "editor",
    };
    if (subject.type === "user") body.user_id = subject.id;
    else body.team_id = subject.id;

    const resp = await fetch(`/api/pages/${pageId}/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      toast.success("Permission added");
      setSearchQuery("");
      setShowDropdown(false);
      loadPermissions();
    } else {
      toast.error("Failed to add permission");
    }
  }

  async function handleChangeRole(permId: string, role: "viewer" | "editor") {
    const resp = await fetch(`/api/pages/${pageId}/permissions/${permId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ can_view: true, can_edit: role === "editor" }),
    });
    if (resp.ok) {
      setPermissions(prev => prev.map(p => p.id === permId ? { ...p, can_edit: role === "editor" } : p));
    }
  }

  async function handleRemovePermission(permId: string) {
    const resp = await fetch(`/api/pages/${pageId}/permissions/${permId}`, { method: "DELETE" });
    if (resp.ok) {
      setPermissions(prev => prev.filter(p => p.id !== permId));
      toast.success("Permission removed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1B2A3B] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white truncate max-w-xs">
            Share "{pageTitle}"
          </h2>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Access mode toggle */}
        <div className="px-6 py-4 border-b border-[#F4F5F7] dark:border-slate-700">
          <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 mb-3 uppercase tracking-wide">
            Who can access this page?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleToggleAccessMode("inherit")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-1 ${
                accessMode === "inherit"
                  ? "border-[#0052CC] bg-[#DEEBFF] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400"
                  : "border-[#DFE1E6] dark:border-slate-600 text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
              }`}
            >
              <Globe className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <div>Inherit space access</div>
                <div className="text-xs font-normal opacity-70">{spaceMemberCount} space members</div>
              </div>
            </button>
            <button
              onClick={() => handleToggleAccessMode("restricted")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-1 ${
                accessMode === "restricted"
                  ? "border-[#0052CC] bg-[#DEEBFF] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400"
                  : "border-[#DFE1E6] dark:border-slate-600 text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
              }`}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <div className="text-left">
                <div>Restricted</div>
                <div className="text-xs font-normal opacity-70">Only people added below</div>
              </div>
            </button>
          </div>
        </div>

        {/* Add people / teams */}
        <div className="px-6 py-4 border-b border-[#F4F5F7] dark:border-slate-700">
          <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 mb-3 uppercase tracking-wide">
            Add people or teams
          </p>
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowDropdown(true)}
                className="w-full px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1B2A3B] border border-[#DFE1E6] dark:border-slate-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleAddPermission({ type: r.type, id: r.id })}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 text-left transition-colors"
                    >
                      {r.type === "user" ? (
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarImage src={r.avatar} />
                          <AvatarFallback className="text-[9px] bg-[#0052CC] text-white">
                            {getInitials(r.label)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                          <Users className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200">{r.label}</div>
                        <div className="text-xs text-[#6B778C] dark:text-slate-400">{r.sublabel}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "viewer" | "editor")}
                className="h-full px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0052CC] appearance-none pr-7 cursor-pointer"
              >
                <option value="viewer">Can view</option>
                <option value="editor">Can edit</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Current permissions list */}
        <div className="px-6 py-4 max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-[#6B778C] dark:text-slate-400">Loading...</p>
          ) : permissions.length === 0 ? (
            <p className="text-sm text-[#6B778C] dark:text-slate-400">
              {accessMode === "inherit"
                ? "All space members can access this page."
                : "No individual permissions set. Add people or teams above."}
            </p>
          ) : (
            <ul className="space-y-1">
              {permissions.map((perm) => {
                const isTeam = !!perm.team_id;
                const label = isTeam ? perm.team?.name : (perm.profile?.full_name || perm.profile?.email || "Unknown");
                const sublabel = isTeam ? "Team" : perm.profile?.email;
                const avatar = perm.profile?.avatar_url;
                const role = perm.can_edit ? "editor" : "viewer";

                return (
                  <li key={perm.id} className="flex items-center gap-3 py-1.5">
                    {isTeam ? (
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                    ) : (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={avatar} />
                        <AvatarFallback className="text-[10px] bg-[#0052CC] text-white">
                          {getInitials(label || "")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{label}</div>
                      {sublabel && <div className="text-xs text-[#6B778C] dark:text-slate-400 truncate">{sublabel}</div>}
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={role}
                        onChange={(e) => handleChangeRole(perm.id, e.target.value as "viewer" | "editor")}
                        className="text-xs px-2 py-1 border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] appearance-none pr-6 cursor-pointer"
                      >
                        <option value="viewer">Can view</option>
                        <option value="editor">Can edit</option>
                      </select>
                      <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                    </div>
                    <button
                      onClick={() => handleRemovePermission(perm.id)}
                      className="h-7 w-7 flex items-center justify-center text-[#97A0AF] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#F4F5F7] dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
