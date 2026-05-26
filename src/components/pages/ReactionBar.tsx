"use client";

import { useState, useEffect } from "react";
import { Smile } from "lucide-react";
import { toast } from "sonner";

const COMMON_EMOJIS = ["👍", "❤️", "😄", "🎉", "🚀", "👀", "💯", "🔥", "✅", "💡", "😮", "👏"];

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export default function ReactionBar({ pageId }: { pageId: string }) {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/reactions`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setReactions);
  }, [pageId]);

  async function toggleReaction(emoji: string) {
    const resp = await fetch(`/api/pages/${pageId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!resp.ok) {
      toast.error("Failed to react");
      return;
    }
    const updated = await fetch(`/api/pages/${pageId}/reactions`).then((r) => r.json());
    setReactions(updated);
    setPickerOpen(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-6 relative">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => toggleReaction(r.emoji)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm border transition-colors ${
            r.userReacted
              ? "bg-[#DEEBFF] border-[#0052CC] text-[#0052CC]"
              : "bg-white dark:bg-slate-800 border-[#DFE1E6] dark:border-slate-600 text-[#172B4D] dark:text-slate-200 hover:border-[#0052CC] hover:bg-[#DEEBFF]"
          }`}
        >
          <span>{r.emoji}</span>
          <span className="font-medium text-xs">{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#DFE1E6] dark:border-slate-600 text-sm text-[#42526E] dark:text-slate-300 hover:border-[#0052CC] hover:bg-[#DEEBFF] hover:text-[#0052CC] transition-colors"
        >
          <Smile className="h-3.5 w-3.5" />
          <span>Add reaction</span>
        </button>

        {pickerOpen && (
          <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-slate-800 border border-[#DFE1E6] dark:border-slate-700 rounded-lg shadow-xl p-2 flex flex-wrap gap-1 w-52 z-50">
            {COMMON_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className="h-9 w-9 flex items-center justify-center rounded hover:bg-[#F4F5F7] dark:hover:bg-slate-700 text-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
