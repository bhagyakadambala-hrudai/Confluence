"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag, Plus, Check } from "lucide-react";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelPickerProps {
  spaceId: string;
  availableLabels: Label[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316",
  "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#64748b",
];

export default function LabelPicker({ spaceId, availableLabels, selectedLabelIds, onChange }: LabelPickerProps) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Label[]>(availableLabels);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [creating, setCreating] = useState(false);

  function toggle(id: string) {
    const next = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter((x) => x !== id)
      : [...selectedLabelIds, id];
    onChange(next);
  }

  async function createLabel() {
    if (!newName.trim()) return;
    setCreating(true);
    const resp = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), color: newColor, space_id: spaceId }),
    });
    setCreating(false);
    if (resp.ok) {
      const label = await resp.json();
      setLabels((prev) => [...prev, label]);
      setNewName("");
      toast.success("Label created");
    } else {
      toast.error("Failed to create label");
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
          <Tag className="h-3 w-3" />
          Labels
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Labels</p>
        <div className="space-y-1 max-h-40 overflow-y-auto mb-3">
          {labels.length === 0 && (
            <p className="text-xs text-muted-foreground py-2 text-center">No labels yet</p>
          )}
          {labels.map((label) => (
            <button
              key={label.id}
              onClick={() => toggle(label.id)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-muted text-sm"
            >
              <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
              <span className="flex-1 text-left truncate">{label.name}</span>
              {selectedLabelIds.includes(label.id) && <Check className="h-3 w-3 text-primary" />}
            </button>
          ))}
        </div>

        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Create new</p>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name"
            className="h-7 text-xs mb-2"
            onKeyDown={(e) => e.key === "Enter" && createLabel()}
          />
          <div className="flex flex-wrap gap-1 mb-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="h-5 w-5 rounded-full ring-offset-1 transition-all"
                style={{ backgroundColor: c, outline: newColor === c ? `2px solid ${c}` : "none" }}
              />
            ))}
          </div>
          <Button size="sm" className="w-full h-7 text-xs" onClick={createLabel} disabled={creating || !newName.trim()}>
            <Plus className="h-3 w-3 mr-1" />
            Create
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
