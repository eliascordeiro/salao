import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWhatsGWClient } from '@/lib/whatsapp/whatsgw-client'

/**
 * POST - Enviar mensagem via WhatsGW
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json(
        { error: 'Telefone e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.WHATSGW_URL || 'https://app.whatsgw.com.br'
    const apiKey = process.env.WHATSGW_API_KEY
    const phoneNumber = process.env.WHATSGW_PHONE_NUMBER

    if (!apiKey || !phoneNumber) {
      return NextResponse.json({
        error: 'Configuração incompleta',
        details: 'Configure WHATSGW_API_KEY e WHATSGW_PHONE_NUMBER no .env',
      }, { status: 400 })
    }

    const client = createWhatsGWClient({ baseUrl, apiKey, phoneNumber })
    
    // Enviar mensagem (WhatsGW não precisa verificar conexão prévia)
    const result = await client.sendMessage({ phone, message })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar mensagem' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      phoneState: result.phoneState,
      message: 'Mensagem enviada com sucesso',
    })
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsGW:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    )
  }
}
