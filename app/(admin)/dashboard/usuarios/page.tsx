"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, Edit, Trash2, Mail, CheckCircle, XCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/header"
import { GridBackground } from "@/components/ui/grid-background"

interface ManagedUser {
  id: string
  name: string
  email: string
  roleType: string
  permissions: string[]
  active: boolean
  createdAt: string
}

export default function UsuariosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [resendingInvite, setResendingInvite] = useState<string | null>(null)

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers()
    }
  }, [status])

  // Recarrega lista quando a página ganha foco (volta de outra página)
  useEffect(() => {
    const handleFocus = () => {
      if (status === "authenticated") {
        fetchUsers()
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [status])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/users", {
        cache: "no-store", // Força buscar dados frescos
      })
      if (res.ok) {
        const data = await res.json()
        console.log("📊 Usuários carregados:", data.users?.length || 0)
        setUsers(data.users || [])
      } else {
        console.error("❌ Erro ao buscar usuários:", res.status, res.statusText)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar usuários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeactivate = async (userId: string) => {
    if (!confirm("Tem certeza que deseja desativar este usuário?")) return

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        fetchUsers() // Recarrega lista
      } else {
        alert("Erro ao desativar usuário")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao desativar usuário")
    }
  }

  const handleResendInvite = async (userId: string, userEmail: string) => {
    if (!confirm(`Reenviar convite para ${userEmail}?\n\nUma nova senha temporária será gerada e enviada por email.`)) {
      return
    }

    setResendingInvite(userId)

    try {
      const res = await fetch(`/api/users/${userId}/resend-invite`, {
        method: "POST",
      })

      const data = await res.json()

      if (res.ok) {
        alert(`✅ Convite reenviado com sucesso para ${userEmail}!\n\nO usuário receberá um email com a nova senha temporária.`)
      } else {
        alert(data.error || "Erro ao reenviar convite")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao reenviar convite")
    } finally {
      setResendingInvite(null)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">
            Apenas o proprietário do salão pode gerenciar usuários.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <GridBackground>
      <DashboardHeader 
        user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role
        }}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Título da Página */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Gerenciar Usuários</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Crie e gerencie usuários da sua equipe com permissões personalizadas
              </p>
            </div>

            {/* Botão Novo Usuário */}
            <Button
              onClick={() => router.push("/dashboard/usuarios/novo")}
              className="gap-2 w-full sm:w-auto min-h-[44px]"
            >
              <UserPlus className="h-4 w-4" />
              <span className="text-sm sm:text-base">Novo Usuário</span>
            </Button>
          </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{users.length}</p>
            </div>
            <div className="p-2 sm:p-3 bg-primary/10 rounded-full flex-shrink-0">
              <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {users.filter((u) => u.active).length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-green-500/10 rounded-full flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground">Usuários Inativos</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">
                {users.filter((u) => !u.active).length}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-red-500/10 rounded-full flex-shrink-0">
              <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Users List */}
      <Card className="overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12 px-4 text-muted-foreground">
            <UserPlus className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum usuário criado ainda</p>
            <p className="text-sm">
              Clique em &quot;Novo Usuário&quot; para adicionar membros da equipe
            </p>
          </div>
        ) : (
          <>
            {/* Layout Mobile - Cards */}
            <div className="block md:hidden divide-y">
              {users.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">{user.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 flex-shrink-0">
                        <CheckCircle className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 flex-shrink-0">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </span>
                    )}
                  </div>

                  {/* Info do Card */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                        {user.roleType === "STAFF" ? "Funcionário" : "Personalizado"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Permissões</p>
                      <p className="font-medium mt-1">{user.permissions.length} permissões</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Data de Criação</p>
                      <p className="font-medium mt-1">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>

                  {/* Ações do Card */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvite(user.id, user.email)}
                      disabled={!user.active || resendingInvite === user.id}
                      className="flex-1 gap-2 min-h-[40px]"
                    >
                      {resendingInvite === user.id ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          <span className="text-xs">Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span className="text-xs">Reenviar</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/usuarios/${user.id}`)}
                      disabled={!user.active}
                      className="flex-1 gap-2 min-h-[40px]"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="text-xs">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeactivate(user.id)}
                      disabled={!user.active}
                      className="min-h-[40px] min-w-[40px] p-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Layout Desktop - Tabela */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="bg-muted/50">
                    <th className="text-left p-4 font-medium text-sm">Nome</th>
                    <th className="text-left p-4 font-medium text-sm">Email</th>
                    <th className="text-left p-4 font-medium text-sm">Tipo</th>
                    <th className="text-left p-4 font-medium text-sm">Permissões</th>
                    <th className="text-left p-4 font-medium text-sm">Status</th>
                    <th className="text-left p-4 font-medium text-sm">Data de Criação</th>
                    <th className="text-right p-4 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-sm">{user.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {user.roleType === "STAFF" ? "Funcionário" : "Personalizado"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {user.permissions.length} permissões
                        </div>
                      </td>
                      <td className="p-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
                            <XCircle className="h-3 w-3" />
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvite(user.id, user.email)}
                            disabled={!user.active || resendingInvite === user.id}
                            title="Reenviar convite"
                            className="h-8 w-8 p-0"
                          >
                            {resendingInvite === user.id ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/usuarios/${user.id}`)}
                            disabled={!user.active}
                            title="Editar"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(user.id)}
                            disabled={!user.active}
                            title="Desativar"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
        </div>
      </main>
    </GridBackground>
  )
}
