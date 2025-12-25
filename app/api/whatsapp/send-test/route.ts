/**
 * API: Enviar mensagem de teste
 * POST /api/whatsapp/send-test
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendWhatsAppMessage, isWhatsAppConnected } from '@/lib/whatsapp/baileys-client'
import { getSalonByOwnerId } from '@/lib/salon-helper'

export async function POST(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Obter salão do usuário
    const salon = await getSalonByOwnerId(session.user.id)
    if (!salon) {
      return NextResponse.json({ error: 'Salão não encontrado' }, { status: 404 })
    }

    const salonId = salon.id

    // Verificar se está conectado
    if (!isWhatsAppConnected(salonId)) {
      return NextResponse.json({
        error: 'WhatsApp não está conectado'
      }, { status: 400 })
    }

    // Obter dados do body
    const body = await req.json()
    const { phone, message } = body

    if (!phone || !message) {
      return NextResponse.json({
        error: 'Telefone e mensagem são obrigatórios'
      }, { status: 400 })
    }

    console.log(`📤 Enviando mensagem teste (salonId: ${salonId}, phone: ${phone})...`)

    // Enviar mensagem
    const success = await sendWhatsAppMessage(salonId, phone, message)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Mensagem enviada com sucesso'
      })
    } else {
      return NextResponse.json({
        error: 'Falha ao enviar mensagem'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error)
    return NextResponse.json({
      error: 'Erro ao enviar mensagem',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
