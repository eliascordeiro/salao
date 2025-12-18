import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    console.log("🔄 [POST /api/whatsapp/status] Iniciando conexão WhatsApp...");
    
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("❌ Sessão não encontrada");
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    console.log("✅ Sessão OK:", session.user.email);

    const salon = await getSalonByUserId(session.user.id);
    if (!salon) {
      console.log("❌ Salão não encontrado");
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }
    console.log("✅ Salão encontrado:", salon.name);

    // Verificar feature
    const hasWhatsApp = await hasFeature(salon.id, FEATURES.WHATSAPP_NOTIFICATIONS);
    if (!hasWhatsApp) {
      console.log("❌ Feature WhatsApp não disponível no plano");
      return NextResponse.json(
        { error: "Feature WhatsApp não disponível no seu plano" },
        { status: 403 }
      );
    }
    console.log("✅ Feature WhatsApp disponível");

    console.log("🔑 Criando cliente WhatsApp...");
    console.log("  - URL:", process.env.EVOLUTION_API_URL);
    console.log("  - Instance:", process.env.EVOLUTION_INSTANCE_NAME);
    console.log("  - Key presente:", !!process.env.EVOLUTION_API_KEY);
    
    const whatsapp = getWhatsAppClient();

    try {
      console.log("📱 Tentando obter QR Code existente...");
      const qrCode = await whatsapp.getQRCode();
      console.log("✅ QR Code obtido com sucesso");
      console.log("  - Tipo:", typeof qrCode);
      console.log("  - Keys:", Object.keys(qrCode));
      
      return NextResponse.json({
        success: true,
        qrCode: qrCode.base64 || qrCode.qrcode || qrCode.code,
        message: "Escaneie o QR Code com seu WhatsApp",
      });
    } catch (error: any) {
      console.log("⚠️ Erro ao obter QR Code, tentando criar instância...");
      console.log("  - Erro:", error.message);
      
      try {
        console.log("🆕 Criando nova instância...");
        const createResult = await whatsapp.createInstance();
        console.log("✅ Instância criada:", JSON.stringify(createResult, null, 2));
        
        console.log("📱 Obtendo QR Code da nova instância...");
        const qrCode = await whatsapp.getQRCode();
        console.log("✅ QR Code obtido:", typeof qrCode);
        console.log("  - Keys:", Object.keys(qrCode));
        
        return NextResponse.json({
          success: true,
          qrCode: qrCode.base64 || qrCode.qrcode || qrCode.code,
          message: "Instância criada. Escaneie o QR Code com seu WhatsApp",
        });
      } catch (createError: any) {
        console.error("❌ Erro ao criar instância:", createError);
        throw createError;
      }
    }
  } catch (error: any) {
    console.error("❌ Erro fatal ao conectar WhatsApp:", error);
    console.error("  - Message:", error.message);
    console.error("  - Stack:", error.stack);
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
