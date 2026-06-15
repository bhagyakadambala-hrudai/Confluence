"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, UserMinus, Mail, ChevronDown, Archive, Trash2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

interface Member {
  role: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    email: string;
  };
}

interface Space {
  id: string;
  name: string;
  emoji: string;
  description: string | null;
  status?: string | null;
}

const TABS = ["Overview", "Members", "Look and feel"] as const;
type Tab = (typeof TABS)[number];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  editor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  member: "bg-[#F4F5F7] text-[#42526E] dark:bg-slate-700 dark:text-slate-300",
  viewer: "bg-[#F4F5F7] text-[#42526E] dark:bg-slate-700 dark:text-slate-300",
};

const ICON_OPTIONS = [
  "📝", "🐱", "📋", "🌐", "⚡", "🔍", "🔄",
  "🗂️", "🚀", "💡", "📊", "🎯", "🔬", "🎨",
  "💼", "🌟", "🏆", "🔑", "📌", "🌈", "🔧", "📸",
  "🧪", "🎵", "🏠", "🌍", "💎", "🎭", "🦁", "🐬",
];

const GRADIENT_OPTIONS = [
  { label: "Ocean Blue", value: "from-[#00B8D9] via-[#0052CC] to-[#1A237E]" },
  { label: "Sunset", value: "from-[#FF6B6B] via-[#FF8E53] to-[#FFAB00]" },
  { label: "Forest", value: "from-[#36B37E] via-[#00875A] to-[#006644]" },
  { label: "Purple", value: "from-[#6554C0] via-[#8777D9] to-[#C0B6F2]" },
  { label: "Midnight", value: "from-[#172B4D] via-[#253858] to-[#42526E]" },
];

export default function SpaceSettingsPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [space, setSpace] = useState<Space | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const [spaceRes, membersRes] = await Promise.all([
        fetch(`/api/spaces/${spaceId}`),
        fetch(`/api/spaces/${spaceId}/members`),
      ]);
      if (spaceRes.ok) {
        const s = await spaceRes.json();
        setSpace(s);
        setName(s.name);
        // Strip HTML tags — description should be plain text
        const raw: string = s.description || "";
        setDescription(raw.replace(/<[^>]*>/g, " ").replace(/\s{2,}/g, " ").trim());
        setEmoji(s.emoji || "📁");
      }
      if (membersRes.ok) setMembers(await membersRes.json());
    }
    load();
  }, [spaceId]);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), emoji }),
    });
    setSaving(false);
    if (resp.ok) {
      toast.success("Space updated");
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to update");
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const resp = await fetch(`/api/spaces/${spaceId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    setInviting(false);
    if (resp.ok) {
      toast.success("Invitation sent");
      setInviteEmail("");
      const membersRes = await fetch(`/api/spaces/${spaceId}/members`);
      if (membersRes.ok) setMembers(await membersRes.json());
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to invite");
    }
  }

  async function handleRemoveMember(userId: string) {
    const resp = await fetch(`/api/spaces/${spaceId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (resp.ok) {
      setMembers((m) => m.filter((x) => x.profiles.id !== userId));
      toast.success("Member removed");
    } else {
      toast.error("Failed to remove member");
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    const resp = await fetch(`/api/spaces/${spaceId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (resp.ok) {
      setMembers((m) => m.map((x) => x.profiles.id === userId ? { ...x, role } : x));
    } else {
      toast.error("Failed to update role");
    }
  }

  async function handleArchive() {
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    if (resp.ok) {
      toast.success("Space archived");
      router.push("/spaces");
    } else {
      toast.error("Failed to archive space");
    }
  }

  async function handleTrash() {
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "trashed" }),
    });
    if (resp.ok) {
      toast.success("Space moved to Trash");
      router.push("/spaces");
    } else {
      toast.error("Failed to trash space");
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#161B22]">
      {/* Top bar */}
      <div className="bg-white dark:bg-[#1e2636] border-b border-[#DFE1E6] dark:border-slate-700 px-6 py-4">
        <Link
          href={`/spaces/${spaceId}`}
          className="flex items-center gap-1.5 text-sm text-[#6B778C] dark:text-slate-400 hover:text-[#0052CC] dark:hover:text-blue-400 transition-colors mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to space
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <div>
            <h1 className="text-xl font-bold text-[#172B4D] dark:text-white">{name || "Space settings"}</h1>
            <p className="text-xs text-[#6B778C] dark:text-slate-400">Space settings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-[#1e2636] border-b border-[#DFE1E6] dark:border-slate-700 px-6">
        <div className="flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-[#0052CC] text-[#0052CC] dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* ── Overview tab ── */}
        {activeTab === "Overview" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-5">Space details</h2>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5">
                  Space name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded border border-[#DFE1E6] dark:border-[#30363d] text-sm bg-white dark:bg-[#0d1117] dark:text-white outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-colors"
                />
              </div>

              <div className="mb-5">
                <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe what this space is for…"
                  className="w-full px-3 py-2 rounded border border-[#DFE1E6] dark:border-[#30363d] text-sm bg-white dark:bg-[#0d1117] dark:text-white outline-none focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] transition-colors resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 h-9 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 rounded transition-colors"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save changes
              </button>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-red-200 dark:border-red-900/50 p-6">
              <h2 className="text-base font-semibold text-red-600 dark:text-red-400 mb-4">Danger zone</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-[#F4F5F7] dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-[#172B4D] dark:text-white">Archive this space</p>
                    <p className="text-xs text-[#6B778C] dark:text-slate-400">Mark the space as archived. Content is preserved and read-only.</p>
                  </div>
                  <button
                    onClick={handleArchive}
                    className="flex items-center gap-1.5 px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    <Archive className="h-3.5 w-3.5" /> Archive
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Delete this space</p>
                    <p className="text-xs text-[#6B778C] dark:text-slate-400">Move to Trash. Can be restored within 30 days.</p>
                  </div>
                  {!deleteConfirm ? (
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      className="flex items-center gap-1.5 px-3 h-8 text-sm text-red-600 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete space
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleTrash}
                        className="px-3 h-8 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Confirm delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        className="px-3 h-8 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Members tab ── */}
        {activeTab === "Members" && (
          <div className="space-y-6">
            {/* Invite */}
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">Invite people</h2>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded border border-[#DFE1E6] dark:border-[#30363d] bg-white dark:bg-[#0d1117] focus-within:border-[#0052CC] focus-within:ring-1 focus-within:ring-[#0052CC] transition-colors">
                  <Mail className="h-4 w-4 text-[#6B778C] shrink-0" />
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="Enter email address"
                    className="flex-1 bg-transparent outline-none text-sm text-[#172B4D] dark:text-white placeholder-[#97A0AF]"
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="h-10 px-2 rounded border border-[#DFE1E6] dark:border-[#30363d] text-sm bg-white dark:bg-[#0d1117] dark:text-white outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button
                  onClick={handleInvite}
                  disabled={inviting || !inviteEmail.trim()}
                  className="flex items-center gap-1.5 px-4 h-10 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 rounded transition-colors"
                >
                  {inviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Invite
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-[#DFE1E6] dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[#172B4D] dark:text-white">Members ({members.length})</h2>
              </div>
              <div className="divide-y divide-[#F4F5F7] dark:divide-slate-700">
                {members.map((m) => (
                  <div key={m.profiles.id} className="flex items-center gap-3 px-6 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={m.profiles.avatar_url} />
                      <AvatarFallback className="text-xs bg-[#0052CC] text-white">
                        {getInitials(m.profiles.full_name || m.profiles.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#172B4D] dark:text-white truncate">
                        {m.profiles.full_name || m.profiles.email}
                      </p>
                      <p className="text-xs text-[#6B778C] dark:text-slate-400 truncate">{m.profiles.email}</p>
                    </div>
                    {m.role === "owner" ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[m.role]}`}>
                        Owner
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(m.profiles.id, e.target.value)}
                            className="h-7 pl-2 pr-6 text-xs rounded border border-[#DFE1E6] dark:border-[#30363d] bg-white dark:bg-[#0d1117] dark:text-white outline-none appearance-none cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#6B778C]" />
                        </div>
                        <button
                          onClick={() => handleRemoveMember(m.profiles.id)}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-[#6B778C] hover:text-red-600 transition-colors"
                          title="Remove member"
                        >
                          <UserMinus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <div className="px-6 py-8 text-sm text-[#6B778C] text-center">No members yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Look and feel tab ── */}
        {activeTab === "Look and feel" && (
          <div className="space-y-6">
            {/* Icon */}
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">Space icon</h2>
              <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-4">Choose an emoji to represent this space.</p>
              <div className="grid grid-cols-10 gap-1.5">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setEmoji(ic)}
                    className={`h-10 w-full rounded-lg text-xl flex items-center justify-center transition-all ${
                      emoji === ic
                        ? "ring-2 ring-[#0052CC] bg-[#EAF2FF] dark:bg-blue-900/30"
                        : "hover:bg-[#F4F5F7] dark:hover:bg-slate-700"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-5 flex items-center gap-2 px-4 h-9 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 rounded transition-colors"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save icon
              </button>
            </div>

            {/* Banner color */}
            <div className="bg-white dark:bg-[#1e2636] rounded-lg border border-[#DFE1E6] dark:border-slate-700 p-6">
              <h2 className="text-base font-semibold text-[#172B4D] dark:text-white mb-4">Banner color</h2>
              <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-4">Select a gradient for your space banner.</p>
              <div className="flex flex-wrap gap-3">
                {GRADIENT_OPTIONS.map((g) => (
                  <div
                    key={g.value}
                    className={`h-16 w-36 rounded-lg bg-gradient-to-r ${g.value} cursor-pointer hover:ring-2 hover:ring-[#0052CC] hover:ring-offset-2 transition-all`}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
