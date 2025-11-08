import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Deletar bloqueio de horário
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await prisma.availability.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Bloqueio deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar bloqueio:", error);
    return NextResponse.json(
      { error: "Erro ao deletar bloqueio" },
      { status: 500 }
    );
  }
}
