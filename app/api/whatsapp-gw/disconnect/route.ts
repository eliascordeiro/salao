import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createWhatsGWClient } from '@/lib/whatsapp/whatsgw-client'

/**
 * POST - Desconectar WhatsGW (logout)
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
    const result = await client.logout()

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Desconectado com sucesso' : 'Erro ao desconectar',
    })
  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsGW:', error)
    return NextResponse.json(
      { error: 'Erro ao desconectar' },
      { status: 500 }
    )
  }
}
