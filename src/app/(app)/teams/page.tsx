"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Plus, X, Trash2, UserPlus, Crown, ChevronDown,
  Search, Settings, MoreHorizontal, Mail, ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getInitials } from "@/lib/utils";

interface Team {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  member_count: number;
  my_role: string;
}

interface TeamMember {
  id: string;
  role: string;
  user_id: string;
  profiles: { id: string; full_name: string; avatar_url: string; email: string } | null;
}

interface TeamDetail extends Team {
  members: TeamMember[];
  ownerProfile: { id: string; full_name: string; avatar_url: string; email: string } | null;
}

const TEAM_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-purple-500 to-pink-600",
  "from-green-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return TEAM_GRADIENTS[Math.abs(hash) % TEAM_GRADIENTS.length];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);

  useEffect(() => { loadTeams(); }, []);

  async function loadTeams() {
    setLoading(true);
    const resp = await fetch("/api/teams");
    if (resp.ok) setTeams(await resp.json());
    setLoading(false);
  }

  async function openTeam(team: Team) {
    const resp = await fetch(`/api/teams/${team.id}`);
    if (resp.ok) setSelectedTeam(await resp.json());
  }

  async function handleDelete(teamId: string) {
    const resp = await fetch(`/api/teams/${teamId}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Team deleted");
      setTeams((prev) => prev.filter((t) => t.id !== teamId));
    } else {
      toast.error("Failed to delete team");
    }
  }

  const filtered = teams.filter((t) =>
    !search || t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#1B2A3B]">
      <div className="max-w-5xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">Teams</h1>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mt-0.5">
              Collaborate with your colleagues
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create team
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 h-10 rounded-lg border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 w-72 mb-6 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC] transition-colors">
          <Search className="h-4 w-4 text-[#6B778C] shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams"
            className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] w-full"
          />
        </div>

        {/* Teams grid */}
        {loading ? (
          <div className="text-sm text-[#6B778C] text-center py-16">Loading teams…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-[#F4F5F7] dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-[#C1C7D0] dark:text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-[#172B4D] dark:text-white mb-1">No teams yet</h3>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-4 max-w-xs mx-auto">
              Create a team to collaborate with colleagues on spaces and pages
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-lg transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create your first team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onOpen={() => openTeam(team)}
                onDelete={() => handleDelete(team.id)}
              />
            ))}

            {/* Create new team card */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#DFE1E6] dark:border-slate-600 p-6 hover:border-[#0052CC] hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-700/20 transition-all group min-h-[160px]"
            >
              <div className="h-10 w-10 rounded-full bg-[#F4F5F7] dark:bg-slate-700 flex items-center justify-center mb-2 group-hover:bg-[#DEEBFF] dark:group-hover:bg-blue-900/30 transition-colors">
                <Plus className="h-5 w-5 text-[#6B778C] group-hover:text-[#0052CC] transition-colors" />
              </div>
              <p className="text-sm font-medium text-[#6B778C] dark:text-slate-400 group-hover:text-[#0052CC] transition-colors">
                Create a team
              </p>
            </button>
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <CreateTeamModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => { setShowCreateModal(false); loadTeams(); }}
        />
      )}

      {/* Team detail */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={() => { setSelectedTeam(null); loadTeams(); }}
        />
      )}
    </div>
  );
}

/* ── Team Card ── */
function TeamCard({ team, onOpen, onDelete }: { team: Team; onOpen: () => void; onDelete: () => void }) {
  const gradient = getGradient(team.name);
  const initials = team.name.slice(0, 2).toUpperCase();

  return (
    <div className="group bg-white dark:bg-[#1e2d3d] rounded-xl border border-[#DFE1E6] dark:border-slate-700 overflow-hidden hover:shadow-lg hover:border-transparent transition-all">
      {/* Banner */}
      <div className={`h-14 bg-gradient-to-r ${gradient} relative`}>
        <div className="absolute bottom-0 right-3 translate-y-1/2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="h-7 w-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 border border-[#DFE1E6] dark:border-slate-600 text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={onOpen} className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" /> Manage team
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4" /> Delete team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <button onClick={onOpen} className="w-full text-left px-4 pt-5 pb-4">
        {/* Avatar overlapping banner */}
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center -mt-10 mb-2 ring-2 ring-white dark:ring-slate-800 shadow-md`}>
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>

        <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white truncate group-hover:text-[#0052CC] transition-colors">
          {team.name}
        </h3>
        {team.description && (
          <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5 line-clamp-2">
            {team.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[#6B778C] dark:text-slate-400">
            {team.member_count} {team.member_count === 1 ? "member" : "members"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            team.my_role === "owner" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
            team.my_role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
            "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
          }`}>
            {team.my_role === "owner" ? "Owner" : team.my_role === "admin" ? "Admin" : "Member"}
          </span>
        </div>
      </button>
    </div>
  );
}

// Solid picker colors mapping to each TEAM_GRADIENTS entry
const GRADIENT_PICKER_COLORS = [
  "#3B82F6", // blue-500
  "#A855F7", // purple-500
  "#22C55E", // green-500
  "#F97316", // orange-500
  "#06B6D4", // cyan-500
  "#D946EF", // fuchsia-500
];

function getGradientIndexFromName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % TEAM_GRADIENTS.length;
}

/* ── Create Team Modal ── */
function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [selectedGradientIndex, setSelectedGradientIndex] = useState<number | null>(null);
  const [nameError, setNameError] = useState("");

  const gradientIndex = selectedGradientIndex !== null ? selectedGradientIndex : getGradientIndexFromName(name || "T");
  const gradient = TEAM_GRADIENTS[gradientIndex];
  const initials = (name || "T").slice(0, 2).toUpperCase();

  function addEmail() {
    const val = emailInput.trim().toLowerCase();
    if (!val || !val.includes("@") || emails.includes(val)) return;
    setEmails((prev) => [...prev, val]);
    setEmailInput("");
  }

  function removeEmail(email: string) {
    setEmails((prev) => prev.filter((e) => e !== email));
  }

  async function handleCreate() {
    if (!name.trim()) return;
    if (emails.length === 0) { toast.error("Add at least 1 member to create a team."); return; }
    setCreating(true);
    setNameError("");

    const resp = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim() }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      if (resp.status === 409) { setNameError(err.error || "Team name already exists."); }
      else { toast.error(err.error || "Failed to create team"); }
      setCreating(false);
      return;
    }

    const team = await resp.json();
    const results = await Promise.allSettled(
      emails.map((email) =>
        fetch(`/api/teams/${team.id}/members`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role: "member" }),
        }).then(async (r) => {
          if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(`${email}: ${e.error || "failed"}`); }
        })
      )
    );

    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected").map((r) => r.reason?.message);
    if (failed.length > 0) toast.warning(`Team created. Could not invite: ${failed.join(", ")}`);
    else toast.success(`Team created and ${emails.length} member${emails.length > 1 ? "s" : ""} invited`);

    setCreating(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-[#1B2A3B] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>

        {/* Gradient banner header */}
        <div className={`h-28 bg-gradient-to-r ${gradient} relative flex items-end px-6 pb-4`}>
          <button onClick={onClose} className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors">
            <X className="h-4 w-4" />
          </button>
          <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${gradient} border-4 border-white dark:border-[#1B2A3B] flex items-center justify-center shadow-lg translate-y-7`}>
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
        </div>

        {/* Color picker below banner */}
        <div className="flex items-center gap-2 px-6 pt-10 pb-2">
          {GRADIENT_PICKER_COLORS.map((color, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedGradientIndex(idx)}
              className="relative h-6 w-6 rounded-full transition-transform hover:scale-110 focus:outline-none"
              style={{ backgroundColor: color }}
            >
              {gradientIndex === idx && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-white/90 ring-1 ring-white/60" />
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="px-6 pb-2 space-y-3">
          {/* Team name */}
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-1.5">Team name *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. Engineering, Marketing…"
              className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${nameError ? "border-red-400 focus:ring-red-400" : "border-[#DFE1E6] dark:border-slate-600 focus:ring-[#0052CC]"}`}
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-1.5">Description <span className="font-normal text-[#97A0AF]">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this team do?"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent resize-none"
            />
          </div>

          {/* Invite members */}
          <div>
            <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-1.5">Invite members <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 h-9 rounded-lg border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-[#0052CC] focus-within:border-transparent transition-all">
                <Mail className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
                <input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
                  placeholder="Enter email address"
                  className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] w-full"
                />
              </div>
              <button onClick={addEmail} disabled={!emailInput.trim() || !emailInput.includes("@")} className="px-3 h-9 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors disabled:opacity-40">Add</button>
            </div>
            {emails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {emails.map((email) => (
                  <span key={email} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DEEBFF] dark:bg-blue-900/30 text-[#0052CC] dark:text-blue-400 text-xs font-medium rounded-full">
                    {email}
                    <button onClick={() => removeEmail(email)} className="hover:text-[#0747A6] transition-colors"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#F4F5F7] dark:border-slate-700">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={creating || !name.trim() || emails.length === 0} className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors disabled:opacity-50">
            {creating ? "Creating…" : "Create team"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Team Detail Modal ── */
function TeamDetailModal({ team, onClose }: { team: TeamDetail; onClose: () => void }) {
  const [members, setMembers] = useState<TeamMember[]>(team.members || []);
  const [activeTab, setActiveTab] = useState<"members" | "settings">("members");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("member");
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const gradient = getGradient(team.name);

  async function handleAddMember() {
    if (!addEmail.trim()) return;
    setAdding(true);
    const resp = await fetch(`/api/teams/${team.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail.trim(), role: addRole }),
    });
    if (resp.ok) {
      toast.success(`Added ${addEmail}`);
      setAddEmail("");
      const r = await fetch(`/api/teams/${team.id}/members`);
      if (r.ok) setMembers(await r.json());
    } else {
      const e = await resp.json();
      toast.error(e.error || "Failed to add member");
    }
    setAdding(false);
  }

  async function handleRemoveMember(userId: string) {
    const resp = await fetch(`/api/teams/${team.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (resp.ok) {
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
      toast.success("Member removed");
    }
  }

  async function handleDeleteTeam() {
    const resp = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    if (resp.ok) { toast.success("Team deleted"); onClose(); }
    else toast.error("Failed to delete team");
  }

  const totalCount = members.length + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-[#1B2A3B] rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden max-h-[88vh] flex flex-col">

        {/* Banner + avatar */}
        <div className={`h-24 bg-gradient-to-r ${gradient} relative shrink-0`}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Team info */}
        <div className="px-6 pb-4 shrink-0">
          <div className="flex items-end gap-4 -mt-8 mb-3">
            <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center ring-4 ring-white dark:ring-[#1B2A3B] shadow-lg shrink-0`}>
              <span className="text-white font-bold text-xl">{team.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h2 className="text-xl font-bold text-[#172B4D] dark:text-white truncate">{team.name}</h2>
              {team.description && (
                <p className="text-sm text-[#6B778C] dark:text-slate-400 mt-0.5 truncate">{team.description}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 text-sm text-[#6B778C] dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {totalCount} {totalCount === 1 ? "member" : "members"}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
              team.my_role === "owner" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
              "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}>
              {team.my_role === "owner" ? "Owner" : "Member"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#DFE1E6] dark:border-slate-700 px-6 shrink-0">
          <div className="flex gap-0">
            {(["members", "settings"] as const).filter(t => t === "members" || team.my_role === "owner").map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? "border-[#0052CC] text-[#0052CC]"
                    : "border-transparent text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "members" && (
            <div className="px-6 py-4">
              {/* Add member (owner only) */}
              {team.my_role === "owner" && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-2">+ Add member</p>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 flex-1 px-3 h-9 rounded-lg border border-[#DFE1E6] dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC] transition-colors">
                      <Mail className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
                      <input
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
                        placeholder="Invite by email address"
                        className="bg-transparent outline-none text-sm text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] w-full"
                      />
                    </div>
                    <div className="relative">
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="h-9 px-3 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none appearance-none pr-7 cursor-pointer"
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                      <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                    </div>
                    <button
                      onClick={handleAddMember}
                      disabled={adding || !addEmail.trim()}
                      className="flex items-center gap-1.5 px-3 h-9 text-sm font-semibold text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors disabled:opacity-50 shrink-0"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Invite
                    </button>
                  </div>
                </div>
              )}

              {/* Members list */}
              <div className="space-y-1">
                {/* Owner row */}
                <MemberRow
                  name={team.ownerProfile?.full_name || team.ownerProfile?.email || "Team Owner"}
                  email={team.ownerProfile?.email}
                  avatar={team.ownerProfile?.avatar_url}
                  role="owner"
                  badge="Owner"
                  badgeColor="purple"
                />
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    name={m.profiles?.full_name || m.profiles?.email || "Unknown"}
                    email={m.profiles?.email}
                    avatar={m.profiles?.avatar_url}
                    role={m.role}
                    badge={m.role === "admin" ? "Admin" : "Member"}
                    badgeColor={m.role === "admin" ? "blue" : "gray"}
                    canRemove={team.my_role === "owner"}
                    onRemove={() => handleRemoveMember(m.user_id)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "settings" && team.my_role === "owner" && (
            <div className="px-6 py-4 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white mb-1">Team details</h3>
                <p className="text-xs text-[#6B778C] dark:text-slate-400">Update your team's name and description</p>
              </div>
              <div className="border-t border-[#F4F5F7] dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-red-600 mb-1">Danger zone</h3>
                <p className="text-xs text-[#6B778C] dark:text-slate-400 mb-3">
                  Deleting a team is permanent and cannot be undone.
                </p>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete this team
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium">Are you sure?</span>
                    <button onClick={handleDeleteTeam} className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg font-semibold">Delete</button>
                    <button onClick={() => setDeleteConfirm(false)} className="px-3 py-1.5 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded-lg">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Member Row ── */
function MemberRow({
  name, email, avatar, role, badge, badgeColor, canRemove, onRemove,
}: {
  name: string; email?: string; avatar?: string;
  role: string; badge: string; badgeColor: "purple" | "blue" | "gray";
  canRemove?: boolean; onRemove?: () => void;
}) {
  const badgeClass = {
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    gray: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
  }[badgeColor];

  return (
    <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-[#F4F5F7] dark:hover:bg-slate-700/30 group transition-colors">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatar} />
        <AvatarFallback className={`text-[10px] font-bold text-white ${
          badgeColor === "purple" ? "bg-purple-500" : badgeColor === "blue" ? "bg-blue-500" : "bg-[#0052CC]"
        }`}>
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{name}</p>
        {email && <p className="text-xs text-[#6B778C] dark:text-slate-400 truncate">{email}</p>}
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeClass}`}>
        {badge}
      </span>
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="h-6 w-6 flex items-center justify-center text-[#97A0AF] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-100"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
