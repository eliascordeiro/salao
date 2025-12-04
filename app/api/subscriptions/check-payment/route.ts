import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { prisma } from "@/lib/prisma";

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

/**
 * Verifica status de um pagamento PIX
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID não informado" },
        { status: 400 }
      );
    }

    // Buscar status do pagamento no Mercado Pago
    const paymentClient = new Payment(client);
    const payment = await paymentClient.get({ id: paymentId });

    console.log("📊 Status do pagamento:", payment.id, "-", payment.status);

    // Se aprovado, ativar assinatura
    if (payment.status === "approved") {
      const salon = await prisma.salon.findFirst({
        where: { ownerId: session.user.id },
      });

      if (salon) {
        await prisma.subscription.updateMany({
          where: {
            salonId: salon.id,
            mpSubscriptionId: String(paymentId),
          },
          data: {
            status: "ACTIVE",
          },
        });
        
        console.log("✅ Assinatura ativada via PIX");
      }
    }

    // Recomendar intervalo de próxima verificação para o frontend.
    // PIXs que aguardam transferência podem demorar mais; sugerimos aumentar o intervalo.
    let nextCheckInMs = 3000;
    if (payment.status === 'pending' && payment.status_detail === 'pending_waiting_transfer') {
      nextCheckInMs = 10000; // 10s para reduzir carga de polling
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      nextCheckInMs,
    });

  } catch (error: any) {
    console.error("❌ Erro ao verificar pagamento:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao verificar pagamento",
      },
      { status: 500 }
    );
  }
}
