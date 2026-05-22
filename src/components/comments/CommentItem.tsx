"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { Reply, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";

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

interface CommentItemProps {
  comment: Comment;
  replies?: Comment[];
  pageId: string;
  currentUserId: string;
  onReply: (reply: Comment) => void;
  onEdit: (updated: Comment) => void;
  onDelete: (id: string) => void;
}

export default function CommentItem({ comment, replies = [], pageId, currentUserId, onReply, onEdit, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);

  const isOwner = comment.author_id === currentUserId;
  const name = comment.profiles?.full_name || "User";

  async function handleEdit() {
    if (!editContent.trim()) return;
    setLoading(true);
    const resp = await fetch(`/api/comments/${comment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    setLoading(false);
    if (resp.ok) {
      const updated = await resp.json();
      onEdit(updated);
      setEditing(false);
      toast.success("Comment updated");
    } else {
      toast.error("Failed to update comment");
    }
  }

  async function handleDelete() {
    const resp = await fetch(`/api/comments/${comment.id}`, { method: "DELETE" });
    if (resp.ok) {
      onDelete(comment.id);
      toast.success("Comment deleted");
    } else {
      toast.error("Failed to delete comment");
    }
  }

  async function handleReply() {
    if (!replyContent.trim()) return;
    setLoading(true);
    const resp = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_id: pageId, content: replyContent.trim(), parent_id: comment.id }),
    });
    setLoading(false);
    if (resp.ok) {
      const reply = await resp.json();
      onReply(reply);
      setReplyContent("");
      setReplying(false);
      toast.success("Reply added");
    } else {
      toast.error("Failed to add reply");
    }
  }

  return (
    <div>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url} />
          <AvatarFallback className="text-xs bg-blue-500 text-white">{getInitials(name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{name}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(comment.created_at)}</span>
          </div>

          {editing ? (
            <div>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleEdit} disabled={loading}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditing(false); setEditContent(comment.content); }}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {!editing && (
            <div className="flex items-center gap-2 mt-1.5">
              <button onClick={() => setReplying(!replying)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <Reply className="h-3 w-3" /> Reply
              </button>
              {isOwner && (
                <>
                  <button onClick={() => setEditing(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                    <Edit2 className="h-3 w-3" /> Edit
                  </button>
                  <button onClick={handleDelete} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="text-sm resize-none"
              />
              <div className="flex gap-1.5 mt-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleReply} disabled={loading || !replyContent.trim()}>
                  {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Reply
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setReplying(false); setReplyContent(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-11 mt-3 pl-3 border-l border-border space-y-3">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              pageId={pageId}
              currentUserId={currentUserId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
