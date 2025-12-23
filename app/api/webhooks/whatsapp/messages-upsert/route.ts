import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para eventos de mensagens da Evolution API
 * Evento: messages.upsert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('💬 [Webhook] Messages Upsert:', body.instance);
    
    // Processar mensagens recebidas
    if (body.data?.messages) {
      console.log(`📩 ${body.data.messages.length} mensagem(ns) recebida(s)`);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Messages processadas'
    });

  } catch (error) {
    console.error('❌ Erro no webhook messages-upsert:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    webhook: 'messages-upsert',
    timestamp: new Date().toISOString()
  });
}
