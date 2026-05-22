"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "@/components/common/EmojiPicker";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateSpaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (space: { id: string; name: string; emoji: string }) => void;
}

export default function CreateSpaceModal({ open, onClose, onCreated }: CreateSpaceModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emoji, setEmoji] = useState("📁");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});

  function validate() {
    const e: { name?: string } = {};
    if (!name.trim()) e.name = "Space name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    setLoading(true);
    const resp = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: description.trim(), emoji }),
    });
    setLoading(false);
    if (resp.ok) {
      const space = await resp.json();
      toast.success("Space created!");
      setName("");
      setDescription("");
      setEmoji("📁");
      onCreated(space);
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to create space");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a new space</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center gap-3">
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <div className="flex-1">
              <Label htmlFor="space-name">Space name</Label>
              <Input
                id="space-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering, Marketing, ..."
                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
          </div>
          <div>
            <Label htmlFor="space-desc">Description (optional)</Label>
            <Textarea
              id="space-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this space for?"
              rows={2}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Space
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
