import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retrieveCheckoutSession } from "@/lib/stripe";

// Força renderização dinâmica (usa headers para auth)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "ID da sessão não fornecido" },
        { status: 400 }
      );
    }

    // Buscar sessão no Stripe
    const stripeResult = await retrieveCheckoutSession(sessionId);

    if (!stripeResult.success) {
      return NextResponse.json(
        { error: stripeResult.error },
        { status: 400 }
      );
    }

    const stripeSession = stripeResult.session;

    // Buscar pagamento no banco de dados
    const payment = await prisma.payment.findFirst({
      where: {
        stripeSessionId: sessionId,
      },
      include: {
        booking: {
          include: {
            service: true,
            staff: true,
            client: true,
          },
        },
        transactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário tem permissão para ver este pagamento
    if (
      session.user.id !== payment.userId &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    // Retornar dados do pagamento
    return NextResponse.json({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      method: payment.method,
      provider: payment.provider,
      paidAt: payment.paidAt,
      booking: {
        id: payment.booking.id,
        date: payment.booking.date,
        service: {
          name: payment.booking.service.name,
          duration: payment.booking.service.duration,
        },
        staff: {
          name: payment.booking.staff.name,
        },
        client: {
          name: payment.booking.client.name,
          email: payment.booking.client.email,
        },
      },
      stripeSession: {
        paymentStatus: stripeSession?.payment_status,
        customerEmail: stripeSession?.customer_email,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar sessão de pagamento:", error);
    return NextResponse.json(
      { error: "Erro ao verificar pagamento" },
      { status: 500 }
    );
  }
}
