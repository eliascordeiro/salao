"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, User, Calendar, CheckCircle2, XCircle, Clock, DollarSign, AlertCircle } from "lucide-react"

interface Subscription {
  id: string
  status: string
  trialEnd: string | null
  currentPeriodStart: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  plan: {
    id: string
    name: string
    price: number
  }
  payments: Array<{
    id: string
    status: string
    amount: number
    createdAt: string
  }>
}

const statusLabels: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativa",
  PAST_DUE: "Atrasada",
  CANCELLED: "Cancelada",
  INCOMPLETE: "Incompleta",
}

const statusColors: Record<string, string> = {
  TRIAL: "text-blue-600 dark:text-blue-400",
  ACTIVE: "text-green-600 dark:text-green-400",
  PAST_DUE: "text-yellow-600 dark:text-yellow-400",
  CANCELLED: "text-red-600 dark:text-red-400",
  INCOMPLETE: "text-gray-600 dark:text-gray-400",
}

const statusIcons: Record<string, any> = {
  TRIAL: Clock,
  ACTIVE: CheckCircle2,
  PAST_DUE: AlertCircle,
  CANCELLED: XCircle,
  INCOMPLETE: Clock,
}

export default function AssinaturasPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchSubscriptions()
  }, [statusFilter, page])

  async function fetchSubscriptions() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      })

      if (statusFilter !== "all") params.append("status", statusFilter)

      const response = await fetch(`/api/platform/subscriptions?${params}`)
      const data = await response.json()

      setSubscriptions(data.subscriptions || [])
      setTotal(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
    } catch (error) {
      console.error("Erro ao buscar assinaturas:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Assinaturas</h1>
        <p className="text-muted-foreground mt-1">
          Visualize e gerencie todas as assinaturas da plataforma
        </p>
      </div>

      {/* Filtros */}
      <Card className="glass-card p-6">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("all")
              setPage(1)
            }}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "TRIAL" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("TRIAL")
              setPage(1)
            }}
          >
            <Clock className="h-3 w-3 mr-1" />
            Trial
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "ACTIVE" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("ACTIVE")
              setPage(1)
            }}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Ativas
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "PAST_DUE" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("PAST_DUE")
              setPage(1)
            }}
          >
            <AlertCircle className="h-3 w-3 mr-1" />
            Atrasadas
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "CANCELLED" ? "default" : "outline"}
            onClick={() => {
              setStatusFilter("CANCELLED")
              setPage(1)
            }}
          >
            <XCircle className="h-3 w-3 mr-1" />
            Canceladas
          </Button>
        </div>
      </Card>

      {/* Lista de Assinaturas */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando assinaturas...</p>
        </div>
      ) : subscriptions.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura encontrada</h3>
          <p className="text-muted-foreground">
            {statusFilter !== "all" 
              ? "Não há assinaturas com este status" 
              : "Ainda não há assinaturas cadastradas"}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((subscription) => {
            const StatusIcon = statusIcons[subscription.status] || Clock
            const lastPayment = subscription.payments[0]

            return (
              <Card key={subscription.id} className="glass-card p-6">
                <div className="flex items-start gap-4">
                  {/* Ícone do Plano */}
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Plano e Status */}
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{subscription.plan.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon className={`h-4 w-4 ${statusColors[subscription.status]}`} />
                          <span className={`text-sm font-medium ${statusColors[subscription.status]}`}>
                            {statusLabels[subscription.status]}
                          </span>
                          {subscription.cancelAtPeriodEnd && (
                            <span className="text-xs text-muted-foreground">
                              • Cancela no fim do período
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(subscription.plan.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </div>

                    {/* Usuário */}
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{subscription.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{subscription.user.email}</p>
                      </div>
                    </div>

                    {/* Período */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Período Atual</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {new Date(subscription.currentPeriodStart).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          até {new Date(subscription.currentPeriodEnd).toLocaleDateString("pt-BR")}
                        </p>
                      </div>

                      {subscription.trialEnd && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Trial Termina</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>{new Date(subscription.trialEnd).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Criada em</p>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{new Date(subscription.createdAt).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Último Pagamento */}
                    {lastPayment && (
                      <div className="bg-accent/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-2">Último Pagamento</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-semibold">
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(lastPayment.amount / 100)}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              lastPayment.status === "succeeded" 
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                            }`}>
                              {lastPayment.status === "succeeded" ? "Sucesso" : lastPayment.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lastPayment.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <Card className="glass-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} • {total} assinaturas no total
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
