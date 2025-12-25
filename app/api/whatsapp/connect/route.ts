/**
 * API: Conectar WhatsApp e gerar QR Code
 * POST /api/whatsapp/connect
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectWhatsApp, isWhatsAppConnected } from '@/lib/whatsapp/baileys-client'
import { getSalonByOwnerId } from '@/lib/salon-helper'
import { getQRCode } from '@/lib/whatsapp/baileys-auth-store'

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

    // Verificar se já está conectado
    if (isWhatsAppConnected(salonId)) {
      console.log(`♻️ WhatsApp já conectado (salonId: ${salonId})`)
      
      // Tentar obter QR do banco (caso esteja reconectando)
      const qrCode = await getQRCode(salonId)
      
      return NextResponse.json({
        success: true,
        connected: true,
        qrCode: qrCode || null,
        message: 'WhatsApp já está conectado'
      })
    }

    console.log(`🔌 Iniciando conexão WhatsApp (salonId: ${salonId})...`)

    // Armazenar QR Code gerado
    let generatedQRCode: string | null = null

    // Conectar ao WhatsApp
    await connectWhatsApp({
      salonId,
      onQRCode: (qr) => {
        console.log(`📱 QR Code recebido via callback (salonId: ${salonId})`)
        generatedQRCode = qr
      },
      onConnected: (phone) => {
        console.log(`✅ WhatsApp conectado via callback (phone: ${phone})`)
      },
      onDisconnected: () => {
        console.log(`❌ WhatsApp desconectado via callback`)
      }
    })

    // Aguardar um pouco para o QR Code ser gerado
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Se não gerou via callback, tentar obter do banco
    if (!generatedQRCode) {
      generatedQRCode = await getQRCode(salonId)
    }

    if (generatedQRCode) {
      console.log(`✅ QR Code disponível (salonId: ${salonId})`)
      return NextResponse.json({
        success: true,
        connected: false,
        qrCode: generatedQRCode,
        message: 'QR Code gerado. Escaneie com seu WhatsApp.'
      })
    } else {
      console.log(`⏳ QR Code ainda não gerado (salonId: ${salonId})`)
      return NextResponse.json({
        success: true,
        connected: false,
        qrCode: null,
        message: 'Conexão iniciada. QR Code será gerado em instantes...'
      }, { status: 202 }) // 202 Accepted
    }

  } catch (error) {
    console.error('❌ Erro ao conectar WhatsApp:', error)
    return NextResponse.json({
      error: 'Erro ao conectar WhatsApp',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

/**
 * GET: Obter QR Code atual
 */
export async function GET(req: NextRequest) {
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
    const connected = isWhatsAppConnected(salonId)

    // Obter QR Code do banco
    const qrCode = await getQRCode(salonId)

    return NextResponse.json({
      success: true,
      connected,
      qrCode: qrCode || null,
      message: connected ? 'WhatsApp conectado' : (qrCode ? 'QR Code disponível' : 'Aguardando conexão')
    })

  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error)
    return NextResponse.json({
      error: 'Erro ao obter QR Code',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
