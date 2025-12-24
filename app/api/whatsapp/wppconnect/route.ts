import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  initializeWPPConnect, 
  getLastQRCode, 
  isWhatsAppConnected,
  disconnectWhatsApp 
} from "@/lib/whatsapp/wppconnect-client";
import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { getSalonByUserId } from "@/lib/salon-helper";

// GET /api/whatsapp/wppconnect - Verificar status e obter QR Code
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
    
    // Verificar se está conectado
    const connected = await isWhatsAppConnected();
    
    // Obter último QR Code gerado
    const qrCode = getLastQRCode();

    console.log('[GET WPPConnect] QR Code obtido:', {
      hasBase64: !!qrCode.base64,
      hasUrl: !!qrCode.url,
      base64Length: qrCode.base64?.length || 0,
      base64Preview: qrCode.base64?.substring(0, 50)
    });

    // Garantir formato correto do QR Code
    let qrCodeFormatted = null;
    if (qrCode.base64) {
      // Se já tem o prefixo data:image, usar direto
      if (qrCode.base64.startsWith('data:image')) {
        qrCodeFormatted = qrCode.base64;
      } else {
        // Se não tem, adicionar
        qrCodeFormatted = `data:image/png;base64,${qrCode.base64}`;
      }
    }

    return NextResponse.json({
      configured: true,
      connected,
      qrCode: qrCodeFormatted,
      qrCodeUrl: qrCode.url,
      hasAccess: hasWhatsApp,
      provider: 'wppconnect',
    });

  } catch (error) {
    console.error("Erro ao verificar status WPPConnect:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status do WhatsApp" },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/wppconnect - Inicializar cliente e gerar QR Code
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

    // Verificar se tem acesso à feature
    const hasWhatsApp = await hasFeature(salon.id, FEATURES.WHATSAPP_NOTIFICATIONS);
    console.log(`[WPPConnect POST] hasWhatsApp = ${hasWhatsApp}, NODE_ENV = ${process.env.NODE_ENV}`);
    
    if (!hasWhatsApp) {
      return NextResponse.json(
        {
          error: "Feature WhatsApp não disponível no seu plano",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    console.log('🚀 Inicializando WPPConnect...');
    
    // Inicializar cliente (vai gerar QR Code automaticamente)
    await initializeWPPConnect();
    
    // Aguardar um pouco para o QR Code ser gerado
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Obter QR Code
    const qrCode = getLastQRCode();

    console.log('[POST WPPConnect] QR Code após init:', {
      hasBase64: !!qrCode.base64,
      hasUrl: !!qrCode.url,
      base64Length: qrCode.base64?.length || 0
    });

    if (qrCode.base64) {
      // Garantir formato correto
      const qrCodeFormatted = qrCode.base64.startsWith('data:image') 
        ? qrCode.base64 
        : `data:image/png;base64,${qrCode.base64}`;
        
      return NextResponse.json({
        success: true,
        message: 'QR Code gerado! Escaneie com seu WhatsApp',
        qrCode: qrCodeFormatted,
        qrCodeUrl: qrCode.url,
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'WPPConnect inicializado. Aguardando QR Code...',
        qrCode: null,
      });
    }

  } catch (error) {
    console.error("Erro ao inicializar WPPConnect:", error);
    return NextResponse.json(
      { error: "Erro ao conectar WhatsApp" },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp/wppconnect - Desconectar WhatsApp
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    await disconnectWhatsApp();

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
    });

  } catch (error) {
    console.error("Erro ao desconectar WPPConnect:", error);
    return NextResponse.json(
      { error: "Erro ao desconectar WhatsApp" },
      { status: 500 }
    );
  }
}
