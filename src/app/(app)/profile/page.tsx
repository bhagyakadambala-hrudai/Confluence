"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { Edit2, FileText, Calendar, Mail } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Page {
  id: string;
  title: string;
  emoji: string;
  space_id: string;
  updated_at: string;
  spaces: { name: string; emoji: string } | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.push("/login"); return; }
        setProfile(data.profile);
        setPages(data.pages || []);
        setEmail(data.email || "");
        setCreatedAt(data.created_at || "");
        setEditName(data.profile?.full_name || "");
        setLoading(false);
      });
  }, [router]);

  async function handleSave() {
    setSaving(true);
    const resp = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: editName }),
    });
    if (resp.ok) {
      const updated = await resp.json();
      setProfile(updated);
      setEditing(false);
      toast.success("Profile updated");
    } else {
      toast.error("Failed to update profile");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-[#0052CC] border-t-transparent rounded-full" />
      </div>
    );
  }

  const displayName = profile?.full_name || email || "User";

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-700 p-8 mb-8">
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="text-2xl bg-[#0052CC] text-white font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold border-b-2 border-[#0052CC] outline-none bg-transparent text-[#172B4D] dark:text-white w-64"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                />
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 text-sm bg-[#0052CC] text-white rounded hover:bg-[#0065FF] transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditName(profile?.full_name || ""); }}
                  className="px-3 py-1 text-sm text-[#42526E] dark:text-slate-300 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white">{displayName}</h1>
                <button
                  onClick={() => setEditing(true)}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors text-[#6B778C]"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm text-[#6B778C] dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>
              {createdAt && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Joined {formatRelativeTime(createdAt)}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => router.push("/settings")}
            className="px-3 py-2 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-slate-600 rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            Edit profile
          </button>
        </div>
      </div>

      {/* Pages section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-[#6B778C]" />
          <h2 className="font-semibold text-[#172B4D] dark:text-white">
            Pages{" "}
            <span className="text-[#6B778C] font-normal text-sm">({pages.length})</span>
          </h2>
        </div>

        {pages.length === 0 ? (
          <div className="border border-dashed border-[#DFE1E6] dark:border-slate-600 rounded-xl p-10 text-center">
            <FileText className="h-8 w-8 text-[#C1C7D0] dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-[#6B778C] dark:text-slate-400">No pages created yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-700 overflow-hidden">
            {pages.map((page, i) => {
              const space = (page.spaces as unknown) as { name: string; emoji: string } | null;
              return (
                <Link
                  key={page.id}
                  href={`/spaces/${page.space_id}/pages/${page.id}`}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-[#F4F5F7] dark:hover:bg-slate-700 transition-colors group ${
                    i > 0 ? "border-t border-[#F4F5F7] dark:border-slate-700" : ""
                  }`}
                >
                  <span className="text-lg shrink-0">{page.emoji || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] transition-colors">
                      {page.title || "Untitled"}
                    </p>
                    {space && (
                      <p className="text-xs text-[#6B778C] dark:text-slate-400">
                        {space.emoji} {space.name}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-[#97A0AF] dark:text-slate-500 shrink-0">
                    {formatRelativeTime(page.updated_at)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
