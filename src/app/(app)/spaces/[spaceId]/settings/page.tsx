"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import EmojiPicker from "@/components/common/EmojiPicker";
import { toast } from "sonner";
import { Loader2, Trash2, UserMinus, ArrowLeft } from "lucide-react";
import Link from "next/link";
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

export default function SpaceSettingsPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params.spaceId;
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      const [spaceRes, membersRes] = await Promise.all([
        fetch(`/api/spaces/${spaceId}`),
        fetch(`/api/spaces/${spaceId}/members`),
      ]);
      if (spaceRes.ok) {
        const s = await spaceRes.json();
        setName(s.name);
        setDescription(s.description || "");
        setEmoji(s.emoji || "📁");
      }
      if (membersRes.ok) setMembers(await membersRes.json());
    }
    load();
  }, [spaceId]);

  async function handleSave() {
    if (!name.trim()) { toast.error("Name is required"); return; }
    setLoading(true);
    const resp = await fetch(`/api/spaces/${spaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), emoji }),
    });
    setLoading(false);
    if (resp.ok) {
      toast.success("Space updated");
      router.refresh();
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to update");
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

  async function handleDelete() {
    const resp = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" });
    if (resp.ok) {
      toast.success("Space deleted");
      router.push("/");
    } else {
      toast.error("Failed to delete space");
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={`/spaces/${spaceId}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to space
        </Link>
        <h1 className="text-2xl font-bold">Space Settings</h1>
      </div>

      <div className="space-y-6">
        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">General</h2>
          <div className="flex items-center gap-4">
            <EmojiPicker value={emoji} onChange={setEmoji} size="lg" />
            <div className="flex-1">
              <Label htmlFor="name">Space name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </div>

        <div className="border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold">Members</h2>
          <div className="space-y-3">
            {members.map((m) => (
              <div key={m.profiles.id} className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={m.profiles.avatar_url} />
                  <AvatarFallback className="text-xs bg-blue-500 text-white">
                    {getInitials(m.profiles.full_name || m.profiles.email || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{m.profiles.full_name || m.profiles.email}</p>
                  <p className="text-xs text-muted-foreground">{m.profiles.email}</p>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">{m.role}</Badge>
                {m.role !== "owner" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveMember(m.profiles.id)}>
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="border border-destructive/30 rounded-xl p-6 space-y-3">
          <h2 className="font-semibold text-destructive">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">Deleting this space will remove all pages and data permanently.</p>
          {!deleteConfirm ? (
            <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Space
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDelete}>Confirm Delete</Button>
              <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
