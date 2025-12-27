import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GlassCard } from "@/components/ui/glass-card"
import { AnimatedText } from "@/components/ui/animated-text"
import { GridBackground } from "@/components/ui/grid-background"
import { Calendar, Users, Scissors, TrendingUp, DollarSign, TrendingDown, CheckCircle, BarChart3, ArrowRight, Zap, Receipt } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { TrialStatus } from "@/components/dashboard/trial-status"
import { ExpenseSummary } from "@/components/dashboard/expense-summary"
import { subDays, subMonths } from "date-fns"
import Link from "next/link"
import { getUserSalonId } from "@/lib/salon-helper"
import { getSalonSubscription, formatTrialInfo } from "@/lib/subscription-helper"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Obter salão do usuário logado
  const userSalonId = await getUserSalonId()
  
  if (!userSalonId) {
    redirect("/login")
  }

  // Buscar subscription e trial info (com tratamento de erro)
  let subscription = null;
  let trialInfo = null;
  
  try {
    subscription = await getSalonSubscription(userSalonId);
    trialInfo = subscription ? formatTrialInfo(subscription) : null;
  } catch (error) {
    console.error("Erro ao buscar subscription:", error);
    // Continuar sem subscription
  }

  // Datas para comparação
  const today = new Date()
  const last30Days = subDays(today, 30)
  const previous30Days = subDays(today, 60)

  // Buscar estatísticas básicas DO SALÃO DO USUÁRIO
  const stats = {
    totalBookings: await prisma.booking.count({ where: { salonId: userSalonId } }),
    totalClients: await prisma.user.count({ where: { role: "CLIENT" } }), // Clientes são globais
    totalServices: await prisma.service.count({ where: { salonId: userSalonId } }),
    totalSalons: 1, // O usuário vê apenas seu salão
  }

  // Estatísticas dos últimos 30 dias
  const bookingsLast30 = await prisma.booking.count({
    where: { 
      salonId: userSalonId,
      createdAt: { gte: last30Days } 
    }
  })
  
  const bookingsPrevious30 = await prisma.booking.count({
    where: { 
      salonId: userSalonId,
      createdAt: { 
        gte: previous30Days,
        lt: last30Days 
      } 
    }
  })

  // Calcular receita
  const revenueLast30Result = await prisma.booking.aggregate({
    where: {
      salonId: userSalonId,
      createdAt: { gte: last30Days },
      status: "COMPLETED"
    },
    _sum: { totalPrice: true }
  })

  const revenuePrevious30Result = await prisma.booking.aggregate({
    where: {
      salonId: userSalonId,
      createdAt: { 
        gte: previous30Days,
        lt: last30Days 
      },
      status: "COMPLETED"
    },
    _sum: { totalPrice: true }
  })

  const revenueLast30 = revenueLast30Result._sum.totalPrice || 0
  const revenuePrevious30 = revenuePrevious30Result._sum.totalPrice || 0

  // Calcular crescimentos
  const bookingsGrowth = bookingsPrevious30 > 0 
    ? ((bookingsLast30 - bookingsPrevious30) / bookingsPrevious30) * 100 
    : 0

  const revenueGrowth = revenuePrevious30 > 0
    ? ((revenueLast30 - revenuePrevious30) / revenuePrevious30) * 100
    : 0

  // Taxa de conclusão últimos 30 dias
  const completedLast30 = await prisma.booking.count({
    where: {
      salonId: userSalonId,
      createdAt: { gte: last30Days },
      status: "COMPLETED"
    }
  })

  const completionRate = bookingsLast30 > 0 
    ? (completedLast30 / bookingsLast30) * 100 
    : 0

  // Buscar top profissional DO SALÃO
  const topStaffData = await prisma.booking.groupBy({
    by: ['staffId'],
    where: {
      salonId: userSalonId,
      createdAt: { gte: last30Days },
      status: 'COMPLETED'
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 1
  })

  let topStaff = null
  if (topStaffData.length > 0) {
    topStaff = await prisma.staff.findUnique({
      where: { id: topStaffData[0].staffId },
      select: { name: true }
    })
  }

  // Buscar próximos agendamentos DO SALÃO
  const upcomingBookings = await prisma.booking.findMany({
    where: {
      salonId: userSalonId,
      date: {
        gte: new Date()
      }
    },
    include: {
      client: true,
      service: true,
      staff: true,
      salon: true
    },
    orderBy: {
      date: "asc"
    },
    take: 5
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />
      
      <GridBackground>
        <main className="container mx-auto px-4 py-12">
          {/* Header Section Railway */}
          <div className="mb-12 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Bem-vindo, <span className="text-primary font-bold">{session.user.name}</span>!
            </h1>
            <p className="text-foreground-muted text-lg">
              Aqui está um resumo da sua atividade nos últimos 30 dias
            </p>
          </div>

          {/* Trial Status */}
          {trialInfo && trialInfo.isActive && trialInfo.endsAt && (
            <div className="mb-8 animate-fadeInUp" style={{ animationDelay: "100ms" }}>
              <TrialStatus
                daysLeft={trialInfo.daysLeft}
                percentage={trialInfo.percentage}
                isEnding={trialInfo.isEnding}
                isExpired={trialInfo.isExpired}
                endsAt={trialInfo.endsAt}
              />
            </div>
          )}

        {/* Cards de Estatísticas Railway */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-12 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
          {/* Card Agendamentos */}
          <GlassCard hover glow={bookingsGrowth >= 0 ? "success" : "primary"} className="group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-muted mb-1">
                  Agendamentos
                </p>
                <p className="text-xs text-foreground-muted/70">Últimos 30 dias</p>
              </div>
              <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-foreground mb-3">{bookingsLast30}</div>
            <div className="flex items-center">
              {bookingsGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-error mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  bookingsGrowth >= 0 ? "text-success" : "text-error"
                }`}
              >
                {Math.abs(bookingsGrowth).toFixed(1)}%
              </span>
              <span className="text-sm text-foreground-muted ml-1">vs anterior</span>
            </div>
          </GlassCard>

          {/* Card Receita */}
          <GlassCard hover glow={revenueGrowth >= 0 ? "success" : "accent"} className="group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-muted mb-1">
                  Receita
                </p>
                <p className="text-xs text-foreground-muted/70">Últimos 30 dias</p>
              </div>
              <div className="p-2 bg-gradient-success rounded-lg group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-foreground mb-3">
              R$ {(revenueLast30 / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-error mr-1" />
              )}
              <span
                className={`text-sm font-medium ${
                  revenueGrowth >= 0 ? "text-success" : "text-error"
                }`}
              >
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-sm text-foreground-muted ml-1">vs anterior</span>
            </div>
          </GlassCard>

          {/* Card Taxa Conclusão */}
          <GlassCard hover glow="accent" className="group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-muted mb-1">
                  Taxa de Conclusão
                </p>
                <p className="text-xs text-foreground-muted/70">Últimos 30 dias</p>
              </div>
              <div className="p-2 bg-gradient-accent rounded-lg group-hover:scale-110 transition-transform">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-4xl font-bold text-foreground mb-3">{completionRate.toFixed(1)}%</div>
            <p className="text-sm text-foreground-muted">
              {completedLast30} de {bookingsLast30} concluídos
            </p>
          </GlassCard>

          {/* Card Top Profissional */}
          <GlassCard hover glow="primary" className="group">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground-muted mb-1">
                  Top Profissional
                </p>
                <p className="text-xs text-foreground-muted/70">Últimos 30 dias</p>
              </div>
              <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground mb-3 truncate">
              {topStaff?.name || "-"}
            </div>
            <p className="text-sm text-foreground-muted">
              {topStaffData.length > 0 ? `${topStaffData[0]._count.id} agendamentos` : "Sem dados"}
            </p>
          </GlassCard>

          {/* Card Despesas - NOVO */}
          <div className="animate-fadeInUp" style={{ animationDelay: "250ms" }}>
            <ExpenseSummary />
          </div>
        </div>

        {/* Quick Stats & Ações Rápidas Railway */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
          {/* Visão Geral Modernizada */}
          <GlassCard hover className="relative overflow-hidden group">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Visão Geral</h3>
                <div className="p-2 bg-gradient-primary rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-background-alt/30 hover:bg-background-alt/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground-muted">Total de Clientes</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.totalClients}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-background-alt/30 hover:bg-background-alt/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Scissors className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium text-foreground-muted">Serviços Ativos</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.totalServices}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-lg bg-background-alt/30 hover:bg-background-alt/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <Calendar className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-sm font-medium text-foreground-muted">Total de Agendamentos</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.totalBookings}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Ações Rápidas Modernizadas */}
          <GlassCard hover className="md:col-span-1 lg:col-span-2 relative overflow-hidden group">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-primary/5 to-success/5 opacity-50 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Ações Rápidas</h3>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="text-xs text-foreground-muted">Sistema ativo</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <Link
                  href="/dashboard/caixa"
                  className="glass-card p-3 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Caixa</span>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard/contas-a-pagar"
                  className="glass-card p-3 hover:border-orange-500/50 hover:shadow-lg hover:shadow-orange-500/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Despesas</span>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard/relatorios"
                  className="glass-card p-3 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-primary rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Relatórios</span>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard/agendamentos"
                  className="glass-card p-3 hover:border-success/50 hover:shadow-lg hover:shadow-success/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-success/10 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-success rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Agenda</span>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard/servicos"
                  className="glass-card p-3 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-accent rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <Scissors className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Serviços</span>
                  </div>
                </Link>
                
                <Link
                  href="/dashboard/profissionais"
                  className="glass-card p-3 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all text-center group/item relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                  <div className="relative z-10">
                    <div className="p-2.5 bg-gradient-primary rounded-xl w-fit mx-auto mb-2 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all shadow-lg">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-foreground block truncate px-1">Equipe</span>
                  </div>
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Próximos Agendamentos Railway */}
        <GlassCard className="animate-fadeInUp" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Próximos Agendamentos</h3>
              <p className="text-sm text-foreground-muted">Veja os agendamentos futuros</p>
            </div>
            <Link href="/dashboard/agendamentos" className="text-sm text-primary hover:text-accent transition-colors flex items-center gap-1">
              Ver todos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-foreground-muted mx-auto mb-3 opacity-50" />
              <p className="text-foreground-muted">Nenhum agendamento futuro encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="glass-card p-4 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground mb-1">
                        {booking.client.name}
                      </p>
                      <p className="text-sm text-foreground-muted">
                        {booking.service.name} • {booking.staff.name}
                      </p>
                      <p className="text-xs text-foreground-muted/70 mt-0.5">
                        {booking.salon.name}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {new Date(booking.date).toLocaleDateString("pt-BR")}
                        </p>
                        <p className="text-sm text-foreground-muted">
                          {new Date(booking.date).getUTCHours().toString().padStart(2, '0')}:{new Date(booking.date).getUTCMinutes().toString().padStart(2, '0')}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        booking.status === "CONFIRMED" ? "bg-success/20 text-success" :
                        booking.status === "PENDING" ? "bg-warning/20 text-warning" :
                        "bg-foreground-muted/20 text-foreground-muted"
                      }`}>
                        {booking.status === "CONFIRMED" ? "Confirmado" :
                         booking.status === "PENDING" ? "Pendente" :
                         booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </main>
      </GridBackground>
    </div>
  )
}
