import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp/wppconnect-client";
import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { getSalonByUserId } from "@/lib/salon-helper";

// POST /api/whatsapp/test - Enviar mensagem de teste via WPPConnect
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getSalonByUserId(session.user.id);
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Verificar feature
    const hasWhatsApp = await hasFeature(salon.id, FEATURES.WHATSAPP_NOTIFICATIONS);
    if (!hasWhatsApp) {
      return NextResponse.json(
        {
          error: "Feature WhatsApp não disponível",
          message: "Faça upgrade para o plano Profissional para usar WhatsApp",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Telefone e mensagem são obrigatórios" },
        { status: 400 }
      );
    }

    console.log(`📤 Tentando enviar mensagem de teste para ${phone}`);
    
    // Usar WPPConnect para enviar mensagem
    const result = await sendWhatsAppMessage(phone, message);

    // Interpretar status de entrega
    let deliveryStatus = 'unknown';
    let deliveryMessage = 'Status desconhecido';
    
    if (result?.ack === 0) {
      deliveryStatus = 'error';
      deliveryMessage = 'Erro ao enviar';
    } else if (result?.ack === 1) {
      deliveryStatus = 'sent';
      deliveryMessage = 'Enviada (1 check ✓)';
    } else if (result?.ack === 2) {
      deliveryStatus = 'received';
      deliveryMessage = 'Recebida pelo servidor (2 checks ✓✓)';
    } else if (result?.ack === 3) {
      deliveryStatus = 'delivered';
      deliveryMessage = 'Entregue ao destinatário (azul ✓✓)';
    } else if (result?.ack === 4) {
      deliveryStatus = 'read';
      deliveryMessage = 'Lida pelo destinatário (azul ✓✓)';
    }

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso via WPPConnect!",
      deliveryStatus,
      deliveryMessage,
      ack: result?.ack,
      messageId: result?.id,
      result,
    });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem teste:", error);
    return NextResponse.json(
      {
        error: error.message || "Erro ao enviar mensagem",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
