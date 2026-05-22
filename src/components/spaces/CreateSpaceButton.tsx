"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CreateSpaceModal from "./CreateSpaceModal";
import { Plus } from "lucide-react";

export default function CreateSpaceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        New Space
      </Button>
      <CreateSpaceModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(space) => {
          setOpen(false);
          router.push(`/spaces/${space.id}`);
          router.refresh();
        }}
      />
    </>
  );
}
