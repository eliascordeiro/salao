"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { PERMISSION_GROUPS, Permission } from "@/lib/permissions"

interface User {
  id: string
  name: string
  email: string
  roleType: string
  permissions: string[]
  active: boolean
}

export default function EditarUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    active: true,
  })
  const [selectedPermissions, setSelectedPermissions] = useState<Set<Permission>>(new Set())

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/users")
      if (res.ok) {
        const data = await res.json()
        const foundUser = data.users.find((u: User) => u.id === userId)
        
        if (foundUser) {
          setUser(foundUser)
          setFormData({
            name: foundUser.name,
            active: foundUser.active,
          })
          setSelectedPermissions(new Set(foundUser.permissions as Permission[]))
        } else {
          alert("Usuário não encontrado")
          router.back()
        }
      }
    } catch (error) {
      console.error("Erro ao carregar usuário:", error)
      alert("Erro ao carregar usuário")
    } finally {
      setLoading(false)
    }
  }

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
        groupPermissions.forEach((p) => newSet.delete(p))
      } else {
        groupPermissions.forEach((p) => newSet.add(p))
      }
      return newSet
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert("Preencha o nome")
      return
    }

    if (selectedPermissions.size === 0) {
      alert("Selecione ao menos uma permissão")
      return
    }

    setSaving(true)

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          permissions: Array.from(selectedPermissions),
          active: formData.active,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert("Usuário atualizado com sucesso!")
        router.push("/dashboard/usuarios")
      } else {
        alert(data.error || "Erro ao atualizar usuário")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao atualizar usuário")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <p className="text-lg">Usuário não encontrado</p>
        </Card>
      </div>
    )
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
          <h1 className="text-3xl font-bold">Editar Usuário</h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações e permissões do usuário
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                O email não pode ser alterado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <Label htmlFor="active" className="cursor-pointer">
              Usuário ativo (desmarque para desativar o acesso)
            </Label>
          </div>
        </Card>

        {/* Permissões */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Permissões</h2>
            <div className="text-sm text-muted-foreground">
              {selectedPermissions.size} permissões selecionadas
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
                      variant={allSelected ? "default" : someSelected ? "secondary" : "outline"}
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

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
