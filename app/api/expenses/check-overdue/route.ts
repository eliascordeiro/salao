import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/expenses/check-overdue
 * Verifica e atualiza despesas vencidas para status OVERDUE
 * Esta rota pode ser chamada por um cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar header de autorização (para segurança do cron)
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Buscar despesas pendentes com data de vencimento passada
    const overdueExpenses = await prisma.expense.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
    })

    if (overdueExpenses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma despesa atrasada encontrada",
        updated: 0,
      })
    }

    // Atualizar status para OVERDUE
    const result = await prisma.expense.updateMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
      data: {
        status: "OVERDUE",
      },
    })

    console.log(`✅ ${result.count} despesas marcadas como atrasadas`)

    return NextResponse.json({
      success: true,
      message: `${result.count} despesas atualizadas para OVERDUE`,
      updated: result.count,
      expenses: overdueExpenses.map((e) => ({
        id: e.id,
        description: e.description,
        dueDate: e.dueDate,
        amount: e.amount,
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao verificar despesas atrasadas:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar despesas atrasadas",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/expenses/check-overdue
 * Versão GET para testes manuais
 */
export async function GET() {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueExpenses = await prisma.expense.findMany({
      where: {
        status: "PENDING",
        dueDate: {
          lt: today,
        },
      },
      select: {
        id: true,
        description: true,
        dueDate: true,
        amount: true,
        salon: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      count: overdueExpenses.length,
      expenses: overdueExpenses,
    })
  } catch (error) {
    console.error("Erro ao buscar despesas atrasadas:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar despesas atrasadas",
      },
      { status: 500 }
    )
  }
}
