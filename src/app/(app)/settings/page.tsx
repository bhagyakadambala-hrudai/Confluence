"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) { router.push("/login"); return; }
        setProfile(data.profile);
        setEmail(data.email || "");
        setFullName(data.profile?.full_name || "");
        setLoading(false);
      });
  }, [router]);

  async function handleSaveName() {
    if (!fullName.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingName(true);
    const resp = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName.trim() }),
    });
    if (resp.ok) {
      const updated = await resp.json();
      setProfile(updated);
      toast.success("Name updated successfully");
    } else {
      toast.error("Failed to update name");
    }
    setSavingName(false);
  }

  async function handleChangePassword() {
    if (!newPassword) { toast.error("New password is required"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
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
    <div className="max-w-2xl mx-auto px-8 py-10">
      <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-8">Settings</h1>

      {/* Profile section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-700 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
          <h2 className="font-semibold text-[#172B4D] dark:text-white">Profile</h2>
          <p className="text-sm text-[#6B778C] dark:text-slate-400 mt-0.5">
            Update your public profile information
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-xl bg-[#0052CC] text-white font-bold">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200">{displayName}</p>
              <p className="text-xs text-[#6B778C] dark:text-slate-400">{email}</p>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE1E6] dark:border-slate-600 rounded text-sm text-[#172B4D] dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:border-[#0052CC] transition-colors"
              placeholder="Your full name"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              Email address
            </label>
            <input
              value={email}
              readOnly
              className="w-full px-3 py-2 border border-[#DFE1E6] dark:border-slate-600 rounded text-sm text-[#6B778C] dark:text-slate-400 bg-[#F4F5F7] dark:bg-slate-700/50 cursor-not-allowed"
            />
            <p className="text-xs text-[#97A0AF] dark:text-slate-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <button
            onClick={handleSaveName}
            disabled={savingName}
            className="px-4 py-2 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors disabled:opacity-50"
          >
            {savingName ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      {/* Password section */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-[#DFE1E6] dark:border-slate-700 mb-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-[#DFE1E6] dark:border-slate-700">
          <h2 className="font-semibold text-[#172B4D] dark:text-white">Password</h2>
          <p className="text-sm text-[#6B778C] dark:text-slate-400 mt-0.5">
            Change your account password
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE1E6] dark:border-slate-600 rounded text-sm text-[#172B4D] dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:border-[#0052CC] transition-colors"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#6B778C] uppercase tracking-wide mb-1.5 block">
              Confirm new password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-[#DFE1E6] dark:border-slate-600 rounded text-sm text-[#172B4D] dark:text-slate-200 bg-white dark:bg-slate-700 focus:outline-none focus:border-[#0052CC] transition-colors"
              placeholder="Repeat new password"
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !newPassword}
            className="px-4 py-2 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors disabled:opacity-50"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
        </div>
      </section>

      {/* Danger zone */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-red-200 dark:border-red-900/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-red-200 dark:border-red-900/50">
          <h2 className="font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#172B4D] dark:text-slate-200">Delete account</p>
            <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">
              Permanently delete your account and all your data
            </p>
          </div>
          <button
            onClick={() => toast.error("Account deletion requires contacting support")}
            className="px-4 py-2 text-sm text-red-600 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Delete account
          </button>
        </div>
      </section>
    </div>
  );
}
