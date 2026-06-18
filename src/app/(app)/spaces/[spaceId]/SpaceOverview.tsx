"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import {
  Edit, Link2, MoreHorizontal, Star, Users,
  FileText, Trash2, Settings, Lock, X,
  ChevronDown, MoreHorizontal as More,
  Eye, Clock, Info, Grid, Copy, MoveRight, Upload, Archive, ChevronRight,
  Mail, Shield, UserCheck,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Space {
  id: string; name: string; emoji: string;
  description: string | null; owner_id: string;
}
interface Page {
  id: string; title: string; emoji: string;
  updated_at: string;
  profiles: { full_name: string; avatar_url: string } | null;
}
interface Member {
  role: string;
  profiles: { id: string; full_name: string; avatar_url: string; email: string } | null;
}

type SpaceMemberRow = {
  id?: string;
  user_id?: string;
  role: string;
  profiles: { id: string; full_name: string; avatar_url: string; email: string } | null;
};
type TeamRow = { id: string; name: string; member_count?: number };
type SearchResult = { type: "team" | "invite"; id: string; label: string; sublabel: string };

/* ── Space Share Modal ── */
function SpaceShareModal({ space, onClose }: { space: Space & { visibility?: string }; onClose: () => void }) {
  const [members, setMembers] = useState<SpaceMemberRow[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("editor");
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">(
    (space.visibility as "public" | "private") || "private"
  );
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  const accessMenuRef = useRef<HTMLDivElement>(null);
  const visibilityMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accessMenuRef.current && !accessMenuRef.current.contains(e.target as Node)) setShowAccessMenu(false);
      if (visibilityMenuRef.current && !visibilityMenuRef.current.contains(e.target as Node)) setShowVisibilityMenu(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function loadData() {
    setLoading(true);
    const [membersResp, teamsResp] = await Promise.all([
      fetch(`/api/spaces/${space.id}/members`),
      fetch("/api/teams"),
    ]);
    if (membersResp.ok) setMembers(await membersResp.json());
    if (teamsResp.ok) setTeams(await teamsResp.json());
    setLoading(false);
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    const lower = q.toLowerCase();
    const existingEmails = new Set(members.map(m => m.profiles?.email?.toLowerCase()).filter(Boolean));
    const teamResults: SearchResult[] = teams
      .filter(t => t.name.toLowerCase().includes(lower))
      .map(t => ({ type: "team", id: t.id, label: t.name, sublabel: `${t.member_count ?? 0} members` }));
    const isEmail = /\S+@\S+\.\S+/.test(q);
    const exactMatch = existingEmails.has(lower);
    const inviteResult: SearchResult[] = isEmail && !exactMatch
      ? [{ type: "invite", id: q, label: q, sublabel: "Send email invitation" }]
      : [];
    setSearchResults([...teamResults, ...inviteResult]);
    setShowDropdown(true);
  }

  async function handleAddByEmail(email: string) {
    setInviting(true);
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: selectedRole }),
    });
    setInviting(false);
    if (resp.ok) {
      const data = await resp.json();
      toast.success(data.message || data.invited ? `Invitation sent to ${email}` : "Member added");
      setSearchQuery(""); setShowDropdown(false);
      loadData();
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to add member");
    }
  }

  async function handleAddTeam(teamId: string) {
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, role: selectedRole }),
    });
    if (resp.ok) {
      const data = await resp.json();
      toast.success(data.message || "Team added");
      setSearchQuery(""); setShowDropdown(false);
      loadData();
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to add team");
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (resp.ok) {
      setMembers(prev => prev.map(m => (m.profiles?.id === userId ? { ...m, role } : m)));
    } else toast.error("Failed to update role");
  }

  async function handleRemove(userId: string) {
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (resp.ok) {
      setMembers(prev => prev.filter(m => m.profiles?.id !== userId));
      toast.success("Member removed");
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to remove member");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/spaces/${space.id}`);
      toast.success("Link copied");
    } catch { toast.error("Could not copy link"); }
  }

  async function handleUpdateVisibility(v: "public" | "private") {
    setVisibility(v);
    setShowVisibilityMenu(false);
    const resp = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: v }),
    });
    if (!resp.ok) toast.error("Failed to update visibility");
  }

  const editableMembers = members.filter(m => m.profiles && m.role !== "owner");
  const ownerRow = members.find(m => m.role === "owner");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl w-full max-w-[560px] mx-4 overflow-hidden border border-[#DFE1E6] dark:border-[#30363d]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">
            Share &ldquo;{space.name}&rdquo;
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-[#6B778C] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search + role selector */}
        <div className="px-5 pb-3" ref={searchRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Add names, teams, or emails"
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
                      onClick={() => r.type === "invite" ? handleAddByEmail(r.id) : handleAddTeam(r.id)}
                      disabled={inviting && r.type === "invite"}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] text-left transition-colors disabled:opacity-60"
                    >
                      {r.type === "team" ? (
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
            {/* Role selector for new members */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowRoleMenu(v => !v)}
                className="flex items-center gap-1 px-3 h-10 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors whitespace-nowrap"
              >
                {selectedRole === "editor" ? "Can edit" : "Can view"}
                <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
              </button>
              {showRoleMenu && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-20 overflow-hidden">
                  <button onClick={() => { setSelectedRole("editor"); setShowRoleMenu(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${selectedRole === "editor" ? "text-[#0052CC] font-medium" : "text-[#172B4D] dark:text-slate-200"}`}>Can edit</button>
                  <button onClick={() => { setSelectedRole("viewer"); setShowRoleMenu(false); }} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${selectedRole === "viewer" ? "text-[#0052CC] font-medium" : "text-[#172B4D] dark:text-slate-200"}`}>Can view</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Owner row */}
        {ownerRow?.profiles && (
          <div className="px-5 pb-1">
            <div className="flex items-center gap-3 py-1.5">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={ownerRow.profiles.avatar_url} />
                <AvatarFallback className="text-[10px] bg-[#0052CC] text-white">{getInitials(ownerRow.profiles.full_name || "O")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{ownerRow.profiles.full_name || ownerRow.profiles.email}</div>
                <div className="text-xs text-[#6B778C] truncate">{ownerRow.profiles.email}</div>
              </div>
              <span className="shrink-0 flex items-center gap-1 text-xs text-[#97A0AF] dark:text-slate-400 px-2 py-1">
                <Shield className="h-3 w-3" /> Owner
              </span>
            </div>
          </div>
        )}

        {/* Other members list */}
        {!loading && editableMembers.length > 0 && (
          <div className="px-5 pb-2 max-h-48 overflow-y-auto">
            <ul className="space-y-0.5">
              {editableMembers.map((m) => {
                if (!m.profiles) return null;
                return (
                  <li key={m.profiles.id} className="flex items-center gap-3 py-1.5">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={m.profiles.avatar_url} />
                      <AvatarFallback className="text-[10px] bg-[#0052CC] text-white">{getInitials(m.profiles.full_name || "U")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{m.profiles.full_name || m.profiles.email}</div>
                      <div className="text-xs text-[#6B778C] truncate">{m.profiles.email}</div>
                    </div>
                    <div className="relative shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => m.profiles && handleChangeRole(m.profiles.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-[#DFE1E6] dark:border-[#30363d] rounded bg-white dark:bg-[#0d1117] text-[#172B4D] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] appearance-none pr-6 cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Can edit</option>
                        <option value="viewer">Can view</option>
                      </select>
                      <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                    </div>
                    <button
                      onClick={() => m.profiles && handleRemove(m.profiles.id)}
                      className="h-7 w-7 flex items-center justify-center text-[#97A0AF] hover:text-red-500 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {loading && (
          <div className="px-5 pb-3 text-xs text-[#6B778C] dark:text-slate-400">Loading members…</div>
        )}

        {/* General access */}
        <div className="px-5 pb-3">
          <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-2">General access</p>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
              visibility === "public" ? "bg-[#DEEBFF] dark:bg-blue-900/30" : "bg-[#F4F5F7] dark:bg-[#21262d]"
            }`}>
              <Lock className={`h-4 w-4 ${visibility === "public" ? "text-[#0052CC]" : "text-[#42526E] dark:text-slate-400"}`} />
            </div>
            <div className="flex-1 min-w-0" ref={visibilityMenuRef}>
              <div className="relative">
                <button
                  onClick={() => setShowVisibilityMenu((v) => !v)}
                  className="flex items-center gap-1 text-sm font-medium text-[#172B4D] dark:text-white hover:underline"
                >
                  {visibility === "public" ? "Open" : "Restricted"}
                  <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
                </button>
                <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
                  {visibility === "public"
                    ? "Anyone in this space"
                    : "Only specific people"}
                </p>
                {showVisibilityMenu && (
                  <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-20 overflow-hidden">
                    <button
                      onClick={() => handleUpdateVisibility("public")}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors flex items-start gap-3 ${visibility === "public" ? "bg-[#F4F5F7] dark:bg-[#21262d]" : ""}`}
                    >
                      <Lock className="h-4 w-4 text-[#42526E] dark:text-slate-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[#172B4D] dark:text-white">Open</p>
                        <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">Anyone in this space</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleUpdateVisibility("private")}
                      className={`w-full text-left px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors flex items-start gap-3 ${visibility === "private" ? "bg-[#F4F5F7] dark:bg-[#21262d]" : ""}`}
                    >
                      <Lock className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-[#172B4D] dark:text-white">Restricted</p>
                        <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">Only specific people can view or edit</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
            {/* Role for general access — matches selectedRole for new members */}
            <div className="relative shrink-0" ref={accessMenuRef}>
              <button
                onClick={() => setShowAccessMenu((v) => !v)}
                className="flex items-center gap-1 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
              >
                {selectedRole === "editor" ? "Can edit" : "Can view"}
                <ChevronDown className="h-3.5 w-3.5 text-[#6B778C]" />
              </button>
              {showAccessMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1e2636] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={() => { setSelectedRole("editor"); setShowAccessMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${selectedRole === "editor" ? "bg-[#F4F5F7] dark:bg-[#21262d] font-medium" : ""}`}
                  >Can edit</button>
                  <button
                    onClick={() => { setSelectedRole("viewer"); setShowAccessMenu(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors ${selectedRole === "viewer" ? "bg-[#F4F5F7] dark:bg-[#21262d] font-medium" : ""}`}
                  >Can view</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Member count summary */}
        {!loading && members.length > 0 && (
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 text-xs text-[#6B778C] dark:text-slate-400">
              <UserCheck className="h-3.5 w-3.5" />
              {members.length} {members.length === 1 ? "person has" : "people have"} access to this space
            </div>
          </div>
        )}

        {/* Divider + Copy link */}
        <div className="border-t border-[#F4F5F7] dark:border-[#30363d]" />
        <button
          onClick={copyLink}
          className="flex items-center gap-2.5 w-full px-5 py-3.5 text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
        >
          <Link2 className="h-4 w-4 text-[#42526E] dark:text-slate-400" />
          Copy link
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function SpaceOverview({
  space, pages, members, currentUserId,
}: {
  space: Space; pages: Page[]; members: Member[]; currentUserId: string;
}) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  async function handleStar() {
    const resp = await fetch("/api/stars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "space", id: space.id }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setIsStarred(data.starred);
      toast.success(data.starred ? "Space starred" : "Star removed");
    }
  }

  async function handleArchive() {
    const resp = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    if (resp.ok) { toast.success("Space archived"); router.push("/spaces"); }
    else toast.error("Failed to archive space");
  }

  async function handleDelete() {
    if (!confirm(`Move "${space.name}" to Trash?`)) return;
    const resp = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "trashed" }),
    });
    if (resp.ok) { toast.success("Space moved to Trash"); router.push("/spaces"); }
    else toast.error("Failed to delete");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/spaces/${space.id}`);
    toast.success("Link copied");
  }

  const currentMember = members.find(m => m.profiles?.id === currentUserId);

  return (
    <>
    <div className="flex flex-col min-h-full bg-white dark:bg-[#161B22]">

      {/* ── Breadcrumb bar ── */}
      <div className="flex items-center justify-between px-6 h-12 border-b border-[#E8EAED] dark:border-[#30363d] shrink-0">
        <span className="text-sm font-medium text-[#172B4D] dark:text-slate-300">{space.name}</span>
        <div className="flex items-center gap-1.5">
          {currentMember?.profiles && (
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={currentMember.profiles.avatar_url} />
              <AvatarFallback className="text-xs bg-[#0052CC] text-white font-semibold">
                {getInitials(currentMember.profiles.full_name || "U")}
              </AvatarFallback>
            </Avatar>
          )}
          <Link
            href={`/spaces/${space.id}/edit`}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Edit className="h-3.5 w-3.5" /> Edit
          </Link>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#172B4D] dark:text-slate-200 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Lock className="h-3.5 w-3.5" /> Share
          </button>
          <button
            onClick={copyLink}
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400"
          >
            <Link2 className="h-4 w-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors text-[#42526E] dark:text-slate-400">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleStar} className="flex items-center gap-2 cursor-pointer">
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                Star space
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
                <Copy className="h-4 w-4" /> Make a copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 data-[state=open]:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Archive and delete
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  <DropdownMenuItem onClick={handleArchive} className="flex items-center gap-2 cursor-pointer">
                    <Archive className="h-4 w-4" /> Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                    <Trash2 className="h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Hero banner ── */}
      <div className="relative shrink-0">
        <div className="h-44 w-full bg-gradient-to-r from-[#00B8D9] via-[#0052CC] to-[#1A237E]" />
        {/* Space icon */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <div className="h-20 w-20 rounded-2xl bg-[#0052CC] flex items-center justify-center shadow-xl border-4 border-white dark:border-[#161B22]">
            {space.emoji ? (
              <span className="text-4xl">{space.emoji}</span>
            ) : (
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-white" fill="currentColor">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* ── Space name ── */}
      <div className="flex flex-col items-center pt-14 pb-6 px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-[#172B4D] dark:text-white">{space.name}</h1>
          <button
            onClick={() => {}}
            className="flex items-center justify-center h-8 w-8 rounded border border-[#DFE1E6] dark:border-[#30363d] text-[#42526E] dark:text-slate-400 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
          >
            <Users className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 pb-16">

          {/* Description / rich content */}
          <section className="mb-8">
            {space.description && space.description.startsWith("<") ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-[#172B4D] dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(space.description) }}
              />
            ) : (
              <>
                <h2 className="text-lg font-semibold text-[#172B4D] dark:text-white mb-3">Description</h2>
                <div className="bg-[#F4F5F7] dark:bg-[#21262d] rounded px-4 py-3 text-sm text-[#6B778C] dark:text-slate-400">
                  {space.description || "In a sentence or two, describe the purpose of this space."}
                </div>
              </>
            )}
          </section>


        </div>
      </div>
    </div>

    {showShareModal && (
      <SpaceShareModal
        space={space}
        onClose={() => setShowShareModal(false)}
      />
    )}
    </>
  );
}
