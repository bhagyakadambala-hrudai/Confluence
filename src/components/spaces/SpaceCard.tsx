import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface Space {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  created_at: string;
  owner_id: string;
}

interface SpaceCardProps {
  space: Space;
  currentUserId: string;
}

export default function SpaceCard({ space, currentUserId }: SpaceCardProps) {
  return (
    <Link href={`/spaces/${space.id}`}>
      <div className="group flex items-start gap-3 p-4 rounded-lg border border-[#DFE1E6] dark:border-slate-700 hover:border-[#0052CC] dark:hover:border-blue-500 hover:shadow-sm transition-all cursor-pointer bg-white dark:bg-slate-800">
        <div className="h-10 w-10 rounded-lg bg-[#DEEBFF] dark:bg-blue-900/40 flex items-center justify-center text-2xl shrink-0">
          {space.emoji || "📁"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-[#172B4D] dark:text-slate-200 truncate group-hover:text-[#0052CC] dark:group-hover:text-blue-400 transition-colors">
              {space.name}
            </h3>
            {space.owner_id === currentUserId && (
              <span className="text-[10px] font-medium text-[#0052CC] dark:text-blue-400 bg-[#DEEBFF] dark:bg-blue-900/40 px-1.5 py-0.5 rounded shrink-0">
                Owner
              </span>
            )}
          </div>
          {space.description && (
            <p className="text-xs text-[#6B778C] dark:text-slate-400 mt-0.5 line-clamp-2">
              {space.description}
            </p>
          )}
          <p className="text-[11px] text-[#97A0AF] dark:text-slate-500 mt-1.5">
            {formatRelativeTime(space.created_at)}
          </p>
        </div>
      </div>
    </Link>
  );
}
