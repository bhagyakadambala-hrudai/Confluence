"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import InviteMemberModal from "./InviteMemberModal";
import { UserPlus } from "lucide-react";

interface InviteMemberButtonProps {
  spaceId: string;
}

export default function InviteMemberButton({ spaceId }: InviteMemberButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite
      </Button>
      <InviteMemberModal
        spaceId={spaceId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
