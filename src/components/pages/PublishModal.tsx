"use client";

import { useState } from "react";
import { Lock, Pencil, MoreHorizontal, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MovePageModal from "@/components/pages/MovePageModal";

interface PublishModalProps {
  page: {
    id: string;
    title: string;
    space_id: string;
    parent_id: string | null;
  };
  space: { id: string; name: string; emoji: string } | null;
  parentPage: { id: string; title: string; emoji: string } | null;
  onPublish: () => Promise<void>;
  onClose: () => void;
}

export default function PublishModal({
  page,
  space,
  parentPage,
  onPublish,
  onClose,
}: PublishModalProps) {
  const [publishing, setPublishing] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

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

  if (showMoveModal) {
    return (
      <MovePageModal
        pageId={page.id}
        currentSpaceId={page.space_id}
        onClose={() => setShowMoveModal(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-[460px] mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="relative h-40 bg-gradient-to-b from-[#E3F2FD] to-[#BBDEFB] flex items-center justify-center">
          <span className="text-[4rem] leading-none select-none">📖</span>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded hover:bg-white/40 transition-colors"
          >
            <X className="h-4 w-4 text-[#42526E]" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          {/* Location row */}
          <div>
            <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">
              Location
            </label>
            <button
              onClick={() => setShowMoveModal(true)}
              className="w-full border border-[#DFE1E6] rounded-lg px-3 py-2.5 flex items-center gap-2 text-sm text-[#172B4D] hover:border-[#0052CC] transition-colors"
            >
              <span className="flex items-center gap-1 flex-1 min-w-0 text-left">
                <span>{space?.emoji ?? "🌐"}</span>
                <span className="font-medium truncate">{space?.name ?? "Unknown space"}</span>
                {parentPage && (
                  <>
                    <span className="text-[#97A0AF]">/</span>
                    <span className="truncate">{parentPage.title}</span>
                  </>
                )}
                <span className="text-[#97A0AF]">/</span>
              </span>
              <Pencil className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            </button>
          </div>

          {/* General access row */}
          <div>
            <label className="block text-xs font-semibold text-[#6B778C] mb-1.5">
              General access
            </label>
            <div className="border border-[#DFE1E6] rounded-lg px-3 py-2.5 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#42526E] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#172B4D]">Open</p>
                <p className="text-xs text-[#6B778C]">Anyone in this space can view and edit</p>
              </div>
              <Pencil className="h-3.5 w-3.5 text-[#6B778C] shrink-0" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#F4F5F7]">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-8 w-8 flex items-center justify-center rounded hover:bg-[#F4F5F7] transition-colors text-[#42526E]">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => toast("Coming soon")}>
                More options
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast("Coming soon")}>
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
        </div>
      </div>
    </div>
  );
}
