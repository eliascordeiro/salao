import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Configurar cliente do Mercado Pago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
  options: { timeout: 5000 }
});

/**
 * Cria pagamento PIX integrado (sem redirect)
 * Retorna QR Code e dados para exibição na aplicação
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    const { planSlug } = await request.json();

    console.log("📥 Criando pagamento PIX:", { planSlug });

    // Validar campos obrigatórios
    if (!planSlug) {
      return NextResponse.json(
        { error: "Plano não informado" },
        { status: 400 }
      );
    }

    // Buscar plano
    const plan = await prisma.plan.findUnique({
      where: { slug: planSlug },
    });

    if (!plan || !plan.active) {
      return NextResponse.json(
        { error: "Plano não encontrado ou inativo" },
        { status: 404 }
      );
    }

    // Buscar salão do usuário
    const salon = await prisma.salon.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já tem assinatura ativa
    const existingSubscription = await prisma.subscription.findUnique({
      where: { salonId: salon.id },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa" },
        { status: 400 }
      );
    }

    // Calcular datas
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 dias
    const firstBilling = new Date(trialEnd.getTime() + 1 * 24 * 60 * 60 * 1000); // 1 dia após trial

    // Criar pagamento PIX
    console.log("📱 Criando pagamento PIX...");
    
    const paymentClient = new Payment(client);
    
    const pixPayment = await paymentClient.create({
      body: {
        transaction_amount: plan.price,
        description: `Assinatura ${plan.name} - ${salon.name}`,
        payment_method_id: "pix",
        payer: {
          email: session.user.email!,
          first_name: session.user.name?.split(' ')[0] || 'Cliente',
          last_name: session.user.name?.split(' ').slice(1).join(' ') || 'Salão',
        },
        external_reference: `subscription_${salon.id}`,
        metadata: {
          plan_slug: planSlug,
          salon_id: salon.id,
          is_subscription: true,
        },
      },
    });

    console.log("✅ Pagamento PIX criado:", pixPayment.id, "- Status:", pixPayment.status);

    // Extrair dados do PIX
    const qrCodeBase64 = pixPayment.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = pixPayment.point_of_interaction?.transaction_data?.qr_code;
    const ticketUrl = pixPayment.point_of_interaction?.transaction_data?.ticket_url;

    if (!qrCode || !qrCodeBase64) {
      throw new Error("Erro ao gerar QR Code PIX");
    }

    // Salvar assinatura como PENDING (aguardando pagamento)
    const subscription = await prisma.subscription.upsert({
      where: { salonId: salon.id },
      update: {
        planId: plan.id,
        mpSubscriptionId: String(pixPayment.id),
        paymentMethod: 'pix',
        status: 'PENDING',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
      create: {
        salonId: salon.id,
        planId: plan.id,
        mpSubscriptionId: String(pixPayment.id),
        paymentMethod: 'pix',
        status: 'PENDING',
        startDate: now,
        trialEndsAt: trialEnd,
        nextBillingDate: firstBilling,
      },
    });

    console.log("✅ Assinatura criada (aguardando pagamento):", {
      subscriptionId: subscription.id,
      paymentId: pixPayment.id,
    });

    return NextResponse.json({
      success: true,
      paymentId: pixPayment.id,
      subscriptionId: subscription.id,
      qrCode: qrCode, // Código PIX (copia e cola)
      qrCodeBase64: qrCodeBase64, // Imagem QR Code em base64
      ticketUrl: ticketUrl, // URL alternativa
      amount: plan.price,
      status: pixPayment.status,
      expirationDate: pixPayment.date_of_expiration,
    });

  } catch (error: any) {
    console.error("❌ Erro ao criar pagamento PIX:", error);
    return NextResponse.json(
      { 
        error: error.message || "Erro ao criar pagamento PIX",
        details: error.cause,
      },
      { status: 500 }
    );
  }
}
