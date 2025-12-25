/**
 * API: Desconectar WhatsApp
 * DELETE /api/whatsapp/disconnect
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { disconnectWhatsApp } from '@/lib/whatsapp/baileys-client'
import { getSalonByOwnerId } from '@/lib/salon-helper'

export async function DELETE(req: NextRequest) {
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

    console.log(`🔌 Desconectando WhatsApp (salonId: ${salonId})...`)

    // Desconectar
    await disconnectWhatsApp(salonId)

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro ao desconectar WhatsApp:', error)
    return NextResponse.json({
      error: 'Erro ao desconectar WhatsApp',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
