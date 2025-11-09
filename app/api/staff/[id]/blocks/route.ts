import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const blocks = await prisma.block.findMany({
      where: {
        staffId: params.id,
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
    return NextResponse.json(
      { error: "Erro ao buscar bloqueios" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { date, startTime, endTime, reason, recurring } = body;

    // Validações
    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Data e horários são obrigatórios" },
        { status: 400 }
      );
    }

    const block = await prisma.block.create({
      data: {
        staffId: params.id,
        date: new Date(date),
        startTime,
        endTime,
        reason: reason || null,
        recurring: recurring || false,
      },
    });

    return NextResponse.json(block, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar bloqueio:", error);
    return NextResponse.json(
      { error: "Erro ao criar bloqueio" },
      { status: 500 }
    );
  }
}
