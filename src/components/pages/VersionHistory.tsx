"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate, getInitials } from "@/lib/utils";
import { Eye, RotateCcw, Loader2 } from "lucide-react";

const Editor = dynamic(() => import("@/components/editor/Editor"), { ssr: false });

interface Version {
  id: string;
  version_number: number;
  title: string;
  content: string;
  created_at: string;
  profiles: { id: string; full_name: string; avatar_url: string } | null;
}

interface VersionHistoryProps {
  pageId: string;
  spaceId: string;
}

export default function VersionHistory({ pageId, spaceId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<Version | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/versions`)
      .then((r) => r.json())
      .then((data) => {
        setVersions(data);
        setLoading(false);
      });
  }, [pageId]);

  async function handleRestore(version: Version) {
    setRestoring(true);
    const resp = await fetch(`/api/pages/${pageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: version.title, content: version.content }),
    });
    setRestoring(false);
    if (resp.ok) {
      toast.success(`Restored to version ${version.version_number}`);
      setPreview(null);
    } else {
      toast.error("Failed to restore version");
    }
  }

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (versions.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <p>No versions yet. Publish the page to create a version snapshot.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-2">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">Versions</h2>
        {versions.map((v) => (
          <div
            key={v.id}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${preview?.id === v.id ? "border-primary bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"}`}
            onClick={() => setPreview(v)}
          >
            <div className="flex items-center justify-between mb-1">
              <Badge variant="outline">v{v.version_number}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(v.created_at)}</span>
            </div>
            <p className="text-sm font-medium truncate">{v.title || "Untitled"}</p>
            {v.profiles && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={v.profiles.avatar_url} />
                  <AvatarFallback className="text-[9px] bg-blue-500 text-white">
                    {getInitials(v.profiles.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{v.profiles.full_name}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="lg:col-span-2">
        {preview ? (
          <div className="border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div>
                <span className="font-semibold">{preview.title || "Untitled"}</span>
                <span className="text-sm text-muted-foreground ml-2">v{preview.version_number}</span>
              </div>
              <Button
                size="sm"
                onClick={() => handleRestore(preview)}
                disabled={restoring}
              >
                {restoring ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <RotateCcw className="h-3 w-3 mr-1.5" />}
                Restore this version
              </Button>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              <Editor content={preview.content} onChange={() => {}} editable={false} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed rounded-xl">
            <Eye className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">Select a version to preview</p>
          </div>
        )}
      </div>
    </div>
  );
}
