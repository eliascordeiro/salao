"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { LinkUserDialog } from "./link-user-dialog";

interface LinkUserButtonProps {
  staffId: string;
  staffName: string;
  staffEmail: string;
  hasUser: boolean;
}

export function LinkUserButton({
  staffId,
  staffName,
  staffEmail,
  hasUser,
}: LinkUserButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <GradientButton
        variant={hasUser ? "primary" : "accent"}
        className="w-full text-xs"
        onClick={() => setShowDialog(true)}
      >
        {hasUser ? (
          <>
            <UserCheck className="h-3.5 w-3.5" />
            Conta
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            Criar Conta
          </>
        )}
      </GradientButton>

      {showDialog && (
        <LinkUserDialog
          staffId={staffId}
          staffName={staffName}
          staffEmail={staffEmail}
          hasUser={hasUser}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
          }}
        />
      )}
    </>
  );
}
