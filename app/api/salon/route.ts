import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: Buscar dados do salão
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar o salão do usuário logado
    const salon = await prisma.salon.findFirst({
      where: {
        ownerId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        bookingType: true,
        description: true,
        address: true,
        phone: true,
        email: true,
        openTime: true,
        closeTime: true,
        workDays: true,
        active: true,
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    return NextResponse.json(salon);
  } catch (error) {
    console.error("Erro ao buscar salão:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
