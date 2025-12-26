/**
 * API: Server-Sent Events (SSE) para QR Code em tempo real
 * GET /api/whatsapp/qrcode-stream
 */

import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSalonByOwnerId } from '@/lib/salon-helper'
import { getQRCode } from '@/lib/whatsapp/baileys-auth-store'
import { isWhatsAppConnected } from '@/lib/whatsapp/baileys-client'

export async function GET(req: NextRequest) {
  try {
    // Autenticação
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new Response('Não autenticado', { status: 401 })
    }

    // Obter salão do usuário
    const salon = await getSalonByOwnerId(session.user.id)
    if (!salon) {
      return new Response('Salão não encontrado', { status: 404 })
    }

    const salonId = salon.id

    // Configurar SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        console.log(`📡 SSE iniciado (salonId: ${salonId})`)
        let isClosed = false

        // Função para enviar dados (com verificação)
        const sendEvent = (event: string, data: any) => {
          if (isClosed) return
          try {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
            controller.enqueue(encoder.encode(message))
          } catch (error) {
            // Controller já fechado, ignorar
            isClosed = true
          }
        }

        // Polling a cada 2 segundos
        const interval = setInterval(async () => {
          try {
            // Verificar se está conectado
            const connected = isWhatsAppConnected(salonId)

            if (connected) {
              // Já conectado, enviar status e encerrar
              sendEvent('connected', { 
                connected: true,
                message: 'WhatsApp conectado com sucesso'
              })
              
              clearInterval(interval)
              controller.close()
              return
            }

            // Obter QR Code do banco
            const qrCode = await getQRCode(salonId)

            if (qrCode) {
              // QR Code disponível
              sendEvent('qrcode', { 
                qrCode,
                connected: false,
                message: 'Escaneie o QR Code com seu WhatsApp'
              })
            } else {
              // Aguardando QR Code
              sendEvent('waiting', { 
                connected: false,
                message: 'Aguardando geração do QR Code...'
              })
            }

          } catch (error) {
            console.error('❌ Erro no SSE:', error)
            sendEvent('error', { 
              error: 'Erro ao obter status',
              details: error instanceof Error ? error.message : String(error)
            })
          }
        }, 2000) // A cada 2 segundos

        // Cleanup quando conexão fechar
        req.signal.addEventListener('abort', () => {
          console.log(`📡 SSE encerrado (salonId: ${salonId})`)
          clearInterval(interval)
          isClosed = true
          controller.close()
        })

        // Timeout de 5 minutos
        setTimeout(() => {
          if (isClosed) return
          console.log(`⏱️ SSE timeout (salonId: ${salonId})`)
          clearInterval(interval)
          sendEvent('timeout', { 
            message: 'Tempo limite excedido. Tente novamente.'
          })
          isClosed = true
          controller.close()
        }, 5 * 60 * 1000)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })

  } catch (error) {
    console.error('❌ Erro ao iniciar SSE:', error)
    return new Response('Erro ao iniciar stream', { status: 500 })
  }
}
