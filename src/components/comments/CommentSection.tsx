"use client";

import { useState, useEffect } from "react";
import CommentItem from "./CommentItem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Comment {
  id: string;
  content: string;
  author_id: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles: Profile | null;
}

interface CommentSectionProps {
  pageId: string;
  currentUserId: string;
}

export default function CommentSection({ pageId, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [pageId]);

  async function fetchComments() {
    setLoading(true);
    const resp = await fetch(`/api/comments?page_id=${pageId}`);
    if (resp.ok) setComments(await resp.json());
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    const resp = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: pageId, content: newComment.trim() }),
    });
    setSubmitting(false);
    if (resp.ok) {
      const comment = await resp.json();
      setComments((prev) => [...prev, comment]);
      setNewComment("");
      toast.success("Comment added");
    } else {
      toast.error("Failed to add comment");
    }
  }

  function handleReply(reply: Comment) {
    setComments((prev) => [...prev, reply]);
  }

  function handleEdit(updated: Comment) {
    setComments((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }

  function handleDelete(id: string) {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

  const topLevel = comments.filter((c) => !c.parent_id);
  const replies = comments.filter((c) => !!c.parent_id);

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Comments ({comments.length})</h3>
      </div>

      <div className="mb-6">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex justify-end mt-2">
          <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()} size="sm">
            {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : null}
            Comment
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/4 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : topLevel.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={replies.filter((r) => r.parent_id === comment.id)}
              pageId={pageId}
              currentUserId={currentUserId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
