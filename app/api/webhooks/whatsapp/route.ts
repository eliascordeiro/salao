import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para WhatsApp Business API Oficial
 * 
 * Recebe eventos de:
 * - Mensagens recebidas (clientes enviando mensagens)
 * - Status de mensagens (sent, delivered, read, failed)
 * - Erros de entrega
 * 
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/components
 */

const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'salon-booking-verify-token';

/**
 * GET: Verificação do webhook (Meta vai chamar isso para validar)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  console.log('🔍 [WhatsApp Webhook] Verificação recebida:', { mode, token, challenge });

  // Verificar se token está correto
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ [WhatsApp Webhook] Token verificado com sucesso!');
    
    // Meta espera o challenge de volta
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('❌ [WhatsApp Webhook] Token inválido ou modo incorreto');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

/**
 * POST: Recebe eventos do WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📩 [WhatsApp Webhook] Evento recebido:', JSON.stringify(body, null, 2));

    // Estrutura do webhook: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      console.log('⚠️  [WhatsApp Webhook] Evento sem dados relevantes');
      return NextResponse.json({ status: 'ok' });
    }

    // Processar mensagens recebidas
    if (value.messages) {
      await processIncomingMessages(value.messages, value.metadata);
    }

    // Processar status de mensagens enviadas
    if (value.statuses) {
      await processMessageStatuses(value.statuses);
    }

    // Meta espera resposta 200 OK rápida
    return NextResponse.json({ status: 'received' }, { status: 200 });

  } catch (error: any) {
    console.error('❌ [WhatsApp Webhook] Erro ao processar:', error);
    
    // Mesmo com erro, retornar 200 para não reenviar
    return NextResponse.json({ status: 'error', message: error.message }, { status: 200 });
  }
}

/**
 * Processa mensagens recebidas de clientes
 */
async function processIncomingMessages(messages: any[], metadata: any) {
  for (const message of messages) {
    console.log('📨 Mensagem recebida:', {
      from: message.from,
      type: message.type,
      timestamp: message.timestamp,
      id: message.id
    });

    // Aqui você pode:
    // 1. Salvar no banco (histórico de conversas)
    // 2. Processar comandos automáticos
    // 3. Notificar admin
    // 4. Responder automaticamente

    if (message.type === 'text') {
      console.log('💬 Texto:', message.text?.body);
      
      // Exemplo: Responder mensagens automáticas
      // await handleAutoReply(message.from, message.text?.body);
    }
  }
}

/**
 * Processa status de mensagens enviadas
 */
async function processMessageStatuses(statuses: any[]) {
  for (const status of statuses) {
    console.log('📊 Status da mensagem:', {
      id: status.id,
      status: status.status, // sent, delivered, read, failed
      timestamp: status.timestamp,
      recipient: status.recipient_id
    });

    // Status possíveis:
    // - sent: Mensagem enviada para WhatsApp
    // - delivered: Entregue ao destinatário
    // - read: Lida pelo destinatário
    // - failed: Falha na entrega

    switch (status.status) {
      case 'delivered':
        console.log('✅ Mensagem entregue ao destinatário');
        // Atualizar banco de dados: status = DELIVERED
        break;
        
      case 'read':
        console.log('👀 Mensagem lida pelo destinatário');
        // Atualizar banco de dados: status = READ
        break;
        
      case 'failed':
        console.error('❌ Falha na entrega:', status.errors);
        // Atualizar banco de dados: status = FAILED
        // Tentar reenviar por email como fallback
        break;
    }

    // Aqui você pode salvar no banco:
    // await prisma.whatsAppMessageStatus.create({
    //   data: {
    //     messageId: status.id,
    //     status: status.status,
    //     timestamp: new Date(parseInt(status.timestamp) * 1000),
    //     recipientId: status.recipient_id
    //   }
    // });
  }
}

/**
 * Exemplo de resposta automática (opcional)
 */
async function handleAutoReply(from: string, messageText: string) {
  // Implementar lógica de resposta automática
  // Exemplo: "Olá! Para agendar, acesse nosso site: https://salon-booking.com.br"
  
  // const { sendWhatsAppMessage } = await import('@/lib/whatsapp/whatsapp-official-client');
  // await sendWhatsAppMessage(from, 'Olá! Como posso ajudar?');
}
