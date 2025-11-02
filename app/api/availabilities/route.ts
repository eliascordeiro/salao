import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Listar disponibilidades/bloqueios de um profissional
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate"); // YYYY-MM-DD
    const dayOfWeek = searchParams.get("dayOfWeek"); // 0-6
    const type = searchParams.get("type"); // BLOCK, AVAILABLE, RECURRING

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId é obrigatório" },
        { status: 400 }
      );
    }

    // Construir filtros
    const where: any = { staffId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.date = {
        gte: new Date(startDate),
      };
    }

    if (dayOfWeek !== null && dayOfWeek !== undefined) {
      where.dayOfWeek = parseInt(dayOfWeek);
    }

    if (type) {
      where.type = type;
    }

    const availabilities = await prisma.availability.findMany({
      where,
      orderBy: [
        { dayOfWeek: "asc" },
        { date: "asc" },
        { startTime: "asc" }
      ],
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(availabilities);
  } catch (error) {
    console.error("Erro ao buscar disponibilidades:", error);
    return NextResponse.json(
      { error: "Erro ao buscar disponibilidades" },
      { status: 500 }
    );
  }
}

// POST - Criar bloqueio de horário ou slot recorrente
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const data = await request.json();
    const { staffId, date, dayOfWeek, startTime, endTime, available, reason, type } = data;

    // Validações básicas
    if (!staffId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "staffId, startTime e endTime são obrigatórios" },
        { status: 400 }
      );
    }

    // Para slots recorrentes, dayOfWeek é obrigatório
    if (type === "RECURRING" && dayOfWeek === undefined) {
      return NextResponse.json(
        { error: "dayOfWeek é obrigatório para slots recorrentes" },
        { status: 400 }
      );
    }

    // Para bloqueios, date é obrigatório
    if (type !== "RECURRING" && !date) {
      return NextResponse.json(
        { error: "date é obrigatório para bloqueios" },
        { status: 400 }
      );
    }

    // Validar dayOfWeek (0-6)
    if (dayOfWeek !== undefined && (dayOfWeek < 0 || dayOfWeek > 6)) {
      return NextResponse.json(
        { error: "dayOfWeek deve estar entre 0 (Domingo) e 6 (Sábado)" },
        { status: 400 }
      );
    }

    // Validar formato de horário
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: "Formato de horário inválido. Use HH:mm" },
        { status: 400 }
      );
    }

    // Validar que endTime > startTime
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      return NextResponse.json(
        { error: "O horário de término deve ser após o início" },
        { status: 400 }
      );
    }

    // Verificar se o profissional existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Preparar dados para criação
    const createData: any = {
      staffId,
      startTime,
      endTime,
      available: available !== undefined ? available : (type === "RECURRING" ? true : false),
      reason: reason || null,
      type: type || "BLOCK",
      createdBy: session.user.id || null,
    };

    // Adicionar date ou dayOfWeek conforme o tipo
    if (type === "RECURRING") {
      createData.dayOfWeek = dayOfWeek;
    } else if (date) {
      createData.date = new Date(date);
    }

    // Criar disponibilidade/bloqueio/slot recorrente
    const availability = await prisma.availability.create({
      data: createData,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(availability, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar disponibilidade:", error);
    return NextResponse.json(
      { error: "Erro ao criar disponibilidade" },
      { status: 500 }
    );
  }
}
