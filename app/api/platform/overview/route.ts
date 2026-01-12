import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verificar se prisma está disponível
    if (!prisma) {
      console.error('Prisma client not available')
      return NextResponse.json({
        salons: { total: 0, active: 0 },
        users: { total: 0, byRole: [] },
        bookings: { total: 0, byStatus: [] },
        revenue: 0,
        subscriptions: { total: 0, active: 0, byPlan: [], mrr: 0 }
      })
    }

    // Total de salões
    const totalSalons = await prisma.salon.count()
    const activeSalons = await prisma.salon.count({ where: { active: true } })

    // Total de usuários
    const totalUsers = await prisma.user.count()
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    // Total de agendamentos
    const totalBookings = await prisma.booking.count()
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true
    })

    // Receita total (Stripe payments)
    const payments = await prisma.payment.aggregate({
      where: { status: 'succeeded' },
      _sum: { amount: true }
    })

    // Assinaturas
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: 'ACTIVE' }
    })

    const totalSubscriptions = await prisma.subscription.count()

    // Assinaturas por plano
    const subscriptionsByPlan = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: true
    })

    // Receita mensal recorrente (MRR)
    const plans = await prisma.plan.findMany()
    let mrr = 0
    for (const sub of subscriptionsByPlan) {
      const plan = plans.find(p => p.id === sub.planId)
      if (plan) {
        mrr += plan.price * sub._count
      }
    }

    return NextResponse.json({
      salons: { total: totalSalons, active: activeSalons },
      users: { total: totalUsers, byRole: usersByRole },
      bookings: { total: totalBookings, byStatus: bookingsByStatus },
      revenue: payments._sum.amount || 0,
      subscriptions: { 
        total: totalSubscriptions, 
        active: activeSubscriptions,
        byPlan: subscriptionsByPlan,
        mrr 
      }
    })
  } catch (error) {
    console.error('Error fetching platform stats:', error)
    return NextResponse.json({
      salons: { total: 0, active: 0 },
      users: { total: 0, byRole: [] },
      bookings: { total: 0, byStatus: [] },
      revenue: 0,
      subscriptions: { total: 0, active: 0, byPlan: [], mrr: 0 }
    }, { status: 200 }) // Retorna 200 com dados vazios para evitar crash
  }
}
