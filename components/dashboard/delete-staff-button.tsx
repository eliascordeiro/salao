"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteStaffButtonProps {
  staffId: string;
  staffName: string;
}

export function DeleteStaffButton({ staffId, staffName }: DeleteStaffButtonProps) {
  const router = useRouter();
  const t = useTranslations("staff");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm", { name: staffName }))) {
      return;
    }

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("deleteError"));
      }

      router.refresh();
    } catch (error) {
      console.error("Erro ao deletar profissional:", error);
      alert(error instanceof Error ? error.message : t("deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      title={t("deleteTitle", { name: staffName })}
      className="aspect-square p-0 w-9 h-9"
    >
      {isDeleting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
}

