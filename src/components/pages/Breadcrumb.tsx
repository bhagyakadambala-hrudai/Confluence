import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbProps {
  space: { id: string; name: string; emoji: string } | null;
  parentPage: { id: string; title: string; emoji: string } | null;
  currentPage: { title: string; emoji: string };
  spaceId: string;
}

export default function Breadcrumb({ space, parentPage, currentPage, spaceId }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
      <Link href="/home" className="hover:text-foreground shrink-0">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {space && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/spaces/${space.id}`}
            className="hover:text-foreground flex items-center gap-1 shrink-0"
          >
            <span>{space.emoji}</span>
            <span className="truncate max-w-24">{space.name}</span>
          </Link>
        </>
      )}
      {parentPage && (
        <>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          <Link
            href={`/spaces/${spaceId}/pages/${parentPage.id}`}
            className="hover:text-foreground flex items-center gap-1 shrink-0"
          >
            <span>{parentPage.emoji}</span>
            <span className="truncate max-w-24">{parentPage.title || "Untitled"}</span>
          </Link>
        </>
      )}
      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
      <span className="text-foreground font-medium flex items-center gap-1 truncate">
        <span>{currentPage.emoji}</span>
        <span className="truncate max-w-32">{currentPage.title || "Untitled"}</span>
      </span>
    </nav>
  );
}
