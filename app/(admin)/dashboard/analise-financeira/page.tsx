import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { DashboardHeader } from "@/components/dashboard/header"
import { GridBackground } from "@/components/ui/grid-background"
import { ExpensesPieChart } from "@/components/dashboard/expenses-pie-chart"
import { ExpensesTrendChart } from "@/components/dashboard/expenses-trend-chart"
import { GlassCard } from "@/components/ui/glass-card"
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { getUserSalonId } from "@/lib/salon-helper"
import { getProfitStats, getProfitComparison } from "@/lib/expense-helper"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function FinancialAnalysisPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  const userSalonId = await getUserSalonId()

  if (!userSalonId) {
    redirect("/login")
  }

  // Dados do mês atual
  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const profitComparison = await getProfitComparison(userSalonId)
  const currentStats = profitComparison.current
  const previousStats = profitComparison.previous

  // Estatísticas de despesas
  const expenses = await prisma.expense.findMany({
    where: {
      salonId: userSalonId,
      dueDate: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  })

  const pendingExpenses = expenses.filter((e) => e.status === "PENDING").length
  const overdueExpenses = expenses.filter((e) => e.status === "OVERDUE").length

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <main className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Análise Financeira
            </h1>
            <p className="text-foreground-muted">
              {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>

          {/* Cards de Resumo */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Receita */}
            <GlassCard className="p-6" hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Receita</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {currentStats.revenue.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <p className="text-sm text-foreground-muted">
                Agendamentos confirmados
              </p>
            </GlassCard>

            {/* Despesas */}
            <GlassCard className="p-6" hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Despesas</p>
                  <p className="text-3xl font-bold text-foreground">
                    R$ {currentStats.expenses.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-6 w-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm text-foreground-muted">
                {pendingExpenses} pendentes, {overdueExpenses} atrasadas
              </p>
            </GlassCard>

            {/* Lucro */}
            <GlassCard className="p-6" hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Lucro</p>
                  <p className={`text-3xl font-bold ${
                    currentStats.profit >= 0 
                      ? "text-green-600 dark:text-green-400" 
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    R$ {currentStats.profit.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  currentStats.profit >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    currentStats.profit >= 0 ? "text-green-500" : "text-red-500"
                  }`} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {profitComparison.profitGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  profitComparison.profitGrowth >= 0 
                    ? "text-green-600" 
                    : "text-red-600"
                }`}>
                  {Math.abs(profitComparison.profitGrowth).toFixed(1)}%
                </span>
                <span className="text-sm text-foreground-muted ml-1">vs anterior</span>
              </div>
            </GlassCard>

            {/* Margem */}
            <GlassCard className="p-6" hover>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Margem</p>
                  <p className="text-3xl font-bold text-foreground">
                    {currentStats.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-foreground-muted">
                Margem de lucro líquida
              </p>
            </GlassCard>
          </div>

          {/* Gráficos */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ExpensesPieChart />
            <ExpensesTrendChart />
          </div>

          {/* Comparação com mês anterior */}
          <div className="mt-8">
            <GlassCard className="p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Comparação com Mês Anterior
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Receita</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      R$ {currentStats.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      (antes: R$ {previousStats.revenue.toFixed(2)})
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Despesas</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      R$ {currentStats.expenses.toFixed(2)}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      (antes: R$ {previousStats.expenses.toFixed(2)})
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Lucro</p>
                  <div className="flex items-baseline gap-2">
                    <p className={`text-2xl font-bold ${
                      currentStats.profit >= 0 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      R$ {currentStats.profit.toFixed(2)}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      (antes: R$ {previousStats.profit.toFixed(2)})
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </main>
      </GridBackground>
    </div>
  )
}
