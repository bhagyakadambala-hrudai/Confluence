"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Lock, Users, Trash2, ChevronDown, Info, Mail } from "lucide-react";
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
  const [inheritPermission, setInheritPermission] = useState<"view" | "edit">("edit");
  const [showInheritMenu, setShowInheritMenu] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [spaceMemberCount, setSpaceMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: "user" | "team" | "invite"; id: string; label: string; sublabel: string; avatar?: string }[]>([]);
  const [inviting, setInviting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [spaceMembers, setSpaceMembers] = useState<{ id: string; full_name: string; email: string; avatar_url: string }[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string; member_count: number }[]>([]);

  const accessMenuRef = useRef<HTMLDivElement>(null);
  const inheritMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPermissions();
    loadSpaceMembersAndTeams();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) setShowAccessMenu(false);
      if (inheritMenuRef.current && !inheritMenuRef.current.contains(e.target as Node)) setShowInheritMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadPermissions() {
    setLoading(true);
    const resp = await fetch(`/api/pages/${pageId}/permissions`);
    if (resp.ok) {
      const data = await resp.json();
      setAccessMode(data.access_mode);
      setInheritPermission(data.inherit_permission || "edit");
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
      setSpaceMembers((data || []).map((m: { profiles: { id: string; full_name: string; email: string; avatar_url: string } }) => m.profiles).filter(Boolean));
    }
    if (teamsResp.ok) setTeams(await teamsResp.json());
  }

  async function handleToggleAccessMode(mode: "inherit" | "restricted") {
    setAccessMode(mode);
    setShowAccessMenu(false);
    const resp = await fetch(`/api/pages/${pageId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_mode: mode }),
    });
    if (!resp.ok) toast.error("Failed to update access");
  }

  async function handleUpdateInheritPermission(perm: "view" | "edit") {
    setInheritPermission(perm);
    setShowInheritMenu(false);
    const resp = await fetch(`/api/pages/${pageId}/permissions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inherit_permission: perm }),
    });
    if (!resp.ok) toast.error("Failed to update permission");
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const lower = q.toLowerCase();
    const existingUserIds = new Set(permissions.filter(p => p.user_id).map(p => p.user_id));
    const existingTeamIds = new Set(permissions.filter(p => p.team_id).map(p => p.team_id));
    const userResults = spaceMembers
      .filter(m => !existingUserIds.has(m.id) && (m.full_name?.toLowerCase().includes(lower) || m.email?.toLowerCase().includes(lower)))
      .map(m => ({ type: "user" as const, id: m.id, label: m.full_name || m.email, sublabel: m.email, avatar: m.avatar_url }));
    const teamResults = teams
      .filter(t => !existingTeamIds.has(t.id) && t.name.toLowerCase().includes(lower))
      .map(t => ({ type: "team" as const, id: t.id, label: t.name, sublabel: `${t.member_count} members` }));

    // If query looks like an email and no exact match found, offer to invite by email
    const isEmail = /\S+@\S+\.\S+/.test(q);
    const exactEmailMatch = spaceMembers.some(m => m.email?.toLowerCase() === lower);
    const inviteResult = isEmail && !exactEmailMatch
      ? [{ type: "invite" as const, id: q, label: q, sublabel: "Send email invitation" }]
      : [];

    setSearchResults([...userResults, ...teamResults, ...inviteResult]);
    setShowDropdown(true);
  }

  async function handleInviteByEmail(email: string) {
    setInviting(true);
    const resp = await fetch(`/api/pages/${pageId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, spaceId, can_view: true, can_edit: false }),
    });
    setInviting(false);
    if (resp.ok) {
      const data = await resp.json();
      toast.success(data.message || `Invitation sent to ${email}`);
      setSearchQuery(""); setShowDropdown(false);
      loadPermissions();
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to send invitation");
    }
  }

  async function handleAddPermission(subject: { type: "user" | "team"; id: string }) {
    const body: Record<string, unknown> = { can_view: true, can_edit: true };
    if (subject.type === "user") body.user_id = subject.id;
    else body.team_id = subject.id;
    const resp = await fetch(`/api/pages/${pageId}/permissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (resp.ok) {
      toast.success("Access granted");
      setSearchQuery(""); setShowDropdown(false);
      loadPermissions();
    } else toast.error("Failed to add");
  }

  async function handleChangeRole(permId: string, canEdit: boolean) {
    const resp = await fetch(`/api/pages/${pageId}/permissions/${permId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ can_view: true, can_edit: canEdit }),
    });
    if (resp.ok) setPermissions(prev => prev.map(p => p.id === permId ? { ...p, can_edit: canEdit } : p));
  }

  async function handleRemove(permId: string) {
    const resp = await fetch(`/api/pages/${pageId}/permissions/${permId}`, { method: "DELETE" });
    if (resp.ok) {
      setPermissions(prev => prev.filter(p => p.id !== permId));
      toast.success("Removed");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch { toast.error("Could not copy link"); }
  }

  // Suggestions: first 3 space members not already added
  const existingUserIds = new Set(permissions.filter(p => p.user_id).map(p => p.user_id));
  const suggestions = spaceMembers.filter(m => !existingUserIds.has(m.id)).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl w-full max-w-[560px] mx-4 overflow-visible border border-[#DFE1E6] dark:border-[#30363d]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">Share</h2>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-[#6B778C] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 pb-3" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Add names, teams, groups, or emails"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => searchQuery && setShowDropdown(true)}
              className="w-full px-3 py-2.5 text-sm border border-[#DFE1E6] dark:border-[#30363d] rounded-lg bg-white dark:bg-[#0d1117] text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent transition-colors"
            />
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => r.type === "invite" ? handleInviteByEmail(r.id) : handleAddPermission({ type: r.type as "user" | "team", id: r.id })}
                    disabled={inviting && r.type === "invite"}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-left transition-colors disabled:opacity-60"
                  >
                    {r.type === "user" ? (
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage src={r.avatar} />
                        <AvatarFallback className="text-[9px] bg-[#0052CC] text-white">{getInitials(r.label)}</AvatarFallback>
                      </Avatar>
                    ) : r.type === "team" ? (
                      <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-[#E3FCEF] dark:bg-green-900/30 flex items-center justify-center shrink-0">
                        <Mail className="h-3.5 w-3.5 text-[#00875A]" />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200">{r.label}</div>
                      <div className="text-xs text-[#6B778C] dark:text-slate-400">
                        {r.type === "invite" && inviting ? "Sending invitation…" : r.sublabel}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {!searchQuery && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggestions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleAddPermission({ type: "user", id: m.id })}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-[#DFE1E6] dark:border-[#30363d] text-xs text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
                >
                  <span className="text-[#0052CC]">+</span>
                  {m.full_name || m.email}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info row */}
        <div className="mx-5 mb-3 px-3 py-2.5 bg-[#F8F9FA] dark:bg-[#21262d] rounded-lg flex items-start gap-2">
          <Info className="h-4 w-4 text-[#42526E] dark:text-slate-400 shrink-0 mt-0.5" />
          <span className="text-xs text-[#42526E] dark:text-slate-400 leading-relaxed">
            {accessMode === "restricted"
              ? "Only people explicitly added above can view or edit this page."
              : "Choose the access settings to apply when publishing this page."}
          </span>
        </div>

        {/* Current permissions (if any) */}
        {!loading && permissions.length > 0 && (
          <div className="px-5 mb-2 max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {permissions.map((perm) => {
                const isTeam = !!perm.team_id;
                const label = isTeam ? perm.team?.name : (perm.profile?.full_name || perm.profile?.email || "Unknown");
                const sublabel = isTeam ? "Team" : perm.profile?.email;
                return (
                  <li key={perm.id} className="flex items-center gap-3 py-1.5">
                    {isTeam ? (
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                    ) : (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={perm.profile?.avatar_url} />
                        <AvatarFallback className="text-[10px] bg-[#0052CC] text-white">{getInitials(label || "")}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{label}</div>
                      {sublabel && <div className="text-xs text-[#6B778C] truncate">{sublabel}</div>}
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={perm.can_edit ? "editor" : "viewer"}
                        onChange={(e) => handleChangeRole(perm.id, e.target.value === "editor")}
                        className="text-xs px-2 py-1 border border-[#DFE1E6] dark:border-[#30363d] rounded bg-white dark:bg-[#0d1117] text-[#172B4D] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] appearance-none pr-6 cursor-pointer"
                      >
                        <option value="viewer">Can view</option>
                        <option value="editor">Can edit</option>
                      </select>
                      <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                    </div>
                    <button onClick={() => handleRemove(perm.id)} className="h-7 w-7 flex items-center justify-center text-[#97A0AF] hover:text-red-500 rounded transition-colors shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* General access */}
        <div className="px-5 pb-3">
          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-2">General access</p>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F4F5F7] dark:bg-[#21262d] flex items-center justify-center shrink-0">
              <Lock className="h-4 w-4 text-[#42526E] dark:text-slate-400" />
            </div>
            <div className="flex-1 min-w-0" ref={accessMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setShowAccessMenu((v) => !v)}
                  className="flex items-center gap-1 text-sm font-medium text-[#172B4D] dark:text-white hover:underline"
                >
                  {accessMode === "inherit" ? "Open" : "Restricted"}
                  <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
                <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                  {accessMode === "inherit"
                    ? `Anyone in this space (with the link)`
                    : "Only people added above"}
                </p>
                {showAccessMenu && (
                  <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => handleToggleAccessMode("inherit")}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${accessMode === "inherit" ? "bg-[#F4F5F7] dark:bg-[#21262d]" : ""}`}
                    >
                      <p className="text-sm font-medium text-[#172B4D] dark:text-white">Open</p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">Anyone in this space with the link can access</p>
                    </button>
                    <button
                      onClick={() => handleToggleAccessMode("restricted")}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${accessMode === "restricted" ? "bg-[#F4F5F7] dark:bg-[#21262d]" : ""}`}
                    >
                      <p className="text-sm font-medium text-[#172B4D] dark:text-white">Restricted</p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">Only people with explicit access can view</p>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {accessMode === "inherit" && (
              <div className="relative shrink-0" ref={inheritMenuRef}>
                <button
                  onClick={() => setShowInheritMenu((v) => !v)}
                  className="flex items-center gap-1 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
                >
                  {inheritPermission === "edit" ? "Can edit" : "Can view"}
                  <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
                {showInheritMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => handleUpdateInheritPermission("view")}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${inheritPermission === "view" ? "bg-[#F4F5F7] dark:bg-[#21262d] font-medium" : ""}`}
                    >
                      Can view
                    </button>
                    <button
                      onClick={() => handleUpdateInheritPermission("edit")}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${inheritPermission === "edit" ? "bg-[#F4F5F7] dark:bg-[#21262d] font-medium" : ""}`}
                    >
                      Can edit
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom padding */}
        <div className="pb-2" />
      </div>
    </div>
  );
}
