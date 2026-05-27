"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users, Plus, X, Trash2, UserPlus, Crown, ChevronDown,
} from "lucide-react";
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
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  async function loadTeams() {
    setLoading(true);
    const resp = await fetch("/api/teams");
    if (resp.ok) setTeams(await resp.json());
    setLoading(false);
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setCreating(true);
    const resp = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName.trim(), description: newTeamDesc.trim() }),
    });
    if (resp.ok) {
      toast.success("Team created");
      setNewTeamName("");
      setNewTeamDesc("");
      setShowCreateModal(false);
      loadTeams();
    } else {
      toast.error("Failed to create team");
    }
    setCreating(false);
  }

  async function openTeam(team: Team) {
    const resp = await fetch(`/api/teams/${team.id}`);
    if (resp.ok) setSelectedTeam(await resp.json());
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#0D1929]">
      <div className="max-w-5xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">Teams</h1>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mt-0.5">
              Manage teams and collaborate with colleagues
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

        {/* Teams grid */}
        {loading ? (
          <div className="text-sm text-[#6B778C] dark:text-slate-400">Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="bg-white dark:bg-[#1B2A3B] rounded-xl border border-[#DFE1E6] dark:border-slate-700 p-12 text-center">
            <Users className="h-12 w-12 text-[#C1C7D0] dark:text-slate-500 mx-auto mb-4" />
            <h3 className="text-base font-semibold text-[#172B4D] dark:text-white mb-1">No teams yet</h3>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-4">
              Create a team to collaborate with colleagues on spaces and pages
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded-lg transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              Create team
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => openTeam(team)}
                className="bg-white dark:bg-[#1B2A3B] rounded-xl border border-[#DFE1E6] dark:border-slate-700 p-5 text-left hover:shadow-md hover:border-[#0052CC] dark:hover:border-blue-500 transition-all group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">
                      {team.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-[#172B4D] dark:text-white truncate group-hover:text-[#0052CC]">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 truncate mt-0.5">
                        {team.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#6B778C] dark:text-slate-400">
                    {team.member_count} {team.member_count === 1 ? "member" : "members"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    team.my_role === "owner" ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" :
                    team.my_role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                    "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}>
                    {team.my_role === "owner" ? "Owner" : team.my_role === "admin" ? "Admin" : "Member"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create team modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-[#1B2A3B] rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">Create team</h2>
              <button onClick={() => setShowCreateModal(false)} className="h-8 w-8 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-1.5">Team name *</label>
                <input
                  autoFocus
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                  placeholder="e.g. Engineering, Marketing..."
                  className="w-full px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-200 mb-1.5">Description</label>
                <textarea
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="What does this team do?"
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-[#F4F5F7] dark:border-slate-700">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={handleCreateTeam}
                disabled={creating || !newTeamName.trim()}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team detail modal */}
      {selectedTeam && (
        <TeamDetailModal
          team={selectedTeam}
          onClose={() => { setSelectedTeam(null); loadTeams(); }}
        />
      )}
    </div>
  );
}

function TeamDetailModal({ team, onClose }: { team: TeamDetail; onClose: () => void }) {
  const [members, setMembers] = useState<TeamMember[]>(team.members || []);
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("member");
  const [adding, setAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

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
    if (resp.ok) {
      toast.success("Team deleted");
      onClose();
    } else {
      toast.error("Failed to delete team");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-[#1B2A3B] rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">{team.name.slice(0, 2).toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">{team.name}</h2>
              {team.description && <p className="text-xs text-[#6B778C] dark:text-slate-400">{team.description}</p>}
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center text-[#6B778C] hover:text-[#172B4D] dark:hover:text-white hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Add member form */}
        {team.my_role === "owner" && (
          <div className="px-6 py-3 border-b border-[#F4F5F7] dark:border-slate-700 flex gap-2">
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
              placeholder="Add member by email..."
              className="flex-1 px-3 py-1.5 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 placeholder-[#97A0AF] focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:border-transparent"
            />
            <div className="relative">
              <select
                value={addRole}
                onChange={(e) => setAddRole(e.target.value)}
                className="text-sm px-3 py-1.5 border border-[#DFE1E6] dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none appearance-none pr-7 cursor-pointer"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
            </div>
            <button
              onClick={handleAddMember}
              disabled={adding || !addEmail.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0065FF] rounded-lg transition-colors disabled:opacity-50"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        )}

        {/* Members list */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <p className="text-xs font-semibold text-[#6B778C] dark:text-slate-400 mb-2 uppercase tracking-wide">
            Members ({members.length + 1})
          </p>
          <ul className="space-y-1">
            {/* Owner row */}
            <li className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200">Owner</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 shrink-0">
                Owner
              </span>
            </li>
            {members.map((m) => {
              const profile = m.profiles;
              if (!profile) return null;
              return (
                <li key={m.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={profile.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-[#0052CC] text-white">
                      {getInitials(profile.full_name || profile.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">{profile.full_name || profile.email}</div>
                    <div className="text-xs text-[#6B778C] dark:text-slate-400 truncate">{profile.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    m.role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                    "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {m.role === "admin" ? "Admin" : "Member"}
                  </span>
                  {team.my_role === "owner" && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id)}
                      className="h-7 w-7 flex items-center justify-center text-[#97A0AF] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Danger zone */}
        {team.my_role === "owner" && (
          <div className="px-6 py-4 border-t border-[#F4F5F7] dark:border-slate-700">
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-sm text-red-500 hover:text-red-600 font-medium"
              >
                Delete team
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600 font-medium">Delete "{team.name}"?</span>
                <button onClick={handleDeleteTeam} className="text-sm text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded font-medium">Confirm</button>
                <button onClick={() => setDeleteConfirm(false)} className="text-sm text-[#42526E] dark:text-slate-300 px-3 py-1 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700">Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
