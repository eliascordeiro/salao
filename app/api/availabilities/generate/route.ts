import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Gerar slots automaticamente
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { staffId, slots } = await request.json();

    if (!staffId || !slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Verificar se o profissional existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Criar todos os slots em uma transação
    const createdSlots = await prisma.$transaction(
      slots.map((slot: { dayOfWeek: number; startTime: string; endTime: string }) =>
        prisma.availability.create({
          data: {
            staffId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            available: true,
            type: "RECURRING",
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      count: createdSlots.length,
      message: `${createdSlots.length} slots criados com sucesso`,
    });
  } catch (error) {
    console.error("Erro ao gerar slots:", error);
    return NextResponse.json(
      { error: "Erro ao gerar slots automaticamente" },
      { status: 500 }
    );
  }
}
