import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Buscar tipo de agendamento do salão (público)
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
        bookingType: true,
      },
    });

    // Se não encontrar salão, retornar configuração padrão
    if (!salon) {
      return NextResponse.json({
        bookingType: "BOTH",
        salonName: "Salão Demo",
      });
    }

    return NextResponse.json({
      bookingType: salon.bookingType || "BOTH",
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
