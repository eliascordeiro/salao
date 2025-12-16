import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppClient } from "@/lib/whatsapp/evolution-client";
import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { getSalonByUserId } from "@/lib/salon-helper";

// POST /api/whatsapp/test - Enviar mensagem de teste
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

    const whatsapp = getWhatsAppClient();
    const result = await whatsapp.sendText({
      number: phone,
      text: message,
      delay: 1000,
    });

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso!",
      result,
    });
  } catch (error: any) {
    console.error("Erro ao enviar mensagem teste:", error);
    return NextResponse.json(
      {
        error: error.message || "Erro ao enviar mensagem",
        details: error.response?.data || null,
      },
      { status: 500 }
    );
  }
}
