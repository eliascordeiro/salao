import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Remover bloqueio
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ blockId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { blockId } = await context.params;

    // Buscar staff profile
    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    // Verificar permissão
    if (!staffProfile.canManageBlocks) {
      return NextResponse.json(
        { error: "Você não tem permissão para gerenciar bloqueios. Contate o administrador." },
        { status: 403 }
      );
    }

    // Verificar se o bloqueio pertence a este profissional
    const block = await prisma.block.findUnique({
      where: { id: blockId },
    });

    if (!block || block.staffId !== staffProfile.id) {
      return NextResponse.json({ error: "Bloqueio não encontrado" }, { status: 404 });
    }

    await prisma.block.delete({
      where: { id: blockId },
    });

    return NextResponse.json({ message: "Bloqueio removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover bloqueio:", error);
    return NextResponse.json({ error: "Erro ao remover bloqueio" }, { status: 500 });
  }
}
