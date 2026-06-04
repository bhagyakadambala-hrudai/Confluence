"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronRight, Upload } from "lucide-react";
import { toast } from "sonner";

interface CreateSpaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (space: { id: string; name: string; emoji: string }) => void;
}

const ICON_OPTIONS = [
  "📝", "🐱", "📋", "🌐", "⚡", "🔍", "🔄",
  "🗂️", "🚀", "💡", "📊", "🎯", "🔬", "🎨",
  "💼", "🌟", "🏆", "🔑", "📌", "🌈", "🔧", "📸",
  "🧪", "🎵", "🏠", "🌍", "💎", "🎭", "🦁", "🐬",
];

export default function CreateSpaceModal({ open, onClose, onCreated }: CreateSpaceModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const iconPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) setShowIconPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!open) return null;

  async function handleCreate() {
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    setLoading(true);
    const resp = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), emoji }),
    });
    setLoading(false);
    if (resp.ok) {
      const space = await resp.json();
      toast.success("Space created!");
      handleClose();
      onCreated(space);
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to create space");
    }
  }

  function handleClose() {
    setName(""); setEmoji("📝"); setNameError(false); setShowIconPicker(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-5xl h-[90vh] max-h-[700px] bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl flex overflow-hidden">

        {/* ── Left panel ── */}
        <div className="flex flex-col w-[55%] min-w-0 h-full">
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-1">Create new space</h1>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-7">
              Required fields are marked with an asterisk <span className="text-red-500">*</span>
            </p>

            {/* Name */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5">
                Name this space <span className="text-red-500">*</span>
              </label>
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Space name"
                className={`w-full h-10 px-3 rounded border text-sm outline-none transition-colors bg-white dark:bg-[#0d1117] dark:text-white ${
                  nameError
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-[#DFE1E6] dark:border-[#30363d] focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                }`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span className="inline-flex h-3.5 w-3.5 rounded-full bg-red-500 text-white text-[9px] items-center justify-center font-bold shrink-0">!</span>
                  Space name is required.
                </p>
              )}
            </div>

            {/* Icon picker */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-2">
                Choose an icon
              </label>
              <div className="relative" ref={iconPickerRef}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ICON_OPTIONS.slice(0, 7).map((ic) => (
                    <button
                      key={ic}
                      onClick={() => setEmoji(ic)}
                      className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all shrink-0 ${
                        emoji === ic
                          ? "ring-2 ring-[#0052CC] ring-offset-1 bg-[#EAF2FF] dark:bg-blue-900/30"
                          : "bg-[#F4F5F7] dark:bg-[#21262d] hover:bg-[#EBECF0] dark:hover:bg-[#30363d]"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowIconPicker((v) => !v)}
                    className="h-10 px-3 rounded-lg text-sm text-[#42526E] dark:text-slate-400 bg-[#F4F5F7] dark:bg-[#21262d] hover:bg-[#EBECF0] dark:hover:bg-[#30363d] transition-colors border border-[#DFE1E6] dark:border-[#30363d] shrink-0"
                  >
                    See more
                  </button>
                </div>

                {showIconPicker && (
                  <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-[#1B2A3B] border border-[#DFE1E6] dark:border-[#30363d] rounded-lg shadow-xl z-50 overflow-hidden">
                    <button className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#172B4D] dark:text-slate-200 hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] border-b border-[#DFE1E6] dark:border-[#30363d] transition-colors">
                      <Upload className="h-4 w-4 text-[#42526E]" />
                      Upload image
                    </button>
                    <div className="p-3 grid grid-cols-5 gap-1.5 max-h-52 overflow-y-auto">
                      {ICON_OPTIONS.map((ic) => (
                        <button
                          key={ic}
                          onClick={() => { setEmoji(ic); setShowIconPicker(false); }}
                          className={`h-10 w-full rounded-lg text-xl flex items-center justify-center transition-all ${
                            emoji === ic
                              ? "ring-2 ring-[#0052CC] bg-[#EAF2FF] dark:bg-blue-900/30"
                              : "hover:bg-[#F4F5F7] dark:hover:bg-[#21262d]"
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end px-10 py-4 border-t border-[#E8EAED] dark:border-[#30363d]">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center gap-1.5 px-5 h-9 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 rounded transition-colors"
            >
              {loading ? (
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create space <ChevronRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 bg-gradient-to-br from-[#E8F4FC] via-[#C8DFF5] to-[#B8D0EE] dark:from-[#1a2332] dark:via-[#1e2a3a] dark:to-[#243040] relative overflow-hidden flex flex-col">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/60 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/40 transition-colors text-[#42526E] dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Preview card */}
          <div className="flex-1 flex items-start justify-center pt-12 px-6">
            <div className="w-full max-w-[240px]">
              <div className="bg-white dark:bg-[#1e2636] rounded-xl shadow-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-semibold text-[#172B4D] dark:text-white truncate">
                    {name || "Your space"}
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#6B778C] mb-2">Content</div>
                <div className="space-y-1.5">
                  {["Team goals", "Ideas", "Brainstorm", "Research", "Calendar"].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#DFE1E6]" />
                      <span className="text-xs text-[#6B778C]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="ml-auto w-32 bg-white dark:bg-[#1e2636] rounded-xl shadow-lg p-3">
                <div className="text-xs font-bold text-[#172B4D] dark:text-white mb-1.5 truncate">
                  {name || "Q3 Planning"}
                </div>
                <div className="space-y-1">
                  {[70, 50, 85, 40].map((w, i) => (
                    <div key={i} className={`h-1.5 rounded-full ${i === 2 ? "bg-[#36B37E]" : "bg-[#DFE1E6] dark:bg-[#30363d]"}`} style={{ width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pb-8 opacity-80">
            <div className="flex items-end gap-3">
              <div className="h-14 w-14 rounded-full bg-[#36B37E] flex items-center justify-center text-2xl shadow-lg">💬</div>
              <div className="h-10 w-10 rounded-full bg-[#0052CC] flex items-center justify-center text-lg shadow-md">💬</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
