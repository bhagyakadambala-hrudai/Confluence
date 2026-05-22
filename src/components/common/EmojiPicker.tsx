"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EmojiPickerComponent = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="w-64 h-64 animate-pulse bg-muted rounded-lg" />,
});

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  size?: "sm" | "md" | "lg";
}

export default function EmojiPicker({ value, onChange, size = "md" }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const sizeClasses = {
    sm: "text-xl w-8 h-8",
    md: "text-2xl w-10 h-10",
    lg: "text-4xl w-14 h-14",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`${sizeClasses[size]} flex items-center justify-center rounded-lg hover:bg-muted transition-colors border border-transparent hover:border-border`}
          type="button"
        >
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none shadow-xl" align="start">
        <EmojiPickerComponent
          onEmojiClick={(emojiData) => {
            onChange(emojiData.emoji);
            setOpen(false);
          }}
          width={320}
          height={400}
        />
      </PopoverContent>
    </Popover>
  );
}
