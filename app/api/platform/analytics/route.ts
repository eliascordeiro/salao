import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar se é PLATFORM_ADMIN
    if (!session || session.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform Admin access only" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get("period") || "30d" // "7d" | "30d" | "90d" | "1y"

    // Calcular data de início baseado no período
    const now = new Date()
    const startDate = new Date()

    switch (period) {
      case "7d":
        startDate.setDate(now.getDate() - 7)
        break
      case "30d":
        startDate.setDate(now.getDate() - 30)
        break
      case "90d":
        startDate.setDate(now.getDate() - 90)
        break
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 30)
    }

    // Agendamentos ao longo do tempo
    const bookingsOverTime = await prisma.booking.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    // Novos usuários ao longo do tempo
    const newUsersOverTime = await prisma.user.groupBy({
      by: ["role"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    // Novos salões ao longo do tempo
    const newSalons = await prisma.salon.count({
      where: {
        createdAt: { gte: startDate },
      },
    })

    // Receita do período (Stripe)
    const revenue = await prisma.payment.aggregate({
      where: {
        status: "succeeded",
        createdAt: { gte: startDate },
      },
      _sum: { amount: true },
      _count: true,
    })

    // Assinaturas ativas
    const activeSubscriptions = await prisma.subscription.count({
      where: { status: "ACTIVE" },
    })

    // Novas assinaturas no período
    const newSubscriptions = await prisma.subscription.count({
      where: {
        createdAt: { gte: startDate },
      },
    })

    // Assinaturas canceladas no período
    const cancelledSubscriptions = await prisma.subscription.count({
      where: {
        status: "CANCELLED",
        updatedAt: { gte: startDate },
      },
    })

    // MRR (Monthly Recurring Revenue)
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "ACTIVE" },
      include: { plan: true },
    })

    const mrr = subscriptions.reduce((total, sub) => total + sub.plan.price, 0)

    // Taxa de conversão (trial → pago)
    const totalTrials = await prisma.subscription.count({
      where: {
        status: "TRIAL",
        createdAt: { gte: startDate },
      },
    })

    const convertedTrials = await prisma.subscription.count({
      where: {
        status: "ACTIVE",
        createdAt: { gte: startDate },
      },
    })

    const conversionRate = totalTrials > 0 ? (convertedTrials / totalTrials) * 100 : 0

    // Churn rate
    const churnRate = activeSubscriptions > 0 
      ? (cancelledSubscriptions / activeSubscriptions) * 100 
      : 0

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate,
        end: now,
      },
      bookings: {
        byStatus: bookingsOverTime,
      },
      users: {
        new: newUsersOverTime,
      },
      salons: {
        new: newSalons,
      },
      revenue: {
        total: revenue._sum.amount || 0,
        count: revenue._count,
      },
      subscriptions: {
        active: activeSubscriptions,
        new: newSubscriptions,
        cancelled: cancelledSubscriptions,
        mrr,
        conversionRate: Math.round(conversionRate * 100) / 100,
        churnRate: Math.round(churnRate * 100) / 100,
      },
    })
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
