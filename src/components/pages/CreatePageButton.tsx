"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreatePageButtonProps {
  spaceId: string;
  parentId?: string;
  className?: string;
}

export default function CreatePageButton({ spaceId, parentId, className }: CreatePageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const resp = await fetch("/api/pages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        space_id: spaceId,
        parent_id: parentId || null,
        title: "Untitled",
        content: "",
        emoji: "📄",
      }),
    });
    setLoading(false);
    if (resp.ok) {
      const page = await resp.json();
      router.push(`/spaces/${spaceId}/pages/${page.id}/edit`);
    } else {
      toast.error("Failed to create page");
    }
  }

  return (
    <Button onClick={handleCreate} disabled={loading} size="sm" className={cn(className)}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
      New Page
    </Button>
  );
}
