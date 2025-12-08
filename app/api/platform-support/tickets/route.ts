import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getSalonByUserId } from "@/lib/salon-helper";

// GET - Listar tickets da plataforma
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    // Construir filtros
    const where: any = {
      userId: session.user.id, // Apenas tickets do usuário logado
    };
    
    if (status && status !== "ALL") {
      where.status = status;
    }
    
    if (category && category !== "ALL") {
      where.category = category;
    }

    const tickets = await prisma.platformTicket.findMany({
      where,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Erro ao listar tickets da plataforma:", error);
    return NextResponse.json(
      { error: "Erro ao listar tickets" },
      { status: 500 }
    );
  }
}

// POST - Criar novo ticket de suporte da plataforma
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, category, description, priority = "MEDIUM" } = body;

    // Validações
    if (!subject || !category || !description) {
      return NextResponse.json(
        { error: "Subject, categoria e descrição são obrigatórios" },
        { status: 400 }
      );
    }

    // Obter salão do usuário
    const salon = await getSalonByUserId(session.user.id);
    
    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Criar ticket
    const ticket = await prisma.platformTicket.create({
      data: {
        userId: session.user.id,
        salonId: salon.id,
        subject,
        category,
        description,
        priority,
        status: "OPEN",
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
        messages: true,
      },
    });

    // TODO: Enviar email de notificação para o suporte da plataforma
    // Você pode adicionar isso depois

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar ticket da plataforma:", error);
    return NextResponse.json(
      { error: "Erro ao criar ticket" },
      { status: 500 }
    );
  }
}
