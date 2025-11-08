import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Gerar slots automaticamente (substitui todos os existentes)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { staffId, slots, force } = await request.json();

    if (!staffId || !slots || !Array.isArray(slots)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Verificar se o profissional existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { id: true, name: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Buscar agendamentos futuros confirmados/pendentes
    const now = new Date();
    const futureBookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: {
          gte: now,
        },
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
      },
      select: {
        id: true,
        date: true,
        status: true,
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    // Se existem agendamentos e não forçou, retornar aviso
    if (futureBookings.length > 0 && !force) {
      // Verificar se algum agendamento cairá em conflito
      const conflicts = futureBookings.map((booking) => {
        const bookingDate = new Date(booking.date);
        const dayOfWeek = bookingDate.getDay();
        const timeStr = `${bookingDate.getHours().toString().padStart(2, '0')}:${bookingDate.getMinutes().toString().padStart(2, '0')}`;
        
        // Verificar se existe slot correspondente nos novos slots
        const hasMatchingSlot = slots.some(
          (slot: { dayOfWeek: number; startTime: string }) =>
            slot.dayOfWeek === dayOfWeek && slot.startTime === timeStr
        );

        return {
          id: booking.id,
          date: booking.date,
          time: timeStr,
          dayOfWeek,
          service: booking.service.name,
          duration: booking.service.duration,
          client: booking.client.name,
          email: booking.client.email,
          status: booking.status,
          willHaveConflict: !hasMatchingSlot,
        };
      });

      const conflictCount = conflicts.filter((c) => c.willHaveConflict).length;

      return NextResponse.json({
        requiresConfirmation: true,
        bookingsCount: futureBookings.length,
        conflictsCount: conflictCount,
        bookings: conflicts,
        message:
          conflictCount > 0
            ? `⚠️ ATENÇÃO: Existem ${futureBookings.length} agendamentos futuros, sendo ${conflictCount} que ficarão SEM SLOT disponível após regeneração!`
            : `ℹ️ Existem ${futureBookings.length} agendamentos futuros, mas todos têm slots correspondentes na nova grade.`,
      }, { status: 409 }); // 409 Conflict
    }

    // Buscar slots existentes
    const existingSlots = await prisma.availability.findMany({
      where: {
        staffId,
        type: "RECURRING",
      },
      select: { id: true },
    });

    // Executar regeneração em transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Deletar todos os slots recorrentes existentes
      const deleted = await tx.availability.deleteMany({
        where: {
          staffId,
          type: "RECURRING",
        },
      });

      // 2. Criar novos slots
      const created = await tx.availability.createMany({
        data: slots.map((slot: { dayOfWeek: number; startTime: string; endTime: string }) => ({
          staffId,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          available: true,
          type: "RECURRING",
        })),
      });

      return { deleted: deleted.count, created: created.count };
    });

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      created: result.created,
      bookingsCount: futureBookings.length,
      message: `✅ ${result.deleted} slots antigos removidos e ${result.created} novos slots criados. ${futureBookings.length > 0 ? `${futureBookings.length} agendamentos mantidos.` : ""}`,
    });
  } catch (error) {
    console.error("Erro ao gerar slots:", error);
    return NextResponse.json(
      { error: "Erro ao gerar slots automaticamente" },
      { status: 500 }
    );
  }
}