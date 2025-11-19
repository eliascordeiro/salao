import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// POST - Adicionar mensagem ao ticket
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = params;
    const body = await request.json();

    const { message } = body;

    if (!message || message.trim() === "") {
      return NextResponse.json(
        { error: "Mensagem não pode estar vazia" },
        { status: 400 }
      );
    }

    // Verificar se ticket existe
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket não encontrado" },
        { status: 404 }
      );
    }

    // Verificar permissões
    if (
      session?.user?.role !== "ADMIN" &&
      ticket.userId !== session?.user?.id
    ) {
      return NextResponse.json(
        { error: "Sem permissão para responder este ticket" },
        { status: 403 }
      );
    }

    // Criar mensagem
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        userId: session?.user?.id,
        name: session?.user?.name || "Usuário",
        message,
        isStaff: session?.user?.role === "ADMIN",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Se for resposta de admin, atualizar status para IN_PROGRESS
    if (session?.user?.role === "ADMIN" && ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
          assignedTo: session.user.id,
        },
      });
    }

    // TODO: Enviar email de resposta
    // if (session?.user?.role === "ADMIN") {
    //   await sendTicketResponseEmail(ticket, message);
    // }

    return NextResponse.json(ticketMessage, { status: 201 });
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    return NextResponse.json(
      { error: "Erro ao adicionar mensagem" },
      { status: 500 }
    );
  }
}
