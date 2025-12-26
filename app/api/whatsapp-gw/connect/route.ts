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

    const baseUrl = process.env.WHATSGW_URL || 'http://localhost:3000'
    const token = process.env.WHATSGW_TOKEN

    const client = createWhatsGWClient({ baseUrl, token })
    const status = await client.getStatus()

    return NextResponse.json({
      connected: status.connected,
      phone: status.phone,
      qrCode: status.qrCode,
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
 * POST - Iniciar sessão WhatsGW (gera QR Code)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const baseUrl = process.env.WHATSGW_URL || 'http://localhost:3000'
    const token = process.env.WHATSGW_TOKEN

    const client = createWhatsGWClient({ baseUrl, token })
    const result = await client.startSession()

    return NextResponse.json({
      success: true,
      qrCode: result.qrCode,
      connected: result.connected,
      message: result.connected ? 'Já conectado' : 'QR Code gerado',
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar sessão WhatsGW:', error)
    return NextResponse.json(
      { error: 'Erro ao iniciar sessão' },
      { status: 500 }
    )
  }
}
