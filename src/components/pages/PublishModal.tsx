"use client";

import { useState } from "react";
import {
  Lock, Pencil, MoreHorizontal, X, Loader2,
  ChevronDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MovePageModal from "@/components/pages/MovePageModal";

interface PublishModalProps {
  page: {
    id: string;
    title: string;
    content: string;
    space_id: string;
    parent_id: string | null;
  };
  space: { id: string; name: string; emoji: string } | null;
  parentPage: { id: string; title: string; emoji: string } | null;
  onPublish: () => Promise<void>;
  onClose: () => void;
}

/* ── Inline calendar picker ── */
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function CalendarPicker({
  value, onChange, onClose,
}: { value: Date | null; onChange: (d: Date) => void; onClose: () => void }) {
  const now = new Date();
  const [view, setView]     = useState(new Date(value ?? now));
  const [sel, setSel]       = useState(new Date(value ?? now));
  const [time, setTime]     = useState(
    value
      ? `${String(value.getHours()).padStart(2,"0")}:${String(value.getMinutes()).padStart(2,"0")}`
      : "09:00"
  );

  const yr = view.getFullYear();
  const mo = view.getMonth();
  const firstDay     = new Date(yr, mo, 1).getDay();
  const daysInMonth  = new Date(yr, mo + 1, 0).getDate();
  const daysInPrev   = new Date(yr, mo, 0).getDate();

  const cells: { day: number; cur: boolean; date: Date }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, cur: false, date: new Date(yr, mo - 1, daysInPrev - i) });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, cur: true, date: new Date(yr, mo, d) });
  while (cells.length < 42)
    cells.push({ day: cells.length - daysInMonth - firstDay + 1, cur: false, date: new Date(yr, mo + 1, cells.length - daysInMonth - firstDay + 1) });

  function handleOk() {
    const [h, m] = time.split(":").map(Number);
    const result = new Date(sel);
    result.setHours(h || 0, m || 0, 0, 0);
    onChange(result);
    onClose();
  }

  const isToday    = (d: Date) => d.toDateString() === now.toDateString();
  const isSelected = (d: Date) => d.toDateString() === sel.toDateString();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="absolute right-0 top-full mt-1 z-[60] bg-white rounded-xl shadow-2xl border border-[#DFE1E6] p-4 w-[272px]">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex gap-0.5">
          <button onClick={() => setView(new Date(yr - 1, mo, 1))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4]"><ChevronsLeft className="h-3.5 w-3.5 text-[#42526E]" /></button>
          <button onClick={() => setView(new Date(yr, mo - 1, 1))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4]"><ChevronLeft className="h-3.5 w-3.5 text-[#42526E]" /></button>
        </div>
        <span className="text-sm font-semibold text-[#172B4D]">{MONTHS[mo]} {yr}</span>
        <div className="flex gap-0.5">
          <button onClick={() => setView(new Date(yr, mo + 1, 1))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4]"><ChevronRight className="h-3.5 w-3.5 text-[#42526E]" /></button>
          <button onClick={() => setView(new Date(yr + 1, mo, 1))} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#F1F2F4]"><ChevronsRight className="h-3.5 w-3.5 text-[#42526E]" /></button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {DAYS.map((d) => <div key={d} className="text-center text-[10px] font-semibold text-[#6B778C] py-1">{d}</div>)}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => cell.cur && setSel(cell.date)}
            className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full text-xs transition-colors ${
              !cell.cur        ? "text-[#C1C7D0] cursor-default" :
              isSelected(cell.date) ? "bg-[#0052CC] text-white font-semibold" :
              isToday(cell.date)    ? "border border-[#0052CC] text-[#0052CC] font-semibold hover:bg-[#DEEBFF]" :
              "text-[#172B4D] hover:bg-[#F1F2F4]"
            }`}
          >
            {cell.day}
          </button>
        ))}
      </div>

      {/* Time row */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#F1F2F4]">
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="border border-[#DFE1E6] rounded px-2 py-1 text-sm text-[#172B4D] outline-none focus:border-[#0052CC] w-24"
        />
        <span className="text-xs text-[#6B778C] flex-1 truncate">{tz}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          onClick={() => { setSel(now); setTime("09:00"); }}
          className="px-3 py-1.5 text-xs text-[#42526E] border border-[#DFE1E6] hover:bg-[#F1F2F4] rounded transition-colors"
        >Reset</button>
        <button
          onClick={handleOk}
          className="px-4 py-1.5 text-xs bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors"
        >OK</button>
      </div>
    </div>
  );
}

/* ── Main modal ── */
export default function PublishModal({ page, space, parentPage, onPublish, onClose }: PublishModalProps) {
  const [publishing, setPublishing]         = useState(false);
  const [showMoveModal, setShowMoveModal]   = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showPreview, setShowPreview]       = useState(false);
  const [versionComment, setVersionComment] = useState("");
  const [publishAs, setPublishAs]           = useState<"Page" | "Blog">("Page");
  const [scheduledDate, setScheduledDate]   = useState<Date | null>(null);
  const [showCalendar, setShowCalendar]     = useState(false);

  async function handlePublish() {
    setPublishing(true);
    try {
      await onPublish();
      onClose();
    } catch {
      toast.error("Failed to publish");
    } finally {
      setPublishing(false);
    }
  }

  /* ── Preview overlay ── */
  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[#E8EAED] sticky top-0 bg-white">
          <nav className="flex items-center gap-1.5 text-sm text-[#6B778C]">
            <span className="text-[#172B4D] font-medium">{space?.name ?? "Space"}</span>
            <span>/</span>
            {parentPage ? (
              <>
                <span>...</span>
                <span>/</span>
                <span className="text-[#0052CC]">{page.title || "Untitled"}</span>
              </>
            ) : (
              <span className="text-[#0052CC]">{page.title || "Untitled"}</span>
            )}
          </nav>
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-1.5 text-sm bg-[#0052CC] hover:bg-[#0065FF] text-white rounded font-semibold transition-colors"
          >
            Back
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-10">
          <h1 className="text-3xl font-bold text-[#172B4D] mb-6">{page.title || "Untitled"}</h1>
          <div
            className="prose prose-slate max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(page.content || "") }}
          />
        </div>
      </div>
    );
  }

  /* ── Move sub-modal ── */
  if (showMoveModal) {
    return (
      <MovePageModal
        pageId={page.id}
        currentSpaceId={page.space_id}
        onClose={() => setShowMoveModal(false)}
      />
    );
  }

  /* ── Main modal ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[460px] mx-4 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Illustration header */}
        <div className="relative h-40 bg-gradient-to-b from-[#E3F2FD] to-[#BBDEFB] flex items-center justify-center rounded-t-xl overflow-hidden">
          {/* Simple SVG illustration */}
          <svg viewBox="0 0 200 120" className="h-32 w-auto drop-shadow-md" fill="none">
            {/* Book */}
            <rect x="55" y="20" width="90" height="80" rx="4" fill="white" stroke="#90CAF9" strokeWidth="1.5"/>
            <rect x="55" y="20" width="45" height="80" rx="4" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="1.5"/>
            <line x1="100" y1="22" x2="100" y2="98" stroke="#90CAF9" strokeWidth="1.5"/>
            {/* Lines on right page */}
            <line x1="108" y1="38" x2="135" y2="38" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            <line x1="108" y1="48" x2="138" y2="48" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            <line x1="108" y1="58" x2="132" y2="58" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            <line x1="108" y1="68" x2="136" y2="68" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2"/>
            {/* Bookmark ribbon */}
            <rect x="126" y="18" width="8" height="20" rx="1" fill="#FFCC02"/>
            <polygon points="126,38 134,38 130,44" fill="#FFCC02"/>
            {/* Pencil */}
            <g transform="rotate(-35, 150, 30)">
              <rect x="142" y="10" width="8" height="40" rx="1" fill="#42A5F5"/>
              <polygon points="142,50 150,50 146,60" fill="#FFA726"/>
              <rect x="142" y="8" width="8" height="4" rx="1" fill="#90CAF9"/>
            </g>
            {/* Coffee cup */}
            <rect x="22" y="75" width="22" height="16" rx="3" fill="#29B6F6"/>
            <path d="M44 82 Q52 82 52 88 Q52 94 44 94" stroke="#29B6F6" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <ellipse cx="33" cy="75" rx="11" ry="3" fill="#4FC3F7"/>
            {/* Post-it */}
            <rect x="152" y="70" width="28" height="24" rx="2" fill="#FFF176" transform="rotate(8, 166, 82)"/>
          </svg>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded hover:bg-white/40 transition-colors"
          >
            <X className="h-4 w-4 text-[#42526E]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-2 space-y-4">
          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">Location</label>
            <button
              onClick={() => setShowMoveModal(true)}
              className="w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-[#172B4D] hover:border-[#0052CC] transition-colors"
            >
              <span className="shrink-0">{space?.emoji ?? "🌐"}</span>
              <span className="flex items-center gap-1 flex-1 min-w-0 text-left truncate">
                <span className="font-medium shrink-0">{space?.name ?? "Unknown space"}</span>
                <span className="text-[#97A0AF] shrink-0">/</span>
                <span className="shrink-0">{space?.name ?? ""}</span>
                {parentPage && (
                  <>
                    <span className="text-[#97A0AF] shrink-0">/</span>
                    <span className="truncate">{parentPage.title}</span>
                  </>
                )}
                <span className="text-[#97A0AF] shrink-0">/</span>
              </span>
              <Pencil className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            </button>
          </div>

          {/* General access */}
          <div>
            <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">General access</label>
            <div className="border border-[#DFE1E6] rounded-lg px-3 py-2.5 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg border border-[#DFE1E6] flex items-center justify-center shrink-0">
                <Lock className="h-4 w-4 text-[#42526E]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#172B4D]">Open</p>
                <p className="text-xs text-[#6B778C]">Anyone in this space can view and edit</p>
              </div>
              <Pencil className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            </div>
          </div>

          {/* ── More options expanded fields ── */}
          {showMoreOptions && (
            <>
              {/* Version comments */}
              <div>
                <label className="block text-sm font-medium text-[#172B4D] mb-1.5">Version comments</label>
                <input
                  type="text"
                  value={versionComment}
                  onChange={(e) => setVersionComment(e.target.value)}
                  placeholder="Describe this version"
                  className="w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 text-sm text-[#172B4D] placeholder:text-[#97A0AF] outline-none focus:border-[#0052CC] transition-colors"
                />
              </div>

              {/* Schedule publish */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#172B4D]">Schedule publish</span>
                  <span
                    className="h-4 w-4 rounded-full bg-[#97A0AF] text-white text-[9px] flex items-center justify-center font-bold cursor-help"
                    title="Choose when this page becomes visible"
                  >i</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowCalendar((v) => !v)}
                    className="flex items-center gap-1.5 border border-[#0052CC] text-[#0052CC] rounded px-3 py-1.5 text-sm font-medium hover:bg-[#DEEBFF] transition-colors"
                  >
                    {scheduledDate
                      ? scheduledDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : "Immediately"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {showCalendar && (
                    <CalendarPicker
                      value={scheduledDate}
                      onChange={(d) => { setScheduledDate(d); setShowCalendar(false); }}
                      onClose={() => setShowCalendar(false)}
                    />
                  )}
                </div>
              </div>

              {/* Publish as */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[#172B4D]">Publish as</span>
                  <span
                    className="h-4 w-4 rounded-full bg-[#97A0AF] text-white text-[9px] flex items-center justify-center font-bold cursor-help"
                    title="Choose the content type"
                  >i</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 border border-[#0052CC] text-[#0052CC] rounded px-3 py-1.5 text-sm font-medium hover:bg-[#DEEBFF] transition-colors">
                      {publishAs}
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-28">
                    <DropdownMenuItem
                      onClick={() => setPublishAs("Page")}
                      className={publishAs === "Page" ? "bg-[#DEEBFF] text-[#0052CC]" : ""}
                    >Page</DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setPublishAs("Blog")}
                      className={publishAs === "Blog" ? "bg-[#DEEBFF] text-[#0052CC]" : ""}
                    >Blog</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center px-5 py-4 border-t border-[#F4F5F7] ${showMoreOptions ? "justify-between" : "justify-end gap-2"}`}>
          {showMoreOptions ? (
            <>
              <button
                onClick={() => setShowMoreOptions(false)}
                className="px-3 py-2 text-sm text-[#42526E] border border-[#DFE1E6] hover:bg-[#F4F5F7] rounded transition-colors font-medium"
              >
                Fewer options
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-3 py-2 text-sm text-[#42526E] border border-[#DFE1E6] hover:bg-[#F4F5F7] rounded transition-colors"
                >
                  Preview
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
                >
                  {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Publish
                </button>
              </div>
            </>
          ) : (
            <>
              {/* "..." right next to Publish */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 flex items-center justify-center rounded border border-[#DFE1E6] hover:bg-[#F4F5F7] transition-colors text-[#42526E]">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => setShowMoreOptions(true)}>
                    More options
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowPreview(true)}>
                    Preview
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2 bg-[#0052CC] hover:bg-[#0065FF] text-white text-sm font-semibold rounded transition-colors disabled:opacity-60"
              >
                {publishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Publish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
