import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST - Adicionar mensagem ao ticket da plataforma
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Mensagem é obrigatória" },
        { status: 400 }
      );
    }

    // Verificar se o ticket existe e se o usuário tem permissão
    const ticket = await prisma.platformTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    if (ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão para responder este ticket" },
        { status: 403 }
      );
    }

    // Criar mensagem
    const ticketMessage = await prisma.platformTicketMessage.create({
      data: {
        ticketId: id,
        userId: session.user.id,
        name: session.user.name || "Usuário",
        message,
        isSupport: false, // Proprietário não é suporte
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Se o ticket estava resolvido e o cliente respondeu, reabrir
    if (ticket.status === "RESOLVED") {
      await prisma.platformTicket.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          resolvedAt: null,
        },
      });
    }

    return NextResponse.json(ticketMessage, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar mensagem ao ticket da plataforma:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar mensagem" },
      { status: 500 }
    );
  }
}
