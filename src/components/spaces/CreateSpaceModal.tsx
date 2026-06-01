"use client";

import { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface CreateSpaceModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (space: { id: string; name: string; emoji: string }) => void;
}

const ICON_OPTIONS = [
  "🔧", "📸", "🌐", "📋", "🗂️", "🚩", "🧪",
  "🚀", "💡", "📊", "🎯", "📝", "🔬", "🎨",
  "💼", "🌟", "🏆", "🔑", "📌", "🌈",
];

const PURPOSES = [
  {
    id: "collaboration",
    title: "Collaboration",
    description: "Explore and iterate on work with your team in real time",
  },
  {
    id: "knowledge",
    title: "Knowledge base",
    description: "Create, publish, and share important documentation",
  },
  {
    id: "custom",
    title: "Custom",
    description: "Manually configure your space",
  },
] as const;

type Purpose = (typeof PURPOSES)[number]["id"];

export default function CreateSpaceModal({ open, onClose, onCreated }: CreateSpaceModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔧");
  const [purpose, setPurpose] = useState<Purpose>("collaboration");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAllIcons, setShowAllIcons] = useState(false);

  if (!open) return null;

  const visibleIcons = showAllIcons ? ICON_OPTIONS : ICON_OPTIONS.slice(0, 7);

  function handleNext() {
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    setStep(2);
  }

  async function handleCreate() {
    if (!name.trim()) return;
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
      onCreated(space);
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to create space");
    }
  }

  function handleClose() {
    setStep(1);
    setName("");
    setEmoji("🔧");
    setPurpose("collaboration");
    setDescription("");
    setNameError(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl h-[90vh] max-h-[680px] bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl flex overflow-hidden">

        {/* Left panel — form */}
        <div className="flex flex-col w-[55%] min-w-0 h-full">
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto px-10 py-8">
            <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-1">Create new space</h1>
            <p className="text-sm text-[#6B778C] dark:text-slate-400 mb-8">
              Required fields are marked with an asterisk <span className="text-red-500">*</span>
            </p>

            {step === 1 ? (
              <div className="space-y-7">
                {/* Space name */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Name this space <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
                    placeholder="Space name"
                    className={`w-full h-11 px-3 rounded border text-sm outline-none transition-colors bg-white dark:bg-[#161B22] dark:text-white ${
                      nameError
                        ? "border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-[#DFE1E6] dark:border-[#30363d] focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC]"
                    }`}
                  />
                  {nameError && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">!</span>
                      Space name is required.
                    </p>
                  )}
                </div>

                {/* Icon picker */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Choose an icon
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {visibleIcons.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setEmoji(ic)}
                        className={`h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                          emoji === ic
                            ? "ring-2 ring-[#0052CC] ring-offset-1 bg-[#EAF2FF] dark:bg-blue-900/30"
                            : "bg-[#F4F5F7] dark:bg-[#21262d] hover:bg-[#EBECF0] dark:hover:bg-[#30363d]"
                        }`}
                      >
                        {ic}
                      </button>
                    ))}
                    {!showAllIcons && (
                      <button
                        onClick={() => setShowAllIcons(true)}
                        className="h-10 px-3 rounded-lg text-sm text-[#42526E] dark:text-slate-400 bg-[#F4F5F7] dark:bg-[#21262d] hover:bg-[#EBECF0] dark:hover:bg-[#30363d] transition-colors border border-[#DFE1E6] dark:border-[#30363d]"
                      >
                        See more
                      </button>
                    )}
                  </div>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-2 uppercase tracking-wide">
                    Choose a purpose for this space
                  </label>
                  <div className="space-y-2">
                    {PURPOSES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setPurpose(p.id)}
                        className={`w-full text-left px-4 py-3.5 rounded-lg border transition-all ${
                          purpose === p.id
                            ? "border-[#0052CC] bg-[#EAF2FF] dark:bg-blue-900/20 dark:border-blue-500"
                            : "border-[#DFE1E6] dark:border-[#30363d] hover:border-[#B3D4FF] dark:hover:border-[#58a6ff] hover:bg-[#F8F9FF] dark:hover:bg-[#21262d]"
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#172B4D] dark:text-white">{p.title}</p>
                        <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5">{p.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Step 2 */
              <div className="space-y-7">
                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Space name
                  </label>
                  <div className="flex items-center gap-3 px-3 h-11 rounded border border-[#DFE1E6] dark:border-[#30363d] bg-[#F4F5F7] dark:bg-[#21262d]">
                    <span className="text-xl">{emoji}</span>
                    <span className="text-sm text-[#172B4D] dark:text-white">{name}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                    Description <span className="text-[#6B778C] font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What is this space for?"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded border border-[#DFE1E6] dark:border-[#30363d] text-sm outline-none bg-white dark:bg-[#161B22] dark:text-white focus:border-[#0052CC] focus:ring-1 focus:ring-[#0052CC] resize-none transition-colors"
                  />
                </div>

                <div className="bg-[#F4F5F7] dark:bg-[#21262d] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#172B4D] dark:text-slate-300 mb-1">Summary</p>
                  <div className="flex items-center gap-2 text-sm text-[#42526E] dark:text-slate-400">
                    <span className="text-base">{emoji}</span>
                    <span className="font-medium text-[#172B4D] dark:text-white">{name}</span>
                    <span className="text-[#C1C7D0]">·</span>
                    <span className="capitalize">{purpose.replace("knowledge", "Knowledge base")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between px-10 py-5 border-t border-[#E8EAED] dark:border-[#30363d]">
            <span className="text-sm text-[#6B778C] dark:text-slate-400">
              Step {step} of 2
            </span>
            <div className="flex items-center gap-3">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 h-9 text-sm text-[#42526E] dark:text-slate-300 border border-[#DFE1E6] dark:border-[#30363d] rounded hover:bg-[#F4F5F7] dark:hover:bg-[#21262d] transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={step === 1 ? handleNext : handleCreate}
                disabled={loading}
                className="flex items-center gap-1.5 px-5 h-9 text-sm font-medium text-white bg-[#0052CC] hover:bg-[#0747A6] disabled:opacity-60 rounded transition-colors"
              >
                {loading ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : step === 1 ? (
                  <>Next <ChevronRight className="h-3.5 w-3.5" /></>
                ) : (
                  "Create space"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right panel — illustration */}
        <div className="flex-1 bg-gradient-to-br from-[#E8F4FC] via-[#C8DFF5] to-[#B8D0EE] dark:from-[#1a2332] dark:via-[#1e2a3a] dark:to-[#243040] relative overflow-hidden flex flex-col items-center justify-center p-8">

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-white/60 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/40 transition-colors text-[#42526E] dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Decorative illustration */}
          <div className="relative w-full max-w-xs">
            {/* Space preview card */}
            <div className="bg-white dark:bg-[#1e2636] rounded-xl shadow-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-lg bg-[#FF5630] flex items-center justify-center text-xl">
                  {emoji || "🔧"}
                </div>
                <span className="text-sm font-semibold text-[#172B4D] dark:text-white truncate">
                  {name || "Your space"}
                </span>
              </div>
              <div className="space-y-1.5">
                {["Content", "Team goals", "Ideas", "Brainstorm", "Research", "Calendar"].map((item, i) => (
                  <div key={item} className="flex items-center gap-2 py-0.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#6554C0]" : "bg-[#DFE1E6] dark:bg-[#30363d]"}`} />
                    <span className={`text-xs ${i === 0 ? "text-[#172B4D] dark:text-white font-medium" : "text-[#6B778C] dark:text-slate-400"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Floating accent card */}
            <div className="absolute -right-4 top-8 bg-white dark:bg-[#1e2636] rounded-xl shadow-lg p-3 w-36">
              <div className="text-xs font-bold text-[#172B4D] dark:text-white mb-1">
                {name ? name.slice(0, 12) + (name.length > 12 ? "…" : "") : "Q3 Planning"}
              </div>
              <div className="space-y-1">
                {[70, 50, 85, 40].map((w, i) => (
                  <div key={i} className={`h-1.5 rounded-full ${i === 2 ? "bg-[#36B37E]" : "bg-[#DFE1E6] dark:bg-[#30363d]"}`} style={{ width: `${w}%` }} />
                ))}
              </div>
            </div>

            {/* Chat bubble decorations */}
            <div className="flex items-end gap-2 mt-2 opacity-70">
              <div className="h-10 w-10 rounded-full bg-[#36B37E] flex items-center justify-center text-lg">💬</div>
              <div className="h-8 w-8 rounded-full bg-[#0052CC] flex items-center justify-center text-sm">💬</div>
            </div>
          </div>

          {/* Purpose label */}
          <p className="mt-6 text-xs text-[#42526E] dark:text-slate-400 text-center">
            {purpose === "collaboration" && "Perfect for real-time team collaboration"}
            {purpose === "knowledge" && "Great for documentation and guides"}
            {purpose === "custom" && "Configure it just how you need it"}
          </p>
        </div>
      </div>
    </div>
  );
}
