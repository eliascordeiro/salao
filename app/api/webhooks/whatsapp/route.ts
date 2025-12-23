import { NextRequest, NextResponse } from "next/server";

/**
 * Webhook para receber eventos da Evolution API
 * Eventos possíveis:
 * - QRCODE_UPDATED: Quando um novo QR Code é gerado
 * - CONNECTION_UPDATE: Quando o status da conexão muda
 * - STATUS_INSTANCE: Quando o status da instância muda
 * - MESSAGES_UPSERT: Quando uma nova mensagem é recebida
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    console.log("📩 [Webhook WhatsApp] Evento recebido:");
    console.log(JSON.stringify(body, null, 2));
    
    const { event, instance, data } = body;
    
    // Processar evento de QR Code
    if (event === "QRCODE_UPDATED" || event === "qrcode.updated") {
      console.log("📱 QR Code atualizado:");
      console.log("  - Instance:", instance);
      console.log("  - QR Code data:", data);
      
      // Aqui você pode salvar o QR Code no banco de dados
      // ou enviar para algum serviço de armazenamento
      // Para debug, vamos apenas logar
      if (data?.qrcode) {
        console.log("✅ QR Code recebido via webhook!");
        // TODO: Salvar no banco ou cache para exibir no frontend
      }
    }
    
    // Processar evento de conexão
    if (event === "CONNECTION_UPDATE" || event === "connection.update") {
      console.log("🔌 Status de conexão atualizado:");
      console.log("  - Instance:", instance);
      console.log("  - Connection data:", data);
      
      // Verificar se conectou com sucesso
      if (data?.state === "open") {
        console.log("✅ WhatsApp conectado com sucesso!");
        // TODO: Atualizar status no banco
      }
    }
    
    // Processar mensagens recebidas
    if (event === "MESSAGES_UPSERT" || event === "messages.upsert") {
      console.log("💬 Nova mensagem recebida:");
      console.log("  - Instance:", instance);
      console.log("  - Message data:", data);
      
      // TODO: Processar mensagem (resposta automática, salvar no banco, etc)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Webhook processado com sucesso" 
    });
  } catch (error) {
    console.error("❌ [Webhook WhatsApp] Erro:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      },
      { status: 500 }
    );
  }
}

// Permitir GET para teste
export async function GET() {
  return NextResponse.json({ 
    message: "Webhook WhatsApp ativo",
    timestamp: new Date().toISOString()
  });
}
