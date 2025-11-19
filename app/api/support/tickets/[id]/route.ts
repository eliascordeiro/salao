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
    const { id } = params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
                email: true,
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

    // Verificar permissões
    if (
      session?.user?.role !== "ADMIN" &&
      ticket.userId !== session?.user?.id
    ) {
      return NextResponse.json(
        { error: "Sem permissão para acessar este ticket" },
        { status: 403 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao buscar ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar status/priority do ticket (apenas admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem atualizar tickets" },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    const { status, priority, assignedTo } = body;

    const updateData: any = {};
    
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    
    // Se marcado como resolvido, adicionar timestamp
    if (status === "RESOLVED" && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // TODO: Enviar email de atualização
    // if (status === "RESOLVED") {
    //   await sendTicketResolvedEmail(ticket);
    // }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar ticket" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar ticket (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas administradores podem deletar tickets" },
        { status: 403 }
      );
    }

    const { id } = params;

    await prisma.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Ticket deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao deletar ticket" },
      { status: 500 }
    );
  }
}
