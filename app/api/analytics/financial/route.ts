import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalonId } from "@/lib/salon-helper";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

/**
 * GET /api/analytics/financial
 * Retorna relatórios financeiros avançados do salão
 * 
 * Query params:
 * - period: 3m, 6m, 12m (padrão: 6m)
 * - startDate: data inicial custom
 * - endDate: data final custom
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    const userSalonId = await getUserSalonId();
    
    if (!userSalonId) {
      return NextResponse.json(
        { success: false, error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "6m";
    const customStartDate = searchParams.get("startDate");
    const customEndDate = searchParams.get("endDate");

    // Calcular período
    let startDate: Date;
    let endDate = new Date();

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const months = parseInt(period.replace("m", ""));
      startDate = subMonths(endDate, months);
    }

    // 1. RECEITA (Pagamentos confirmados)
    const payments = await prisma.payment.findMany({
      where: {
        booking: {
          salonId: userSalonId,
        },
        status: "SUCCEEDED",
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        booking: {
          include: {
            service: true,
          },
        },
      },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // 2. DESPESAS (Pagas no período)
    const expenses = await prisma.expense.findMany({
      where: {
        salonId: userSalonId,
        status: "PAID",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // 3. LUCRO LÍQUIDO
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 4. DESPESAS POR CATEGORIA
    const expensesByCategory = expenses.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = {
          category: expense.category,
          total: 0,
          count: 0,
        };
      }
      acc[expense.category].total += expense.amount;
      acc[expense.category].count += 1;
      return acc;
    }, {} as Record<string, { category: string; total: number; count: number }>);

    // 5. EVOLUÇÃO MENSAL (últimos N meses)
    const monthlyData = [];
    let currentMonth = new Date(startDate);
    
    while (currentMonth <= endDate) {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      // Receita do mês
      const monthPayments = await prisma.payment.findMany({
        where: {
          booking: {
            salonId: userSalonId,
          },
          status: "SUCCEEDED",
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);

      // Despesas do mês
      const monthExpenses = await prisma.expense.findMany({
        where: {
          salonId: userSalonId,
          status: "PAID",
          paidAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      });

      const monthExpensesTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const monthProfit = monthRevenue - monthExpensesTotal;

      monthlyData.push({
        month: format(currentMonth, "MMM/yyyy"),
        revenue: monthRevenue,
        expenses: monthExpensesTotal,
        profit: monthProfit,
        profitMargin: monthRevenue > 0 ? (monthProfit / monthRevenue) * 100 : 0,
      });

      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }

    // 6. TOP CATEGORIAS DE DESPESA
    const topExpenseCategories = Object.values(expensesByCategory)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // 7. MÉTRICAS ADICIONAIS
    const avgMonthlyRevenue = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length
      : 0;

    const avgMonthlyExpenses = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length
      : 0;

    // 8. TENDÊNCIA (comparar primeiro e último mês)
    const firstMonth = monthlyData[0];
    const lastMonth = monthlyData[monthlyData.length - 1];
    
    const revenueTrend = firstMonth && lastMonth && firstMonth.revenue > 0
      ? ((lastMonth.revenue - firstMonth.revenue) / firstMonth.revenue) * 100
      : 0;

    const profitTrend = firstMonth && lastMonth && firstMonth.profit !== 0
      ? ((lastMonth.profit - firstMonth.profit) / Math.abs(firstMonth.profit)) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          label: period,
        },
        summary: {
          totalRevenue,
          totalExpenses,
          netProfit,
          profitMargin: Math.round(profitMargin * 100) / 100,
          avgMonthlyRevenue,
          avgMonthlyExpenses,
        },
        trends: {
          revenue: Math.round(revenueTrend * 100) / 100,
          profit: Math.round(profitTrend * 100) / 100,
        },
        expensesByCategory: topExpenseCategories,
        monthlyEvolution: monthlyData,
        breakdown: {
          revenueCount: payments.length,
          expensesCount: expenses.length,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar relatórios financeiros:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar relatórios financeiros",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
