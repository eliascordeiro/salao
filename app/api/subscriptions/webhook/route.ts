import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentInfo, mapMPStatusToOurs } from "@/lib/mercadopago";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log("🔔 Webhook recebido do Mercado Pago:", body);

    // Mercado Pago envia notificações de pagamento
    if (body.type === "payment" && body.data?.id) {
      const paymentId = body.data.id;

      // Buscar informações completas do pagamento
      const payment = await getPaymentInfo(paymentId);
      
      console.log("💳 Pagamento encontrado:", {
        id: payment.id,
        status: payment.status,
        amount: payment.transaction_amount,
      });

      // Buscar assinatura pelo ID do salão (vem no metadata)
      const salonId = payment.metadata?.salon_id;
      if (!salonId) {
        console.error("❌ salon_id não encontrado no metadata");
        return NextResponse.json({ received: true });
      }

      const subscription = await prisma.subscription.findUnique({
        where: { salonId: salonId as string },
        include: { plan: true },
      });

      if (!subscription) {
        console.error("❌ Assinatura não encontrada para salon:", salonId);
        return NextResponse.json({ received: true });
      }

      // Atualizar status da assinatura
      const newStatus = mapMPStatusToOurs(payment.status || '');
      const isApproved = payment.status === 'approved';

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: newStatus,
          mpPaymentId: payment.id?.toString(),
          lastPaymentDate: isApproved ? new Date() : undefined,
          lastPaymentAmount: payment.transaction_amount,
          lastPaymentStatus: payment.status,
          startDate: isApproved && !subscription.startDate ? new Date() : undefined,
          nextBillingDate: isApproved 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próxima cobrança em 30 dias
            : undefined,
        },
      });

      // Registrar pagamento na tabela de histórico
      if (isApproved) {
        await prisma.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            mpPaymentId: payment.id?.toString() || '',
            mpStatus: payment.status || '',
            mpStatusDetail: payment.status_detail,
            amount: payment.transaction_amount || 0,
            currency: 'BRL',
            paymentMethod: subscription.paymentMethod,
            paidAt: new Date(),
          },
        });

        console.log("✅ Assinatura ativada com sucesso!");
      }

      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error("❌ Erro ao processar webhook:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// GET para teste (Mercado Pago faz um GET primeiro para validar URL)
export async function GET() {
  return NextResponse.json({ status: "Webhook ativo" });
}
