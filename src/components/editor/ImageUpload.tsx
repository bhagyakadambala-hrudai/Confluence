"use client";

import { useRef } from "react";
import type { Editor } from "@tiptap/react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  editor: Editor;
}

export default function ImageUpload({ editor }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const toastId = toast.loading("Uploading image...");
    const resp = await fetch("/api/upload", { method: "POST", body: formData });

    if (resp.ok) {
      const { url } = await resp.json();
      editor.chain().focus().setImage({ src: url }).run();
      toast.success("Image uploaded", { id: toastId });
    } else {
      toast.error("Failed to upload image", { id: toastId });
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "p-1.5 rounded text-sm transition-colors",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>Insert Image</TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
