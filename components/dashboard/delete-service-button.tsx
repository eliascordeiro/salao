"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface DeleteServiceButtonProps {
  serviceId: string
  serviceName: string
}

export function DeleteServiceButton({ serviceId, serviceName }: DeleteServiceButtonProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja deletar o serviço "${serviceName}"? Esta ação não pode ser desfeita.`)) {
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Erro ao deletar serviço")
      }

      router.refresh()
    } catch (error) {
      alert("Erro ao deletar serviço. Tente novamente.")
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
