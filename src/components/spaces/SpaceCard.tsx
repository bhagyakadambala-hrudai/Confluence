import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { Users } from "lucide-react";

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
      <div className="border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer bg-card group">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{space.emoji || "📁"}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors truncate">
              {space.name}
            </h3>
            {space.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {space.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>{formatRelativeTime(space.created_at)}</span>
          {space.owner_id === currentUserId && (
            <Badge variant="secondary" className="text-xs">Owner</Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
