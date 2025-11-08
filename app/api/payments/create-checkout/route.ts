import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/stripe";

/**
 * API de Criação de Checkout
 * POST /api/payments/create-checkout
 * 
 * Cria uma sessão de checkout do Stripe para um agendamento
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar agendamento
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        service: true,
        staff: true,
        payment: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o usuário é dono do agendamento ou admin
    if (
      session.user.id !== booking.clientId &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Você não tem permissão para pagar este agendamento" },
        { status: 403 }
      );
    }

    // Verificar se já existe pagamento
    if (booking.payment) {
      if (booking.payment.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Este agendamento já foi pago" },
          { status: 400 }
        );
      }

      // Se existe pagamento pendente, pode criar novo checkout
      if (booking.payment.status === "PENDING") {
        // Cancelar pagamento anterior se ainda pendente
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
          },
        });
      }
    }

    // URLs de retorno
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/pagamento/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pagamento/cancelado?booking_id=${bookingId}`;

    // Criar sessão de checkout no Stripe
    const result = await createCheckoutSession({
      amount: booking.totalPrice,
      bookingId: booking.id,
      clientEmail: booking.client.email,
      clientName: booking.client.name,
      successUrl,
      cancelUrl,
      metadata: {
        serviceId: booking.serviceId,
        serviceName: booking.service.name,
        staffId: booking.staffId,
        staffName: booking.staff.name,
      },
    });

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || "Erro ao criar sessão de checkout" },
        { status: 500 }
      );
    }

    // Criar registro de pagamento no banco
    const payment = await prisma.payment.create({
      data: {
        amount: booking.totalPrice,
        status: "PENDING",
        provider: "STRIPE",
        currency: "BRL",
        stripeSessionId: result.session.id,
        bookingId: booking.id,
        userId: booking.clientId,
        metadata: JSON.stringify({
          serviceId: booking.serviceId,
          serviceName: booking.service.name,
          staffId: booking.staffId,
          staffName: booking.staff.name,
        }),
      },
    });

    // Criar transação inicial
    await prisma.transaction.create({
      data: {
        externalId: result.session.id,
        status: "PENDING",
        amount: booking.totalPrice,
        method: "CREDIT_CARD",
        paymentId: payment.id,
        metadata: JSON.stringify({
          sessionUrl: result.session.url,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: result.session.id,
      sessionUrl: result.session.url,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}
