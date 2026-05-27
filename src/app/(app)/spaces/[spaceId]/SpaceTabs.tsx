"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import CreatePageButton from "@/components/pages/CreatePageButton";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { FileText, Users, Star, UserPlus, Trash2, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  emoji: string;
  overview_content: string;
  owner_id: string;
}

interface Page {
  id: string;
  title: string;
  emoji: string;
  updated_at: string;
  profiles: { full_name: string; avatar_url: string } | null;
}

interface Member {
  role: string;
  profiles: {
    id: string;
    full_name: string;
    avatar_url: string;
    email: string;
  } | null;
}

interface SpaceTabsProps {
  space: Space;
  pages: Page[];
  members: Member[];
  currentUserId: string;
}

export default function SpaceTabs({ space, pages, members: initialMembers, currentUserId }: SpaceTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "pages" | "members">("pages");
  const [overviewContent, setOverviewContent] = useState(space.overview_content || "");
  const [editingOverview, setEditingOverview] = useState(false);
  const [savingOverview, setSavingOverview] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetch("/api/stars")
      .then((r) => r.ok ? r.json() : { spaces: [] })
      .then((data) => {
        setIsStarred((data.spaces || []).some((s: { id: string }) => s.id === space.id));
      });
  }, [space.id]);

  async function handleStarSpace() {
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

  async function handleSaveOverview() {
    setSavingOverview(true);
    const resp = await fetch(`/api/spaces/${space.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overview_content: overviewContent }),
    });
    if (resp.ok) {
      toast.success("Overview saved");
      setEditingOverview(false);
    } else {
      toast.error("Failed to save overview");
    }
    setSavingOverview(false);
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    if (resp.ok) {
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail("");
      setShowInviteForm(false);
      // Refresh members
      const membersResp = await fetch(`/api/spaces/${space.id}/members`);
      if (membersResp.ok) setMembers(await membersResp.json());
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to invite member");
    }
    setInviting(false);
  }

  async function handleRemoveMember(userId: string) {
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (resp.ok) {
      toast.success("Member removed");
      setMembers((prev) => prev.filter((m) => m.profiles?.id !== userId));
    } else {
      toast.error("Failed to remove member");
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    const resp = await fetch(`/api/spaces/${space.id}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (resp.ok) {
      setMembers((prev) => prev.map((m) => {
        const p = (m.profiles as unknown) as { id: string } | null;
        return p?.id === userId ? { ...m, role } : m;
      }));
      toast.success("Role updated");
    } else {
      toast.error("Failed to update role");
    }
  }

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "pages", label: "Pages" },
    { id: "members", label: `Members (${members.length})` },
  ] as const;

  return (
    <>
      {/* Tab bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#1B2A3B] border-b border-[#DFE1E6] dark:border-slate-700 px-8">
        <div className="max-w-5xl mx-auto flex items-center gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm transition-colors ${
                activeTab === tab.id
                  ? "font-medium border-b-2 border-[#0052CC] text-[#0052CC]"
                  : "text-[#42526E] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2 py-2">
            <button
              onClick={handleStarSpace}
              title={isStarred ? "Remove star" : "Star this space"}
              className={`h-8 w-8 flex items-center justify-center rounded transition-colors ${
                isStarred
                  ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                  : "text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700"
              }`}
            >
              <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-500" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 py-6">
        <div className="max-w-5xl mx-auto px-8">
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div>
              {editingOverview ? (
                <div className="space-y-3">
                  <textarea
                    value={overviewContent}
                    onChange={(e) => setOverviewContent(e.target.value)}
                    className="w-full min-h-64 px-4 py-3 border border-[#0052CC] rounded-lg text-sm text-[#172B4D] dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none resize-none"
                    placeholder="Write an overview for this space. Describe what this space is for, who it's for, and what people can find here."
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveOverview}
                      disabled={savingOverview}
                      className="px-4 py-2 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors disabled:opacity-50"
                    >
                      {savingOverview ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingOverview(false); setOverviewContent(space.overview_content || ""); }}
                      className="px-4 py-2 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : overviewContent ? (
                <div
                  className="prose prose-slate dark:prose-invert max-w-none cursor-text hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-700/20 rounded-lg p-4 -mx-4 transition-colors group relative"
                  onClick={() => setEditingOverview(true)}
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-[#0052CC] bg-[#DEEBFF] px-2 py-0.5 rounded">Click to edit</span>
                  </div>
                  <p className="whitespace-pre-wrap">{overviewContent}</p>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-[#DFE1E6] dark:border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-[#0052CC] hover:bg-[#F4F5F7]/50 dark:hover:bg-slate-700/20 transition-colors group"
                  onClick={() => setEditingOverview(true)}
                >
                  <p className="text-[#6B778C] dark:text-slate-400 mb-1 font-medium group-hover:text-[#0052CC]">
                    Add a description for this space
                  </p>
                  <p className="text-sm text-[#97A0AF] dark:text-slate-500">
                    Click to add an overview — describe what this space is for
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Pages Tab ── */}
          {activeTab === "pages" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#172B4D] dark:text-white text-lg">Pages</h2>
                <CreatePageButton spaceId={space.id} />
              </div>

              {!pages || pages.length === 0 ? (
                <div className="border border-dashed border-[#DFE1E6] dark:border-slate-600 rounded-xl p-10 text-center">
                  <FileText className="h-10 w-10 text-[#C1C7D0] dark:text-slate-500 mx-auto mb-3" />
                  <p className="text-sm font-medium text-[#172B4D] dark:text-slate-300 mb-1">No pages yet</p>
                  <p className="text-xs text-[#6B778C] dark:text-slate-400 mb-4">Create the first page in this space</p>
                  <CreatePageButton spaceId={space.id} />
                </div>
              ) : (
                <div className="space-y-0.5">
                  {pages.map((page) => {
                    const profile = (page.profiles as unknown) as { full_name: string; avatar_url: string } | null;
                    return (
                      <Link
                        key={page.id}
                        href={`/spaces/${space.id}/pages/${page.id}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700/50 transition-colors group"
                      >
                        <span className="text-lg leading-none shrink-0">{page.emoji || "📄"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
                            {page.title || "Untitled"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-xs text-[#97A0AF] dark:text-slate-500">
                          <span>Updated {formatRelativeTime(page.updated_at)}</span>
                          {profile && (
                            <>
                              <span>by</span>
                              <Avatar className="h-5 w-5">
                                <AvatarFallback className="text-[9px] bg-[#0052CC] text-white">
                                  {getInitials(profile.full_name || "U")}
                                </AvatarFallback>
                              </Avatar>
                              <span className="max-w-[100px] truncate">{profile.full_name}</span>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Members Tab ── */}
          {activeTab === "members" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#6B778C]" />
                  <h2 className="font-semibold text-[#172B4D] dark:text-white">
                    Members <span className="text-[#6B778C] font-normal text-sm">({members.length})</span>
                  </h2>
                </div>
                {currentUserId === space.owner_id && (
                  <button
                    onClick={() => setShowInviteForm(!showInviteForm)}
                    className="flex items-center gap-1.5 px-3 h-8 text-sm bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors font-medium"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invite member
                  </button>
                )}
              </div>

              {showInviteForm && (
                <div className="bg-[#F4F5F7] dark:bg-slate-700/30 rounded-lg p-4 mb-4 flex items-center gap-2 flex-wrap">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                    placeholder="Enter email address"
                    className="flex-1 min-w-48 px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none focus:border-[#0052CC]"
                  />
                  <div className="relative">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-3 py-2 text-sm border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none focus:border-[#0052CC] appearance-none pr-7 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <ChevronDown className="h-3.5 w-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                  </div>
                  <button
                    onClick={handleInvite}
                    disabled={inviting || !inviteEmail.trim()}
                    className="px-3 py-2 text-sm bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors disabled:opacity-50"
                  >
                    {inviting ? "Inviting..." : "Invite"}
                  </button>
                  <button
                    onClick={() => { setShowInviteForm(false); setInviteEmail(""); }}
                    className="px-3 py-2 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#EBECF0] dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-700 overflow-hidden">
                {members.map((m, i) => {
                  const profile = (m.profiles as unknown) as { id: string; full_name: string; avatar_url: string; email: string } | null;
                  if (!profile) return null;
                  return (
                    <div
                      key={profile.id}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i > 0 ? "border-t border-[#F4F5F7] dark:border-slate-700" : ""
                      }`}
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-xs bg-[#0052CC] text-white font-bold">
                          {getInitials(profile.full_name || profile.email || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate">
                          {profile.full_name || profile.email}
                        </p>
                        <p className="text-xs text-[#6B778C] dark:text-slate-400 truncate">{profile.email}</p>
                      </div>
                      {m.role === "owner" ? (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 shrink-0">
                          Owner
                        </span>
                      ) : currentUserId === space.owner_id ? (
                        <div className="relative shrink-0">
                          <select
                            value={m.role}
                            onChange={(e) => handleChangeRole(profile.id, e.target.value)}
                            className="text-xs px-2 py-1 border border-[#DFE1E6] dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-[#172B4D] dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#0052CC] appearance-none pr-6 cursor-pointer"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <ChevronDown className="h-3 w-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-[#6B778C] pointer-events-none" />
                        </div>
                      ) : (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                          m.role === "admin" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                          m.role === "editor" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}>
                          {m.role === "editor" ? "Editor" : m.role === "admin" ? "Admin" : "Viewer"}
                        </span>
                      )}
                      {currentUserId === space.owner_id && m.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveMember(profile.id)}
                          className="h-7 w-7 flex items-center justify-center text-[#97A0AF] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
