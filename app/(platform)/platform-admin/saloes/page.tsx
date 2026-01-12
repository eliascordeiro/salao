"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Store, MapPin, Phone, Mail, CheckCircle2, XCircle, Users, Briefcase, Calendar } from "lucide-react"

interface Salon {
  id: string
  name: string
  email: string | null
  phone: string
  address: string
  city: string | null
  state: string | null
  active: boolean
  createdAt: string
  owner: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  _count: {
    staff: number
    services: number
    bookings: number
  }
}

export default function SaloesPage() {
  const [salons, setSalons] = useState<Salon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchSalons()
  }, [search, statusFilter, page])

  async function fetchSalons() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (search) params.append("search", search)
      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/platform/salons?${params}`)
      const data = await response.json()

      setSalons(data.salons || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Erro ao buscar salões:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSalonStatus(salonId: string, currentStatus: boolean) {
    try {
      const response = await fetch("/api/platform/salons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId,
          active: !currentStatus,
        }),
      })

      if (response.ok) {
        fetchSalons()
      }
    } catch (error) {
      console.error("Erro ao atualizar salão:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Salões</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie todos os salões cadastrados na plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card className="glass-card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou cidade..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>

          {/* Filtro de Status */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => {
                setStatusFilter("all")
                setPage(1)
              }}
            >
              Todos ({total})
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => {
                setStatusFilter("active")
                setPage(1)
              }}
            >
              Ativos
            </Button>
            <Button
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
      </Card>

      {/* Lista de Salões */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando salões...</p>
        </div>
      ) : salons.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum salão encontrado</h3>
          <p className="text-muted-foreground">
            {search ? "Tente ajustar os filtros de busca" : "Ainda não há salões cadastrados"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {salons.map((salon) => (
            <Card key={salon.id} className="glass-card p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Nome e Status */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shrink-0">
                      <Store className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{salon.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {salon.active ? (
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
                        <span className="text-xs text-muted-foreground">
                          • Criado em {new Date(salon.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {/* Localização */}
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate">{salon.address}</p>
                        {salon.city && salon.state && (
                          <p className="text-muted-foreground truncate">
                            {salon.city} - {salon.state}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contato */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{salon.phone}</span>
                      </div>
                      {salon.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="truncate">{salon.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Proprietário */}
                  <div className="border-t border-border pt-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1">Proprietário</p>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {salon.owner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm min-w-0">
                        <p className="font-medium truncate">{salon.owner.name}</p>
                        <p className="text-muted-foreground truncate">{salon.owner.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{salon._count.staff}</span>
                      <span className="text-muted-foreground">profissionais</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold">{salon._count.services}</span>
                      <span className="text-muted-foreground">serviços</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-green-600" />
                      <span className="font-semibold">{salon._count.bookings}</span>
                      <span className="text-muted-foreground">agendamentos</span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={salon.active ? "destructive" : "default"}
                    onClick={() => toggleSalonStatus(salon.id, salon.active)}
                  >
                    {salon.active ? "Desativar" : "Ativar"}
                  </Button>
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
              Página {page} de {totalPages} • {total} salões no total
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
