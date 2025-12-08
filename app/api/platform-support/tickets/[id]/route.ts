import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Obter detalhes de um ticket específico
export async function GET(
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

    const ticket = await prisma.platformTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para ver este ticket
    if (ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão para ver este ticket" },
        { status: 403 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Erro ao obter ticket da plataforma:", error);
    return NextResponse.json(
      { error: "Erro ao obter ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status do ticket (apenas para fechar - o suporte altera pelo painel admin)
export async function PATCH(
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
    const { status } = body;

    const ticket = await prisma.platformTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (ticket.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Sem permissão para alterar este ticket" },
        { status: 403 }
      );
    }

    // Proprietário só pode fechar tickets resolvidos
    if (status === "CLOSED" && ticket.status === "RESOLVED") {
      const updatedTicket = await prisma.platformTicket.update({
        where: { id },
        data: {
          status: "CLOSED",
          resolvedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          salon: {
            select: {
              id: true,
              name: true,
            },
          },
          messages: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });

      return NextResponse.json(updatedTicket);
    }

    return NextResponse.json(
      { error: "Apenas tickets resolvidos podem ser fechados" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erro ao atualizar ticket da plataforma:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ticket" },
      { status: 500 }
    );
  }
}
