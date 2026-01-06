import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar bloqueios do profissional logado
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar staff profile
    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }

    const blocks = await prisma.block.findMany({
      where: {
        staffId: staffProfile.id,
      },
      orderBy: [
        { date: "asc" },
        { startTime: "asc" },
      ],
    });

    // Converter datas para string ISO
    const blocksFormatted = blocks.map(block => ({
      ...block,
      date: block.date.toISOString().split('T')[0],
    }));

    return NextResponse.json(blocksFormatted);
  } catch (error) {
    console.error("Erro ao buscar bloqueios:", error);
    return NextResponse.json({ error: "Erro ao buscar bloqueios" }, { status: 500 });
  }
}

// POST - Criar novo bloqueio
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    const { date, startTime, endTime, reason, recurring } = await request.json();

    // Validações
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Data, horário inicial e final são obrigatórios" },
        { status: 400 }
      );
    }

    const block = await prisma.block.create({
      data: {
        staffId: staffProfile.id,
        date: new Date(date),
        startTime,
        endTime,
        reason: reason || null,
        recurring: recurring || false,
      },
    });

    return NextResponse.json({
      ...block,
      date: block.date.toISOString().split('T')[0],
    });
  } catch (error) {
    console.error("Erro ao criar bloqueio:", error);
    return NextResponse.json({ error: "Erro ao criar bloqueio" }, { status: 500 });
  }
}
