"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { DollarSign, TrendingDown, TrendingUp, AlertCircle } from "lucide-react"
import Link from "next/link"

interface ExpenseStats {
  totalPending: number
  totalPaid: number
  total: number
  overdue: number
}

export function ExpenseSummary() {
  const [stats, setStats] = useState<ExpenseStats>({
    totalPending: 0,
    totalPaid: 0,
    total: 0,
    overdue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [profit, setProfit] = useState<number>(0)
  const [revenue, setRevenue] = useState<number>(0)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch expenses
        const expensesRes = await fetch("/api/expenses")
        if (expensesRes.ok) {
          const expenses = await expensesRes.json()
          
          const pending = expenses
            .filter((e: any) => e.status === "PENDING")
            .reduce((sum: number, e: any) => sum + e.amount, 0)
          
          const paid = expenses
            .filter((e: any) => e.status === "PAID")
            .reduce((sum: number, e: any) => sum + e.amount, 0)
          
          const overdue = expenses
            .filter((e: any) => e.status === "OVERDUE")
            .reduce((sum: number, e: any) => sum + e.amount, 0)
          
          setStats({
            totalPending: pending,
            totalPaid: paid,
            total: pending + paid + overdue,
            overdue,
          })
        }

        // Fetch revenue (from bookings)
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        
        const bookingsRes = await fetch(
          `/api/bookings?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
        )
        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json()
          const monthRevenue = bookings
            .filter((b: any) => b.status === "CONFIRMED" || b.status === "COMPLETED")
            .reduce((sum: number, b: any) => sum + (b.service?.price || 0), 0)
          
          setRevenue(monthRevenue)
          setProfit(monthRevenue - stats.totalPaid)
        }
      } catch (error) {
        console.error("Erro ao buscar estatísticas de despesas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [stats.totalPaid])

  if (loading) {
    return (
      <GlassCard className="p-6 animate-pulse">
        <div className="h-20 bg-background-alt/30 rounded"></div>
      </GlassCard>
    )
  }

  return (
    <Link href="/dashboard/contas-a-pagar" className="block group">
      <GlassCard className="p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-foreground-muted mb-1">Despesas do Mês</p>
            <p className="text-3xl font-bold text-foreground">
              R$ {stats.total.toFixed(2)}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10">
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-muted">Pendente</span>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
              R$ {stats.totalPending.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-foreground-muted">Pago</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              R$ {stats.totalPaid.toFixed(2)}
            </span>
          </div>
          {stats.overdue > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-foreground-muted flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Atrasado
              </span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                R$ {stats.overdue.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Profit Summary */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex justify-between items-center">
            <span className="text-sm text-foreground-muted">Lucro do Mês</span>
            <div className="flex items-center gap-2">
              {profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`font-bold ${
                  profit >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                R$ {profit.toFixed(2)}
              </span>
            </div>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Receita: R$ {revenue.toFixed(2)} | Despesas: R$ {stats.totalPaid.toFixed(2)}
          </p>
        </div>

        <div className="mt-4 text-xs text-center text-primary group-hover:underline">
          Ver detalhes →
        </div>
      </GlassCard>
    </Link>
  )
}
