import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para eventos de atualização de conexão da Evolution API
 * Evento: connection.update
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔌 [Webhook] Connection Update:', JSON.stringify(body, null, 2));

    // Verificar se conectou com sucesso
    if (body.data?.state === 'open') {
      console.log('✅ WhatsApp conectado com sucesso!');
      console.log('📱 Número:', body.data?.phoneNumber);
    } else if (body.data?.state === 'close') {
      console.log('❌ WhatsApp desconectado');
    } else if (body.data?.state === 'connecting') {
      console.log('⏳ WhatsApp conectando...');
    }

    return NextResponse.json({ 
      success: true,
      message: 'Connection update processado',
      state: body.data?.state 
    });

  } catch (error) {
    console.error('❌ Erro no webhook connection-update:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    webhook: 'connection-update',
    timestamp: new Date().toISOString()
  });
}
