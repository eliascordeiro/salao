import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendBookingReminderEmail,
  formatBookingDataForEmail,
} from "@/lib/email";
import { addDays, startOfDay, endOfDay } from "date-fns";

/**
 * API de Lembretes Automáticos
 * 
 * Este endpoint deve ser chamado diariamente (via cron job ou serviço agendado)
 * para enviar lembretes 24 horas antes dos agendamentos confirmados.
 * 
 * GET /api/notifications/reminders
 * 
 * Apenas ADMIN pode executar esta API.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Verificar autenticação
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas ADMIN pode executar lembretes automáticos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Calcular data de amanhã (24h de antecedência)
    const tomorrow = addDays(new Date(), 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);

    // Buscar todos os agendamentos confirmados para amanhã
    const bookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        date: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    console.log(
      `📧 Processando ${bookings.length} lembretes para ${tomorrow.toLocaleDateString()}`
    );

    // Enviar lembretes
    const results = await Promise.allSettled(
      bookings.map(async (booking) => {
        const emailData = formatBookingDataForEmail(booking);
        const result = await sendBookingReminderEmail(emailData, booking.id);
        return {
          bookingId: booking.id,
          clientEmail: booking.client?.email,
          success: result.success,
        };
      })
    );

    // Contar sucessos e falhas
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    const response = {
      message: "Lembretes processados",
      date: tomorrow.toISOString(),
      total: bookings.length,
      successful,
      failed,
      results: results.map((r, index) => {
        if (r.status === "fulfilled") {
          return {
            bookingId: bookings[index].id,
            clientEmail: bookings[index].client?.email,
            status: "success",
          };
        } else {
          return {
            bookingId: bookings[index].id,
            clientEmail: bookings[index].client?.email,
            status: "failed",
            error: r.reason?.message || "Erro desconhecido",
          };
        }
      }),
    };

    console.log(
      `✅ Lembretes enviados: ${successful}/${bookings.length} (${failed} falhas)`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao processar lembretes:", error);
    return NextResponse.json(
      { error: "Erro ao processar lembretes" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications/reminders
 * 
 * Permite enviar lembrete manual para um agendamento específico.
 * Útil para reenviar lembretes ou testar o sistema.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar o agendamento
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    // Enviar lembrete
    const emailData = formatBookingDataForEmail(booking);
    const result = await sendBookingReminderEmail(emailData, booking.id);

    if (result.success) {
      return NextResponse.json({
        message: "Lembrete enviado com sucesso",
        bookingId: booking.id,
        clientEmail: booking.client?.email,
      });
    } else {
      return NextResponse.json(
        {
          error: "Erro ao enviar lembrete",
          details: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao enviar lembrete manual:", error);
    return NextResponse.json(
      { error: "Erro ao enviar lembrete manual" },
      { status: 500 }
    );
  }
}
