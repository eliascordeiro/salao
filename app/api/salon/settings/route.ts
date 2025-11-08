import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: Atualizar configurações do salão
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { bookingType } = await request.json();

    // Validar bookingType
    if (!["DYNAMIC", "SLOT_BASED", "BOTH"].includes(bookingType)) {
      return NextResponse.json(
        { error: "Tipo de agendamento inválido" },
        { status: 400 }
      );
    }

    // Buscar o salão do usuário
    const salon = await prisma.salon.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Atualizar configuração
    const updatedSalon = await prisma.salon.update({
      where: { id: salon.id },
      data: { bookingType },
      select: {
        id: true,
        name: true,
        bookingType: true,
      },
    });

    return NextResponse.json({
      success: true,
      salon: updatedSalon,
      message: "Configurações atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
