import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { addMonths, addWeeks, addYears, startOfMonth, endOfMonth } from "date-fns"

/**
 * POST /api/expenses/generate-recurring
 * Gera novas despesas baseadas em despesas recorrentes
 * Esta rota pode ser chamada por um cron job diário
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
    const nextMonth = addMonths(today, 1)
    const monthStart = startOfMonth(nextMonth)
    const monthEnd = endOfMonth(nextMonth)

    // Buscar todas as despesas recorrentes ativas
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        recurrence: {
          in: ["MONTHLY", "WEEKLY", "YEARLY"],
        },
      },
    })

    if (recurringExpenses.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Nenhuma despesa recorrente encontrada",
        generated: 0,
      })
    }

    const generatedExpenses = []

    for (const expense of recurringExpenses) {
      let nextDueDate: Date

      // Calcular próxima data de vencimento
      switch (expense.recurrence) {
        case "MONTHLY":
          nextDueDate = addMonths(expense.dueDate, 1)
          break
        case "WEEKLY":
          nextDueDate = addWeeks(expense.dueDate, 1)
          break
        case "YEARLY":
          nextDueDate = addYears(expense.dueDate, 1)
          break
        default:
          continue
      }

      // Verificar se a próxima despesa já existe
      const existingNextExpense = await prisma.expense.findFirst({
        where: {
          salonId: expense.salonId,
          description: expense.description,
          category: expense.category,
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      // Se já existe, pular
      if (existingNextExpense) {
        console.log(`⏭️  Despesa recorrente já existe: ${expense.description}`)
        continue
      }

      // Criar nova despesa
      const newExpense = await prisma.expense.create({
        data: {
          salonId: expense.salonId,
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          status: "PENDING",
          dueDate: nextDueDate,
          isRecurring: true,
          recurrence: expense.recurrence,
          notes: expense.notes,
        },
      })

      generatedExpenses.push(newExpense)
      console.log(`✅ Despesa recorrente criada: ${newExpense.description}`)
    }

    return NextResponse.json({
      success: true,
      message: `${generatedExpenses.length} despesas recorrentes geradas`,
      generated: generatedExpenses.length,
      expenses: generatedExpenses.map((e) => ({
        id: e.id,
        description: e.description,
        dueDate: e.dueDate,
        amount: e.amount,
        recurrence: e.recurrence,
      })),
    })
  } catch (error) {
    console.error("❌ Erro ao gerar despesas recorrentes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao gerar despesas recorrentes",
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/expenses/generate-recurring
 * Versão GET para preview/testes
 */
export async function GET() {
  try {
    const today = new Date()
    const nextMonth = addMonths(today, 1)
    const monthStart = startOfMonth(nextMonth)
    const monthEnd = endOfMonth(nextMonth)

    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
        recurrence: {
          in: ["MONTHLY", "WEEKLY", "YEARLY"],
        },
      },
      include: {
        salon: {
          select: {
            name: true,
          },
        },
      },
    })

    const preview = []

    for (const expense of recurringExpenses) {
      let nextDueDate: Date

      switch (expense.recurrence) {
        case "MONTHLY":
          nextDueDate = addMonths(expense.dueDate, 1)
          break
        case "WEEKLY":
          nextDueDate = addWeeks(expense.dueDate, 1)
          break
        case "YEARLY":
          nextDueDate = addYears(expense.dueDate, 1)
          break
        default:
          continue
      }

      // Verificar se já existe
      const existing = await prisma.expense.findFirst({
        where: {
          salonId: expense.salonId,
          description: expense.description,
          category: expense.category,
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      })

      preview.push({
        originalId: expense.id,
        description: expense.description,
        amount: expense.amount,
        recurrence: expense.recurrence,
        currentDueDate: expense.dueDate,
        nextDueDate,
        willBeCreated: !existing,
        salon: expense.salon.name,
      })
    }

    return NextResponse.json({
      success: true,
      total: recurringExpenses.length,
      toBeCreated: preview.filter((p) => p.willBeCreated).length,
      preview,
    })
  } catch (error) {
    console.error("Erro ao buscar preview de despesas recorrentes:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar preview",
      },
      { status: 500 }
    )
  }
}
