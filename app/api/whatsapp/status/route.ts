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
      
      // Evolution API retorna { pairingCode, code, base64, count }
      const qrCodeData = qrCode.base64 || qrCode.code || qrCode.qrcode;
      
      if (!qrCodeData) {
        console.log("⚠️ QR Code vazio, tentando criar instância...");
        throw new Error("QR Code não disponível");
      }
      
      return NextResponse.json({
        success: true,
        qrCode: qrCodeData,
        message: "Escaneie o QR Code com seu WhatsApp",
      });
    } catch (error: any) {
      console.log("⚠️ Erro ao obter QR Code:", error.message);
      
      // Se a instância não existe (INSTANCE_NOT_FOUND), criar nova
      if (error.message === "INSTANCE_NOT_FOUND" || error.message.includes("não encontrada")) {
        console.log("🆕 Criando nova instância (instância não existe)...");
        
        try {
          const createResult = await whatsapp.createInstance();
          console.log("✅ Instância criada:", JSON.stringify(createResult, null, 2));
          
          // Aguardar 3 segundos para instância inicializar
          console.log("⏳ Aguardando inicialização da instância...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          console.log("📱 Obtendo QR Code da nova instância...");
          const qrCode = await whatsapp.getQRCode();
          console.log("✅ QR Code obtido:", typeof qrCode);
          console.log("  - Keys:", Object.keys(qrCode));
          
          const qrCodeData = qrCode.base64 || qrCode.code || qrCode.qrcode;
          
          if (!qrCodeData) {
            console.error("❌ QR Code ainda vazio após criação");
            throw new Error("QR Code não foi gerado pela Evolution API");
          }
          
          return NextResponse.json({
            success: true,
            qrCode: qrCodeData,
            message: "Instância criada. Escaneie o QR Code com seu WhatsApp",
          });
        } catch (createError: any) {
          console.error("❌ Erro ao criar instância:", createError);
          console.error("  - Message:", createError.message);
          
          // Se erro de nome já existe, tentar obter QR Code novamente
          if (createError.message.includes("already in use")) {
            console.log("⚠️ Instância já existe (erro de criação), tentando reconectar...");
            
            // Aguardar 2 segundos e tentar novamente
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            try {
              const qrCode = await whatsapp.getQRCode();
              const qrCodeData = qrCode.base64 || qrCode.code || qrCode.qrcode;
              
              if (qrCodeData) {
                return NextResponse.json({
                  success: true,
                  qrCode: qrCodeData,
                  message: "Reconectando instância existente. Escaneie o QR Code.",
                });
              }
            } catch (retryError: any) {
              console.error("❌ Falha ao reconectar:", retryError.message);
            }
          }
          
          throw createError;
        }
      }
      
      // Outros erros, propagar
      throw error;
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
