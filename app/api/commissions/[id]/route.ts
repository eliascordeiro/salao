import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

// PATCH - Marcar comissão como paga
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { status, paymentMethod, notes } = body;

    if (!status) {
      return NextResponse.json({ error: "status é obrigatório" }, { status: 400 });
    }

    if (!["PENDING", "PAID", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Verificar se a comissão pertence ao salão
    const commission = await prisma.commission.findFirst({
      where: {
        id: params.id,
        salonId: salon.id,
      },
    });

    if (!commission) {
      return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
    }

    // Atualizar comissão
    const updated = await prisma.commission.update({
      where: { id: params.id },
      data: {
        status,
        paidAt: status === "PAID" ? new Date() : null,
        paymentMethod: status === "PAID" ? paymentMethod : null,
        notes,
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    // Se foi marcada como paga, criar despesa automática
    if (status === "PAID" && commission.status !== "PAID") {
      await prisma.expense.create({
        data: {
          salonId: salon.id,
          description: `Comissão - ${updated.staff.name} - ${updated.service.name}`,
          amount: updated.calculatedValue,
          category: "SALARIES",
          dueDate: new Date(),
          paymentDate: new Date(),
          status: "PAID",
          paymentMethod: paymentMethod || "CASH",
          notes: `Comissão ID: ${updated.id}`,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar comissão:", error);
    return NextResponse.json({ error: "Erro ao atualizar comissão" }, { status: 500 });
  }
}

// DELETE - Cancelar comissão
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Verificar se a comissão pertence ao salão
    const commission = await prisma.commission.findFirst({
      where: {
        id: params.id,
        salonId: salon.id,
      },
    });

    if (!commission) {
      return NextResponse.json({ error: "Comissão não encontrada" }, { status: 404 });
    }

    // Não permitir deletar se já foi paga
    if (commission.status === "PAID") {
      return NextResponse.json(
        { error: "Não é possível deletar comissão já paga" },
        { status: 400 }
      );
    }

    // Deletar comissão
    await prisma.commission.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Comissão deletada com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar comissão:", error);
    return NextResponse.json({ error: "Erro ao deletar comissão" }, { status: 500 });
  }
}
