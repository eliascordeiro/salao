import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/schedule/dates-with-bookings?staffId=xxx&month=2025-11
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");
    const month = searchParams.get("month"); // Formato: YYYY-MM

    if (!staffId || !month) {
      return NextResponse.json(
        { error: "staffId e month são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar formato do mês
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { error: "Formato de mês inválido. Use: YYYY-MM" },
        { status: 400 }
      );
    }

    // Calcular primeiro e último dia do mês
    const [year, monthNum] = month.split("-").map(Number);
    const firstDay = new Date(year, monthNum - 1, 1);
    const lastDay = new Date(year, monthNum, 0, 23, 59, 59);

    // Buscar agendamentos do profissional no mês
    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: {
          gte: firstDay,
          lte: lastDay,
        },
        status: {
          in: ["PENDING", "CONFIRMED"], // Não incluir cancelados
        },
      },
      select: {
        date: true,
      },
    });

    // Extrair datas únicas (formato YYYY-MM-DD)
    const datesWithBookings = Array.from(
      new Set(
        bookings.map((booking) => {
          const date = new Date(booking.date);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        })
      )
    ).sort();

    return NextResponse.json({
      month,
      staffId,
      dates: datesWithBookings,
      count: datesWithBookings.length,
    });
  } catch (error) {
    console.error("Erro ao buscar datas com agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar datas com agendamentos" },
      { status: 500 }
    );
  }
}
