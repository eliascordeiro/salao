/**
 * Baileys WhatsApp Client - Native Implementation
 * Cliente WhatsApp nativo usando Baileys (sem Evolution API)
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  isJidUser,
  delay,
  BaileysEventMap,
  ConnectionState
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import QRCode from 'qrcode'
import { usePrismaAuthState, updateConnectionStatus, saveQRCode, clearAuthState } from './baileys-auth-store'

// Armazena instâncias ativas (salonId → socket)
const activeSockets = new Map<string, WASocket>()

// Callbacks de QR Code (salonId → callback)
const qrCallbacks = new Map<string, (qr: string) => void>()

// Logger do Baileys (silencioso em produção)
const logger = pino({ 
  level: process.env.NODE_ENV === 'production' ? 'silent' : 'info' 
})

/**
 * Interface de configuração
 */
export interface BaileysConfig {
  salonId: string
  onQRCode?: (qr: string) => void
  onConnected?: (phone: string) => void
  onDisconnected?: () => void
}

/**
 * Conecta ao WhatsApp e retorna o socket
 */
export async function connectWhatsApp(config: BaileysConfig): Promise<WASocket> {
  const { salonId, onQRCode, onConnected, onDisconnected } = config

  // Se já existe instância ativa, retornar
  if (activeSockets.has(salonId)) {
    console.log(`♻️ Reutilizando socket existente (salonId: ${salonId})`)
    return activeSockets.get(salonId)!
  }

  console.log(`🔌 Conectando WhatsApp (salonId: ${salonId})...`)

  // Carregar auth do banco
  const { state, saveCreds } = await usePrismaAuthState(salonId)

  // Criar socket
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false, // Não printar QR no console
    browser: ['Salon Booking', 'Chrome', '124.0.0'],
    defaultQueryTimeoutMs: undefined,
    markOnlineOnConnect: true
  })

  // Registrar callback de QR
  if (onQRCode) {
    qrCallbacks.set(salonId, onQRCode)
  }

  // Evento: atualização de credenciais
  sock.ev.on('creds.update', saveCreds)

  // Evento: atualização de conexão
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    console.log(`🔄 Connection update (salonId: ${salonId}):`, {
      connection,
      qr: qr ? 'QR_GERADO' : 'SEM_QR'
    })

    // QR Code gerado
    if (qr) {
      console.log(`📱 QR Code gerado (salonId: ${salonId})`)
      
      // Converter para base64
      const qrBase64 = await QRCode.toDataURL(qr)
      
      // Salvar no banco
      await saveQRCode(salonId, qrBase64)
      
      // Chamar callback
      const callback = qrCallbacks.get(salonId)
      if (callback) {
        callback(qrBase64)
      }
    }

    // Conectado
    if (connection === 'open') {
      console.log(`✅ WhatsApp conectado (salonId: ${salonId})`)
      
      // Obter número de telefone
      const phone = sock.user?.id.split(':')[0] || 'UNKNOWN'
      
      // Atualizar status no banco
      await updateConnectionStatus(salonId, true, phone)
      
      // Chamar callback
      if (onConnected) {
        onConnected(phone)
      }
    }

    // Desconectado
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      
      console.log(`❌ WhatsApp desconectado (salonId: ${salonId})`, {
        shouldReconnect,
        statusCode: (lastDisconnect?.error as Boom)?.output?.statusCode
      })

      // Atualizar status no banco
      await updateConnectionStatus(salonId, false)
      
      // Remover socket da lista
      activeSockets.delete(salonId)
      qrCallbacks.delete(salonId)
      
      // Chamar callback
      if (onDisconnected) {
        onDisconnected()
      }

      // Se foi logout, limpar auth
      if (!shouldReconnect) {
        console.log(`🗑️ Logout detectado, limpando auth (salonId: ${salonId})`)
        await clearAuthState(salonId)
      }
    }
  })

  // Evento: mensagens recebidas
  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message) continue
      
      console.log(`📨 Mensagem recebida (salonId: ${salonId}):`, {
        from: msg.key.remoteJid,
        text: msg.message.conversation || msg.message.extendedTextMessage?.text
      })
      
      // Aqui você pode processar mensagens recebidas
      // Ex: responder automaticamente, salvar no banco, etc
    }
  })

  // Armazenar socket
  activeSockets.set(salonId, sock)

  return sock
}

/**
 * Desconecta do WhatsApp
 */
export async function disconnectWhatsApp(salonId: string) {
  const sock = activeSockets.get(salonId)
  
  if (!sock) {
    console.log(`⚠️ Nenhum socket ativo para desconectar (salonId: ${salonId})`)
    return
  }

  console.log(`🔌 Desconectando WhatsApp (salonId: ${salonId})...`)
  
  // Fazer logout
  await sock.logout()
  
  // Remover da lista
  activeSockets.delete(salonId)
  qrCallbacks.delete(salonId)
  
  // Limpar auth do banco
  await clearAuthState(salonId)
}

/**
 * Envia mensagem de texto
 */
export async function sendWhatsAppMessage(
  salonId: string,
  phoneNumber: string,
  message: string
): Promise<boolean> {
  const sock = activeSockets.get(salonId)
  
  if (!sock) {
    console.error(`❌ Nenhum socket ativo (salonId: ${salonId})`)
    return false
  }

  try {
    // Formatar número (adicionar @s.whatsapp.net)
    const jid = phoneNumber.includes('@') 
      ? phoneNumber 
      : `${phoneNumber.replace(/\D/g, '')}@s.whatsapp.net`

    console.log(`📤 Enviando mensagem (salonId: ${salonId}, to: ${jid})...`)

    await sock.sendMessage(jid, { text: message })
    
    console.log(`✅ Mensagem enviada com sucesso`)
    return true
  } catch (error) {
    console.error(`❌ Erro ao enviar mensagem:`, error)
    return false
  }
}

/**
 * Verifica se está conectado
 */
export function isWhatsAppConnected(salonId: string): boolean {
  return activeSockets.has(salonId)
}

/**
 * Obtém socket ativo
 */
export function getWhatsAppSocket(salonId: string): WASocket | null {
  return activeSockets.get(salonId) || null
}

/**
 * Lista todas as conexões ativas
 */
export function getActiveSalons(): string[] {
  return Array.from(activeSockets.keys())
}
