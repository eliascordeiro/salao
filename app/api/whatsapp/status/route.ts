import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getWhatsAppClient } from "@/lib/whatsapp/evolution-client";
import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { getSalonByUserId } from "@/lib/salon-helper";

// GET /api/whatsapp/status - Verificar status da conexão
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getSalonByUserId(session.user.id);
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Verificar se tem acesso à feature
    const hasWhatsApp = await hasFeature(salon.id, FEATURES.WHATSAPP_NOTIFICATIONS);
    if (!hasWhatsApp) {
      return NextResponse.json(
        {
          error: "Feature WhatsApp não disponível no seu plano",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // Verificar se Evolution API está configurada
    if (
      !process.env.EVOLUTION_API_URL ||
      !process.env.EVOLUTION_API_KEY
    ) {
      return NextResponse.json(
        {
          error: "Evolution API não configurada",
          configured: false,
        },
        { status: 503 }
      );
    }

    // Buscar status da instância
    const whatsapp = getWhatsAppClient();
    const status = await whatsapp.getInstanceStatus();

    return NextResponse.json({
      configured: true,
      connected: status.state === "open",
      status: status.state,
      instance: status.instance || {},
    });
  } catch (error: any) {
    console.error("Erro ao verificar status WhatsApp:", error);
    return NextResponse.json(
      {
        error: error.message || "Erro ao verificar status",
        configured: false,
        connected: false,
      },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/status - Conectar/Reconectar WhatsApp
export async function POST() {
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
        { error: "Feature WhatsApp não disponível no seu plano" },
        { status: 403 }
      );
    }

    const whatsapp = getWhatsAppClient();

    try {
      // Tentar obter QR Code existente
      const qrCode = await whatsapp.getQRCode();
      return NextResponse.json({
        success: true,
        qrCode: qrCode.base64 || qrCode.qrcode,
        message: "Escaneie o QR Code com seu WhatsApp",
      });
    } catch (error) {
      // Se falhar, criar nova instância
      await whatsapp.createInstance();
      const qrCode = await whatsapp.getQRCode();
      
      return NextResponse.json({
        success: true,
        qrCode: qrCode.base64 || qrCode.qrcode,
        message: "Instância criada. Escaneie o QR Code com seu WhatsApp",
      });
    }
  } catch (error: any) {
    console.error("Erro ao conectar WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao conectar" },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp/status - Desconectar WhatsApp
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getSalonByUserId(session.user.id);
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const whatsapp = getWhatsAppClient();
    await whatsapp.logout();

    return NextResponse.json({
      success: true,
      message: "WhatsApp desconectado com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao desconectar WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao desconectar" },
      { status: 500 }
    );
  }
}
