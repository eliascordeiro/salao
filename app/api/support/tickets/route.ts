import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

// GET - Listar tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    // Construir filtros
    const where: any = {};
    
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (category && category !== "ALL") {
      where.category = category;
    }
    
    // Se não for admin, mostrar apenas tickets do usuário
    if (session?.user?.role !== "ADMIN") {
      where.userId = session?.user?.id;
    } else if (userId) {
      where.userId = userId;
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erro ao listar tickets:", error);
    return NextResponse.json(
      { error: "Erro ao listar tickets" },
      { status: 500 }
    );
  }
}

// POST - Criar novo ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { name, email, phone, subject, category, description } = body;

    // Validações
    if (!name || !email || !subject || !category || !description) {
      return NextResponse.json(
        { error: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Criar ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: session?.user?.id,
        name,
        email,
        phone,
        subject,
        category,
        description,
        status: "OPEN",
        priority: "MEDIUM",
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

    // Criar primeira mensagem
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: session?.user?.id,
        name,
        message: description,
        isStaff: false,
      },
    });

    // TODO: Enviar email de confirmação
    // await sendTicketCreatedEmail(ticket);

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    return NextResponse.json(
      { error: "Erro ao criar ticket" },
      { status: 500 }
    );
  }
}
