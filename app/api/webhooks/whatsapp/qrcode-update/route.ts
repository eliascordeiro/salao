import { NextRequest, NextResponse } from 'next/server';

/**
 * Webhook para eventos de QR Code da Evolution API
 * Evento: qrcode.updated
 * 
 * Este endpoint recebe o QR Code em base64 quando a Evolution API o gera
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📱 [Webhook] QR Code Update recebido!');
    console.log('Instance:', body.instance);
    console.log('Event:', body.event);
    
    // Verificar se há QR Code no payload
    if (body.data?.qrcode) {
      console.log('✅ QR Code recebido via webhook!');
      console.log('🔗 QR Code (primeiros 100 chars):', body.data.qrcode.substring(0, 100) + '...');
      
      // TODO: Aqui você pode salvar o QR Code em cache/Redis para exibir no frontend
      // Por enquanto, apenas logamos para debug
      
      // Exemplo de como poderia salvar:
      // await redis.set(`qrcode:${body.instance}`, body.data.qrcode, 'EX', 60);
    }

    return NextResponse.json({ 
      success: true,
      message: 'QR Code recebido com sucesso',
      hasQrCode: !!body.data?.qrcode
    });

  } catch (error) {
    console.error('❌ Erro no webhook qrcode-update:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    webhook: 'qrcode-update',
    timestamp: new Date().toISOString()
  });
}
