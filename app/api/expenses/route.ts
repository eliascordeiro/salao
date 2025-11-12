import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalonId } from "@/lib/salon-helper";

/**
 * GET /api/expenses
 * Lista todas as despesas do salão do usuário logado
 * Query params: status, category, startDate, endDate
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

    // Obter salão do usuário logado
    const userSalonId = await getUserSalonId();
    
    if (!userSalonId) {
      return NextResponse.json(
        { success: false, error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Construir filtro
    const where: any = {
      salonId: userSalonId,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.dueDate.lte = new Date(endDate);
      }
    }

    // Buscar despesas
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar despesas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar despesas",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/expenses
 * Cria uma nova despesa
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter salão do usuário logado
    const userSalonId = await getUserSalonId();
    
    if (!userSalonId) {
      return NextResponse.json(
        { success: false, error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      description,
      category,
      amount,
      dueDate,
      status,
      paymentMethod,
      isRecurring,
      recurrence,
      notes,
    } = body;

    // Validações
    if (!description || !category || !amount || !dueDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios: description, category, amount, dueDate",
        },
        { status: 400 }
      );
    }

    // Criar despesa
    const expense = await prisma.expense.create({
      data: {
        salonId: userSalonId,
        description,
        category,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        status: status || "PENDING",
        paymentMethod: paymentMethod || null,
        isRecurring: isRecurring || false,
        recurrence: recurrence || null,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Despesa criada com sucesso",
      data: expense,
    });
  } catch (error) {
    console.error("❌ Erro ao criar despesa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar despesa",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
