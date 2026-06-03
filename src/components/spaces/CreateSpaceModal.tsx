"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown, ChevronRight, Upload } from "lucide-react";
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

const ACCESS_OPTIONS = [
  { id: "default", label: "Default", description: "Use the access settings recommended by your admin" },
  { id: "copy", label: "Copy access settings", description: "Use another space's settings" },
  { id: "restricted", label: "Restricted", description: "Only you have access until you add others" },
] as const;

type AccessOption = (typeof ACCESS_OPTIONS)[number]["id"];

interface Feature {
  id: string;
  label: string;
  defaultOn: boolean;
}

const FEATURES: Feature[] = [
  { id: "blogs", label: "Blogs", defaultOn: false },
  { id: "live_docs", label: "Live docs", defaultOn: true },
  { id: "calendars", label: "Calendars", defaultOn: true },
  { id: "whiteboards", label: "Whiteboards", defaultOn: true },
  { id: "databases", label: "Databases", defaultOn: true },
  { id: "smart_links", label: "Smart Links", defaultOn: true },
  { id: "folders", label: "Folders", defaultOn: true },
];

/* ── Right panel illustrations ── */
function RightPanel({ purpose, spaceName, emoji }: { purpose: Purpose; spaceName: string; emoji: string }) {
  const configs = {
    collaboration: {
      bg: "from-[#E8F4FC] via-[#C8DFF5] to-[#B8D0EE]",
      illustration: (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-end gap-3">
            <div className="h-14 w-14 rounded-full bg-[#36B37E] flex items-center justify-center text-2xl shadow-lg">💬</div>
            <div className="h-10 w-10 rounded-full bg-[#0052CC] flex items-center justify-center text-lg shadow-md">💬</div>
          </div>
          <div className="text-xs font-semibold text-[#172B4D] dark:text-white mt-1">Collaborate in real time</div>
        </div>
      ),
      tagline: "Perfect for team collaboration",
    },
    knowledge: {
      bg: "from-[#FFF9E6] via-[#FFF0B3] to-[#FFE380]",
      illustration: (
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl">📚</div>
          <div className="text-xs font-semibold text-[#172B4D] dark:text-white mt-1">Share knowledge easily</div>
        </div>
      ),
      tagline: "Great for documentation",
    },
    custom: {
      bg: "from-[#E3FCEF] via-[#ABF5D1] to-[#79F2C0]",
      illustration: (
        <div className="flex flex-col items-center gap-2">
          <div className="text-6xl">💡</div>
          <div className="text-xs font-semibold text-[#172B4D] dark:text-white mt-1">Configured your way</div>
        </div>
      ),
      tagline: "Configure it just how you need it",
    },
  };

  const c = configs[purpose];

  return (
    <div className={`flex-1 bg-gradient-to-br ${c.bg} relative overflow-hidden flex flex-col`}>
      {/* Space preview card */}
      <div className="flex-1 flex items-start justify-center pt-12 px-6">
        <div className="w-full max-w-[240px]">
          <div className="bg-white dark:bg-[#1e2636] rounded-xl shadow-xl p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-semibold text-[#172B4D] dark:text-white truncate">
                {spaceName || "Your space"}
              </span>
            </div>
            <div className="text-xs font-semibold text-[#6B778C] mb-2">Content</div>
            <div className="space-y-1.5">
              {purpose === "collaboration" && ["Team goals", "Ideas", "Brainstorm", "Research", "Calendar"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#DFE1E6]" />
                  <span className="text-xs text-[#6B778C]">{item}</span>
                </div>
              ))}
              {purpose === "knowledge" && ["Health and medical benefits", "Retirement and financial be...", "Time off and leave", "Work-life balance and flexib...", "Employee recognition and r...", "Whiteboard", "Database"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#DFE1E6]" />
                  <span className="text-xs text-[#6B778C] truncate">{item}</span>
                </div>
              ))}
              {purpose === "custom" && ["Page", "Whiteboard", "Database", "Calendar"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#DFE1E6]" />
                  <span className="text-xs text-[#6B778C]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating accent */}
          <div className="ml-auto w-32 bg-white dark:bg-[#1e2636] rounded-xl shadow-lg p-3">
            <div className="text-xs font-bold text-[#172B4D] dark:text-white mb-1.5 truncate">
              {spaceName || (purpose === "knowledge" ? "Policies" : purpose === "custom" ? "Documents" : "Q3 Planning")}
            </div>
            <div className="space-y-1">
              {[70, 50, 85, 40].map((w, i) => (
                <div key={i} className={`h-1.5 rounded-full ${i === 2 ? "bg-[#36B37E]" : "bg-[#DFE1E6] dark:bg-[#30363d]"}`} style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom illustration */}
      <div className="flex justify-center pb-6 opacity-80">
        {c.illustration}
      </div>
    </div>
  );
}

/* ── Toggle switch ── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-[#36B37E]" : "bg-[#DFE1E6] dark:bg-[#30363d]"}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
    </button>
  );
}

export default function CreateSpaceModal({ open, onClose, onCreated }: CreateSpaceModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📝");
  const [purpose, setPurpose] = useState<Purpose>("collaboration");
  const [access, setAccess] = useState<AccessOption>("default");
  const [nameError, setNameError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showAccessDropdown, setShowAccessDropdown] = useState(false);
  const [features, setFeatures] = useState<Record<string, boolean>>(
    Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultOn]))
  );

  const iconPickerRef = useRef<HTMLDivElement>(null);
  const accessRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(e.target as Node)) setShowIconPicker(false);
      if (accessRef.current && !accessRef.current.contains(e.target as Node)) setShowAccessDropdown(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!open) return null;

  function handleNext() {
    if (!name.trim()) { setNameError(true); return; }
    setNameError(false);
    setStep(2);
  }

  function restoreDefaults() {
    setFeatures(Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultOn])));
  }

  async function handleCreate() {
    if (!name.trim()) return;
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
      onCreated(space);
    } else {
      const err = await resp.json();
      toast.error(err.error || "Failed to create space");
    }
  }

  function handleClose() {
    setStep(1); setName(""); setEmoji("📝"); setPurpose("collaboration");
    setAccess("default"); setNameError(false); setShowIconPicker(false);
    setFeatures(Object.fromEntries(FEATURES.map((f) => [f.id, f.defaultOn])));
    onClose();
  }

  const selectedAccess = ACCESS_OPTIONS.find((a) => a.id === access)!;
  const purposeLabel = purpose === "knowledge" ? "knowledge base" : purpose;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-5xl h-[90vh] max-h-[700px] bg-white dark:bg-[#1e2636] rounded-xl shadow-2xl flex overflow-hidden">

        {/* ── Left panel ── */}
        <div className="flex flex-col w-[55%] min-w-0 h-full">
          <div className="flex-1 overflow-y-auto px-10 py-8">

            {step === 1 ? (
              <>
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
                    onKeyDown={(e) => e.key === "Enter" && handleNext()}
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

                    {/* Icon picker dropdown */}
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

              </>
            ) : (
              /* ── Step 2 ── */
              <>
                <h1 className="text-2xl font-bold text-[#172B4D] dark:text-white mb-6">
                  Confirm your {purposeLabel} space
                </h1>

                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-[#172B4D] dark:text-white">Features</span>
                  <button className="text-sm text-[#0052CC] hover:underline">More about features</button>
                </div>

                <div className="border border-[#DFE1E6] dark:border-[#30363d] rounded-lg overflow-hidden mb-4">
                  {FEATURES.map((feat, i) => (
                    <div
                      key={feat.id}
                      className={`flex items-center justify-between px-4 py-3.5 ${
                        i < FEATURES.length - 1 ? "border-b border-[#DFE1E6] dark:border-[#30363d]" : ""
                      }`}
                    >
                      <span className="text-sm text-[#172B4D] dark:text-slate-200">{feat.label}</span>
                      <Toggle
                        on={features[feat.id] ?? feat.defaultOn}
                        onChange={(v) => setFeatures((prev) => ({ ...prev, [feat.id]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <button onClick={restoreDefaults} className="text-sm text-[#6B778C] dark:text-slate-400 hover:text-[#172B4D] dark:hover:text-white transition-colors">
                  Restore defaults
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-between px-10 py-4 border-t border-[#E8EAED] dark:border-[#30363d]">
            <span className="text-sm text-[#6B778C] dark:text-slate-400">Step {step} of 2</span>
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

        {/* ── Right panel ── */}
        <div className="flex-1 relative overflow-hidden">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-white/60 dark:bg-black/20 hover:bg-white/90 dark:hover:bg-black/40 transition-colors text-[#42526E] dark:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
          <RightPanel purpose={purpose} spaceName={name} emoji={emoji} />
        </div>
      </div>
    </div>
  );
}
