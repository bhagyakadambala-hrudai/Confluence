"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CreateSpaceModal from "@/components/spaces/CreateSpaceModal";

export default function NewSpacePage() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <CreateSpaceModal
      open={open}
      onClose={() => { setOpen(false); router.push("/"); }}
      onCreated={(space) => {
        setOpen(false);
        router.push(`/spaces/${space.id}`);
      }}
    />
  );
}
