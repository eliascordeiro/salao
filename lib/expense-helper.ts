import { prisma } from "@/lib/prisma"
import { startOfMonth, endOfMonth } from "date-fns"

/**
 * Get expense statistics for a specific time period
 */
export async function getExpenseStats(
  salonId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    salonId,
  }

  if (startDate || endDate) {
    where.dueDate = {}
    if (startDate) where.dueDate.gte = startDate
    if (endDate) where.dueDate.lte = endDate
  }

  const expenses = await prisma.expense.findMany({
    where,
  })

  const stats = {
    total: 0,
    pending: 0,
    paid: 0,
    overdue: 0,
    byCategory: {} as Record<string, number>,
  }

  expenses.forEach((expense) => {
    stats.total += expense.amount

    if (expense.status === "PENDING") {
      stats.pending += expense.amount
    } else if (expense.status === "PAID") {
      stats.paid += expense.amount
    } else if (expense.status === "OVERDUE") {
      stats.overdue += expense.amount
    }

    if (!stats.byCategory[expense.category]) {
      stats.byCategory[expense.category] = 0
    }
    stats.byCategory[expense.category] += expense.amount
  })

  return stats
}

/**
 * Get profit statistics (revenue - expenses)
 */
export async function getProfitStats(
  salonId: string,
  month?: number,
  year?: number
) {
  const now = new Date()
  const targetMonth = month ?? now.getMonth()
  const targetYear = year ?? now.getFullYear()

  const startDate = startOfMonth(new Date(targetYear, targetMonth))
  const endDate = endOfMonth(new Date(targetYear, targetMonth))

  // Get revenue from completed bookings
  const revenueResult = await prisma.booking.aggregate({
    where: {
      salonId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ["CONFIRMED", "COMPLETED"],
      },
    },
    _sum: {
      totalPrice: true,
    },
  })

  const revenue = revenueResult._sum.totalPrice || 0

  // Get paid expenses
  const expenseStats = await getExpenseStats(salonId, startDate, endDate)
  const expenses = expenseStats.paid

  // Calculate profit
  const profit = revenue - expenses
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0

  return {
    revenue,
    expenses,
    profit,
    profitMargin,
    month: targetMonth,
    year: targetYear,
  }
}

/**
 * Get month-over-month profit comparison
 */
export async function getProfitComparison(salonId: string) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  const current = await getProfitStats(salonId, currentMonth, currentYear)
  const previous = await getProfitStats(salonId, lastMonth, lastMonthYear)

  const profitGrowth =
    previous.profit !== 0
      ? ((current.profit - previous.profit) / Math.abs(previous.profit)) * 100
      : current.profit > 0
      ? 100
      : 0

  return {
    current,
    previous,
    profitGrowth,
  }
}

/**
 * Get expense categories with totals
 */
export async function getExpensesByCategory(
  salonId: string,
  startDate?: Date,
  endDate?: Date
) {
  const stats = await getExpenseStats(salonId, startDate, endDate)

  return Object.entries(stats.byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
}

/**
 * Get overdue expenses
 */
export async function getOverdueExpenses(salonId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueExpenses = await prisma.expense.findMany({
    where: {
      salonId,
      status: "PENDING",
      dueDate: {
        lt: today,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  })

  // Auto-update status to OVERDUE
  if (overdueExpenses.length > 0) {
    await prisma.expense.updateMany({
      where: {
        salonId,
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })
  }

  return overdueExpenses
}
