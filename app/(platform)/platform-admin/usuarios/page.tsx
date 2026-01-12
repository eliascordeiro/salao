"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Users, Mail, Phone, CheckCircle2, XCircle, Store, Calendar, Crown, User } from "lucide-react"

interface UserData {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  roleType: string | null
  active: boolean
  createdAt: string
  _count: {
    bookings: number
    ownedSalons: number
  }
}

const roleLabels: Record<string, string> = {
  PLATFORM_ADMIN: "Super Admin",
  ADMIN: "Dono de Salão",
  CLIENT: "Cliente",
  STAFF: "Funcionário",
}

const roleColors: Record<string, string> = {
  PLATFORM_ADMIN: "bg-gradient-to-r from-yellow-500 to-orange-500",
  ADMIN: "bg-gradient-to-r from-purple-600 to-pink-600",
  CLIENT: "bg-gradient-to-r from-blue-600 to-cyan-600",
  STAFF: "bg-gradient-to-r from-green-600 to-emerald-600",
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [search, roleFilter, statusFilter, page])

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (search) params.append("search", search)
      if (roleFilter !== "all") params.append("role", roleFilter)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/platform/users?${params}`)
      const data = await response.json()

      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Erro ao buscar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleUserStatus(userId: string, currentStatus: boolean) {
    try {
      const response = await fetch("/api/platform/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          active: !currentStatus,
        }),
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os usuários cadastrados na plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          {/* Filtros de Role e Status */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={roleFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setRoleFilter("all")
                setPage(1)
              }}
            >
              Todos
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "PLATFORM_ADMIN" ? "default" : "outline"}
              onClick={() => {
                setRoleFilter("PLATFORM_ADMIN")
                setPage(1)
              }}
            >
              <Crown className="h-3 w-3 mr-1" />
              Super Admin
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "ADMIN" ? "default" : "outline"}
              onClick={() => {
                setRoleFilter("ADMIN")
                setPage(1)
              }}
            >
              <Store className="h-3 w-3 mr-1" />
              Donos de Salão
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "CLIENT" ? "default" : "outline"}
              onClick={() => {
                setRoleFilter("CLIENT")
                setPage(1)
              }}
            >
              <User className="h-3 w-3 mr-1" />
              Clientes
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("all")
                  setPage(1)
                }}
              >
                Todos
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "active" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("active")
                  setPage(1)
                }}
              >
                Ativos
              </Button>
              <Button
                size="sm"
                variant={statusFilter === "inactive" ? "default" : "outline"}
                onClick={() => {
                  setStatusFilter("inactive")
                  setPage(1)
                }}
              >
                Inativos
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando usuários...</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
          <p className="text-muted-foreground">
            {search ? "Tente ajustar os filtros de busca" : "Ainda não há usuários cadastrados"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {users.map((user) => (
            <Card key={user.id} className="glass-card p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white shrink-0 ${roleColors[user.role] || "bg-gray-500"}`}>
                  <span className="text-lg font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Nome e Role */}
                  <h3 className="font-semibold truncate">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                      {roleLabels[user.role] || user.role}
                    </span>
                    {user.active ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </span>
                    )}
                  </div>

                  {/* Contato */}
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="truncate text-muted-foreground">{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate text-muted-foreground">{user.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    {user.role === "ADMIN" && (
                      <div className="flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        <span>{user._count.ownedSalons} salão(ões)</span>
                      </div>
                    )}
                    {user.role === "CLIENT" && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{user._count.bookings} agendamentos</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>desde {new Date(user.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                  </div>

                  {/* Ações */}
                  {user.role !== "PLATFORM_ADMIN" && (
                    <div className="mt-4">
                      <Button
                        size="sm"
                        variant={user.active ? "destructive" : "default"}
                        onClick={() => toggleUserStatus(user.id, user.active)}
                        className="w-full"
                      >
                        {user.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} • {total} usuários no total
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
