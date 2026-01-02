"use client";

import { useState } from "react";
import { UserPlus, UserCheck, UserX } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { LinkUserDialog } from "./link-user-dialog";

interface LinkUserButtonProps {
  staffId: string;
  staffName: string;
  staffEmail: string;
  staffPhone?: string;
  hasUser: boolean;
  userActive?: boolean;
}

export function LinkUserButton({
  staffId,
  staffName,
  staffEmail,
  staffPhone,
  hasUser,
  userActive,
}: LinkUserButtonProps) {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <GradientButton
        variant={hasUser ? (userActive ? "success" : "warning") : "accent"}
        className="w-full text-xs"
        onClick={() => setShowDialog(true)}
      >
        {hasUser ? (
          <>
            {userActive ? (
              <UserCheck className="h-3.5 w-3.5" />
            ) : (
              <UserX className="h-3.5 w-3.5" />
            )}
            Portal
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            Config. Portal
          </>
        )}
      </GradientButton>

      {showDialog && (
        <LinkUserDialog
          staffId={staffId}
          staffName={staffName}
          staffEmail={staffEmail}
          staffPhone={staffPhone}
          hasUser={hasUser}
          userActive={userActive}
          onClose={() => setShowDialog(false)}
          onSuccess={() => {
            setShowDialog(false);
          }}
        />
      )}
    </>
  );
}
