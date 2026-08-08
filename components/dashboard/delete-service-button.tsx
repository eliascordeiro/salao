"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteServiceButtonProps {
  serviceId: string
  serviceName: string
}

export function DeleteServiceButton({ serviceId, serviceName }: DeleteServiceButtonProps) {
  const router = useRouter()
  const t = useTranslations("services")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm", { name: serviceName }))) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(t("deleteError"))
      }

      router.refresh()
    } catch (error) {
      alert(t("deleteErrorRetry"))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  )
}
