import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalonId } from "@/lib/salon-helper";

/**
 * GET /api/expenses/[id]
 * Busca uma despesa específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Buscar despesa
    const expense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    // Verificar se pertence ao salão do usuário
    if (expense.salonId !== userSalonId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 403 }
      );
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Erro ao buscar despesa:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar despesa" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/expenses/[id]
 * Atualiza uma despesa (editar ou marcar como paga)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const body = await request.json();

    // Verificar se despesa pertence ao salão do usuário
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    if (existingExpense.salonId !== userSalonId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Atualizar despesa
    const updateData: any = {};

    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);
    if (body.dueDate !== undefined) updateData.dueDate = new Date(body.dueDate);
    if (body.status !== undefined) {
      updateData.status = body.status;
      // Se marcar como pago, adicionar data de pagamento
      if (body.status === "PAID" && !existingExpense.paidAt) {
        updateData.paidAt = new Date();
      }
    }
    if (body.paymentMethod !== undefined) updateData.paymentMethod = body.paymentMethod;
    if (body.isRecurring !== undefined) updateData.isRecurring = body.isRecurring;
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const expense = await prisma.expense.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Despesa atualizada com sucesso",
      data: expense,
    });
  } catch (error) {
    console.error("❌ Erro ao atualizar despesa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar despesa",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/expenses/[id]
 * Exclui uma despesa
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Verificar se despesa pertence ao salão do usuário
    const existingExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { success: false, error: "Despesa não encontrada" },
        { status: 404 }
      );
    }

    if (existingExpense.salonId !== userSalonId) {
      return NextResponse.json(
        { success: false, error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Deletar despesa
    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Despesa excluída com sucesso",
    });
  } catch (error) {
    console.error("❌ Erro ao excluir despesa:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao excluir despesa",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
