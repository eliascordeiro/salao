import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWhatsGWClient } from '@/lib/whatsapp/whatsgw-client'

/**
 * GET - Verificar status da conexão WhatsGW
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
    const status = await client.getStatus()

    return NextResponse.json({
      connected: status.connected,
      phone: status.phone,
    })
  } catch (error) {
    console.error('❌ Erro ao verificar status WhatsGW:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status' },
      { status: 500 }
    )
  }
}

/**
 * POST - Não necessário para WhatsGW (sempre conectado se configurado)
 */
export async function POST() {
  // WhatsGW não precisa de "iniciar sessão" - basta estar configurado
  return GET()
}
