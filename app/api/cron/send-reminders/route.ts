import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingNotification } from "@/lib/whatsapp/notifications";

/**
 * API de Lembretes Automáticos 24h Antes
 * 
 * COMO USAR:
 * 1. Configure um cron job no Railway para executar a cada hora
 * 2. Adicione CRON_SECRET no .env (token de segurança)
 * 3. Configure o cron para chamar: https://seu-dominio.com/api/cron/send-reminders
 * 4. Header: Authorization: Bearer SEU_CRON_SECRET
 * 
 * EXEMPLO DE CONFIGURAÇÃO RAILWAY:
 * Cron Schedule: 0 * * * * (a cada hora)
 * Command: curl -X POST https://seu-dominio.com/api/cron/send-reminders \
 *          -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação via Bearer token
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token || token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // 2. Calcular janela de tempo (23h a 25h no futuro para margem de segurança)
    const now = new Date();
    const minTime = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23h
    const maxTime = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25h

    console.log(`🔍 Buscando agendamentos entre ${minTime.toISOString()} e ${maxTime.toISOString()}`);

    // 3. Buscar agendamentos confirmados nas próximas 24h que ainda não receberam lembrete
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: minTime,
          lte: maxTime,
        },
        status: "CONFIRMED",
        reminderSent: false,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            name: true,
            price: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    console.log(`📊 Encontrados ${bookings.length} agendamentos para lembrete`);

    // 4. Enviar lembretes
    const results = [];
    for (const booking of bookings) {
      try {
        const bookingDate = new Date(booking.date);
        const timeStr = `${bookingDate.getUTCHours().toString().padStart(2, "0")}:${bookingDate.getUTCMinutes().toString().padStart(2, "0")}`;

        // Enviar notificação (Email + WhatsApp se plano permitir)
        await sendBookingNotification(
          {
            salonId: booking.salon.id,
            clientName: booking.client.name,
            clientEmail: booking.client.email,
            clientPhone: booking.client.phone,
            serviceName: booking.service.name,
            staffName: booking.staff.name,
            date: booking.date,
            time: timeStr,
            salonName: booking.salon.name,
            salonAddress: booking.salon.address,
            salonPhone: booking.salon.phone,
            price: booking.service.price,
            bookingId: booking.id,
          },
          "reminder"
        );

        // Marcar como enviado
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSent: true },
        });

        results.push({
          bookingId: booking.id,
          clientName: booking.client.name,
          date: booking.date,
          status: "sent",
        });

        console.log(`✅ Lembrete enviado: ${booking.client.name} - ${booking.service.name}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar lembrete para booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          clientName: booking.client.name,
          date: booking.date,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    // 5. Retornar resumo
    const summary = {
      totalFound: bookings.length,
      sent: results.filter((r) => r.status === "sent").length,
      errors: results.filter((r) => r.status === "error").length,
      details: results,
      executedAt: new Date().toISOString(),
    };

    console.log(`📧 Resumo: ${summary.sent} enviados, ${summary.errors} erros`);

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error("❌ Erro ao processar lembretes:", error);
    return NextResponse.json(
      {
        error: "Erro ao processar lembretes",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET para teste manual (sem autenticação em desenvolvimento)
 */
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Use POST com autenticação" },
      { status: 405 }
    );
  }

  // Em desenvolvimento, permite GET para testes
  return POST(request);
}
