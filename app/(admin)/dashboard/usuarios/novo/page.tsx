"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { PERMISSION_GROUPS, OWNER_PERMISSIONS, Permission } from "@/lib/permissions"

export default function NovoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roleType: "CUSTOM" as const,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set())

  const handleTogglePermission = (permission: Permission) => {
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(permission)) {
        newSet.delete(permission)
      } else {
        newSet.add(permission)
      }
      return newSet
    })
  }

  const handleToggleGroup = (groupPermissions: Permission[]) => {
    const allSelected = groupPermissions.every((p) => selectedPermissions.has(p))
    setSelectedPermissions((prev) => {
      const newSet = new Set(prev)
      if (allSelected) {
        // Deselect all
        groupPermissions.forEach((p) => newSet.delete(p))
      } else {
        // Select all
        groupPermissions.forEach((p) => newSet.add(p))
      }
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email) {
      alert("Preencha todos os campos")
      return
    }

    if (selectedPermissions.size === 0) {
      alert("Selecione ao menos uma permissão")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          permissions: Array.from(selectedPermissions),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert("Usuário criado com sucesso! Um email foi enviado com as credenciais de acesso.")
        router.push("/dashboard/usuarios")
        router.refresh() // Força reload da página de destino
      } else {
        alert(data.error || "Erro ao criar usuário")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao criar usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Novo Usuário</h1>
          <p className="text-muted-foreground mt-1">
            Adicione um novo membro da equipe com permissões personalizadas
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Dados do Usuário</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: João Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@exemplo.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                Um email será enviado com as credenciais de acesso
              </p>
            </div>
          </div>
        </Card>

        {/* Permissões */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Permissões</h2>
            <div className="text-sm text-muted-foreground">
              {selectedPermissions.size} de {OWNER_PERMISSIONS.length} selecionadas
            </div>
          </div>

          <div className="space-y-4">
            {PERMISSION_GROUPS.map((group) => {
              const groupPermissions = group.permissions.map(p => p.key as Permission)
              const allSelected = groupPermissions.every((p) => selectedPermissions.has(p))
              const someSelected = groupPermissions.some((p) => selectedPermissions.has(p))

              return (
                <div key={group.label} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{group.label}</h3>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant={allSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleGroup(groupPermissions)}
                    >
                      {allSelected ? "Desmarcar Todos" : "Marcar Todos"}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {group.permissions.map((permissionItem) => {
                      const permission = permissionItem.key as Permission
                      return (
                        <label
                          key={permission}
                          className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.has(permission)}
                            onChange={() => handleTogglePermission(permission)}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                          <span className="text-sm font-medium">
                            {permissionItem.label}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Preview de Permissões Selecionadas */}
        {selectedPermissions.size > 0 && (
          <Card className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Resumo das Permissões</h2>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedPermissions).map((permission) => (
                <span
                  key={permission}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {permission}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Criando...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Criar e Enviar Convite
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
