import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; blockId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    await prisma.block.delete({
      where: {
        id: params.blockId,
      },
    });

    return NextResponse.json({ message: "Bloqueio removido com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar bloqueio:", error);
    return NextResponse.json(
      { error: "Erro ao deletar bloqueio" },
      { status: 500 }
    );
  }
}
