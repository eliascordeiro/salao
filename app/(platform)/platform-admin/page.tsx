"use client"

import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Store, Users, CreditCard, TrendingUp, CheckCircle2, XCircle, Clock, DollarSign, BarChart3, Calendar, Settings } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface PlatformStats {
  salons: { total: number; active: number }
  users: { total: number; byRole: Array<{ role: string; _count: number }> }
  bookings: { total: number; byStatus: Array<{ status: string; _count: number }> }
  revenue: number
  subscriptions: { total: number; active: number; byPlan: Array<{ planId: string; _count: number }>; mrr: number }
}

export default function PlatformAdminPage() {
  const { data: session, status } = useSession()
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/platform/overview")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchStats()
    }
  }, [status])

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated" || session?.user?.role !== "PLATFORM_ADMIN") {
    redirect("/login")
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Erro ao carregar dados</p>
      </div>
    )
  }

  const confirmedBookings = stats.bookings.byStatus.find(s => s.status === 'CONFIRMED')?._count || 0
  const pendingBookings = stats.bookings.byStatus.find(s => s.status === 'PENDING')?._count || 0
  const cancelledBookings = stats.bookings.byStatus.find(s => s.status === 'CANCELLED')?._count || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral de toda a plataforma SalãoBlza
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Salões */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Salões</p>
              <p className="text-2xl font-bold mt-2">{stats.salons.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.salons.active} ativos
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Store className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>

        {/* Usuários */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuários</p>
              <p className="text-2xl font-bold mt-2">{stats.users.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.users.byRole.find(r => r.role === 'CLIENT')?._count || 0} clientes
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Assinaturas */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assinaturas</p>
              <p className="text-2xl font-bold mt-2">{stats.subscriptions.active}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.subscriptions.total} totais
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* MRR */}
        <Card className="glass-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">MRR</p>
              <p className="text-2xl font-bold mt-2">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(stats.subscriptions.mrr)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Receita mensal recorrente
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-pink-600 dark:text-pink-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Agendamentos */}
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Agendamentos
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">Confirmados</span>
              </div>
              <span className="font-semibold">{confirmedBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pendentes</span>
              </div>
              <span className="font-semibold">{pendingBookings}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Cancelados</span>
              </div>
              <span className="font-semibold">{cancelledBookings}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="font-bold text-lg">{stats.bookings.total}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Receita */}
        <Card className="glass-card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Receita (Stripe)
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Total processado</p>
              <p className="text-3xl font-bold mt-1">
                {new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(stats.revenue / 100)}
              </p>
            </div>
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Pagamentos bem-sucedidos via Stripe (agendamentos)
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">Ações Rápidas</h3>
        <div className="grid gap-3 md:grid-cols-3">
          <a
            href="/platform-admin/saloes"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <Store className="h-5 w-5 text-purple-600" />
            <div>
              <p className="font-medium text-sm">Gerenciar Salões</p>
              <p className="text-xs text-muted-foreground">Ver todos os salões</p>
            </div>
          </a>

          <a
            href="/platform-admin/assinaturas"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <CreditCard className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-sm">Assinaturas</p>
              <p className="text-xs text-muted-foreground">Ver pagamentos</p>
            </div>
          </a>

          <a
            href="/platform-admin/analytics"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-sm">Analytics</p>
              <p className="text-xs text-muted-foreground">Métricas detalhadas</p>
            </div>
          </a>
        </div>
      </Card>
    </div>
  )
}
