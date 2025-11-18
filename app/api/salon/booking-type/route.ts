import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

// GET: Buscar tipo de agendamento do salão (público)
// NOTA: bookingType foi removido do schema - sistema usa apenas SLOT_BASED
export async function GET() {
  try {
    // Buscar o primeiro salão ativo (assumindo sistema single-tenant por enquanto)
    const salon = await prisma.salon.findFirst({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Se não encontrar salão, retornar configuração padrão
    if (!salon) {
      return NextResponse.json({
        bookingType: "SLOT_BASED",
        salonName: "Salão Demo",
      });
    }

    // Sistema agora usa apenas SLOT_BASED
    return NextResponse.json({
      bookingType: "SLOT_BASED",
      salonName: salon.name,
    });
  } catch (error) {
    console.error("Erro ao buscar tipo de agendamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
