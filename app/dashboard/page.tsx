import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Users, Scissors, TrendingUp, DollarSign, TrendingDown, CheckCircle, BarChart3 } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"
import { subDays, subMonths } from "date-fns"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  // Datas para comparação
  const today = new Date()
  const last30Days = subDays(today, 30)
  const previous30Days = subDays(today, 60)

  // Buscar estatísticas básicas
  const stats = {
    totalBookings: await prisma.booking.count(),
    totalClients: await prisma.user.count({ where: { role: "CLIENT" } }),
    totalServices: await prisma.service.count(),
    totalSalons: await prisma.salon.count(),
  }

  // Estatísticas dos últimos 30 dias
  const bookingsLast30 = await prisma.booking.count({
    where: { createdAt: { gte: last30Days } }
  })
  
  const bookingsPrevious30 = await prisma.booking.count({
    where: { 
      createdAt: { 
        gte: previous30Days,
        lt: last30Days 
      } 
    }
  })

  // Calcular receita
  const revenueLast30Result = await prisma.booking.aggregate({
    where: {
      createdAt: { gte: last30Days },
      status: "COMPLETED"
    },
    _sum: { totalPrice: true }
  })

  const revenuePrevious30Result = await prisma.booking.aggregate({
    where: {
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
      createdAt: { gte: last30Days },
      status: "COMPLETED"
    }
  })

  const completionRate = bookingsLast30 > 0 
    ? (completedLast30 / bookingsLast30) * 100 
    : 0

  // Buscar top profissional
  const topStaffData = await prisma.booking.groupBy({
    by: ['staffId'],
    where: {
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

  // Buscar próximos agendamentos
  const upcomingBookings = await prisma.booking.findMany({
    where: {
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bem-vindo, {session.user.name}!
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo da sua atividade
          </p>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Agendamentos (30d)
              </CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookingsLast30}</div>
              <div className="flex items-center mt-2">
                {bookingsGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-xs ${
                    bookingsGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(bookingsGrowth).toFixed(1)}% vs mês anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Receita (30d)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {revenueLast30.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="flex items-center mt-2">
                {revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span
                  className={`text-xs ${
                    revenueGrowth >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {Math.abs(revenueGrowth).toFixed(1)}% vs mês anterior
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Taxa de Conclusão
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
              <p className="text-xs text-gray-500 mt-1">
                {completedLast30} de {bookingsLast30} concluídos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Top Profissional
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {topStaff?.name || "-"}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {topStaffData.length > 0 ? `${topStaffData[0]._count.id} agendamentos` : "últimos 30 dias"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total de Clientes</span>
                <span className="font-semibold">{stats.totalClients}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Serviços Ativos</span>
                <span className="font-semibold">{stats.totalServices}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total de Agendamentos</span>
                <span className="font-semibold">{stats.totalBookings}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Ações Rápidas</CardTitle>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/dashboard/relatorios"
                  className="p-3 border rounded-lg hover:bg-gray-50 transition text-center"
                >
                  <BarChart3 className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <span className="text-sm font-medium">Relatórios</span>
                </Link>
                <Link
                  href="/dashboard/agendamentos"
                  className="p-3 border rounded-lg hover:bg-gray-50 transition text-center"
                >
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <span className="text-sm font-medium">Agendamentos</span>
                </Link>
                <Link
                  href="/dashboard/servicos"
                  className="p-3 border rounded-lg hover:bg-gray-50 transition text-center"
                >
                  <Scissors className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                  <span className="text-sm font-medium">Serviços</span>
                </Link>
                <Link
                  href="/dashboard/profissionais"
                  className="p-3 border rounded-lg hover:bg-gray-50 transition text-center"
                >
                  <Users className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <span className="text-sm font-medium">Profissionais</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximos Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
            <CardDescription>
              Veja os agendamentos futuros
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nenhum agendamento futuro encontrado
              </p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {booking.client.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.service.name} - {booking.staff.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.salon.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {new Date(booking.date).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.date).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                        booking.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {booking.status === "CONFIRMED" ? "Confirmado" :
                         booking.status === "PENDING" ? "Pendente" :
                         booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
