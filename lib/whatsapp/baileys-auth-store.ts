/**
 * Baileys Auth State Store - PostgreSQL
 * Armazena credenciais e chaves de sessão no banco de dados
 */

import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap, initAuthCreds } from '@whiskeysockets/baileys'
import { PrismaClient } from '@prisma/client'
import { BufferJSON } from '@whiskeysockets/baileys'

const prisma = new PrismaClient()

export interface BaileysAuthState {
  state: AuthenticationState
  saveCreds: () => Promise<void>
}

/**
 * Cria um Auth State Handler que salva no PostgreSQL
 */
export async function usePrismaAuthState(salonId: string): Promise<BaileysAuthState> {
  // Buscar sessão existente
  let session = await prisma.whatsAppSession.findUnique({
    where: { salonId }
  })

  let creds: AuthenticationCreds
  let keys: any = {}

  if (session) {
    // Carregar credenciais existentes
    try {
      creds = JSON.parse(session.creds, BufferJSON.reviver)
      keys = JSON.parse(session.keys, BufferJSON.reviver)
      console.log(`✅ Auth carregado do banco (salonId: ${salonId})`)
    } catch (error) {
      console.error('❌ Erro ao parsear auth do banco, deletando sessão corrompida:', error)
      // Deletar sessão corrompida
      await prisma.whatsAppSession.delete({ where: { salonId } }).catch(() => {})
      // Criar novas credenciais
      creds = initAuthCreds()
      console.log(`🆕 Novas credenciais criadas após limpeza (salonId: ${salonId})`)
    }
  } else {
    // Criar novas credenciais
    creds = initAuthCreds()
    console.log(`🆕 Novas credenciais criadas (salonId: ${salonId})`)
  }

  /**
   * Salva credenciais no banco
   */
  const saveCreds = async () => {
    try {
      const credsJSON = JSON.stringify(creds, BufferJSON.replacer, 2)
      const keysJSON = JSON.stringify(keys, BufferJSON.replacer, 2)

      await prisma.whatsAppSession.upsert({
        where: { salonId },
        create: {
          salonId,
          creds: credsJSON,
          keys: keysJSON,
          connected: false
        },
        update: {
          creds: credsJSON,
          keys: keysJSON,
          updatedAt: new Date()
        }
      })
      console.log(`💾 Auth salvo no banco (salonId: ${salonId})`)
    } catch (error) {
      console.error('❌ Erro ao salvar auth no banco:', error)
    }
  }

  return {
    state: {
      creds,
      keys: {
        get: async (type: string, ids: string[]) => {
          const data: any = {}
          for (const id of ids) {
            const key = `${type}.${id}`
            if (keys[key]) {
              data[id] = keys[key]
            }
          }
          return data
        },
        set: async (data: any) => {
          for (const category in data) {
            for (const id in data[category]) {
              const key = `${category}.${id}`
              const value = data[category][id]
              if (value) {
                keys[key] = value
              } else {
                delete keys[key]
              }
            }
          }
          await saveCreds()
        }
      }
    },
    saveCreds
  }
}

/**
 * Remove sessão do banco
 */
export async function clearAuthState(salonId: string) {
  try {
    await prisma.whatsAppSession.delete({
      where: { salonId }
    })
    console.log(`🗑️ Auth removido (salonId: ${salonId})`)
  } catch (error) {
    console.error('❌ Erro ao remover auth:', error)
  }
}

/**
 * Atualiza status de conexão
 */
export async function updateConnectionStatus(salonId: string, connected: boolean, phone?: string) {
  try {
    await prisma.whatsAppSession.upsert({
      where: { salonId },
      create: {
        salonId,
        creds: '{}',
        keys: '{}',
        connected,
        phone,
        lastConnected: connected ? new Date() : undefined
      },
      update: {
        connected,
        phone,
        lastConnected: connected ? new Date() : undefined
      }
    })
    console.log(`🔄 Status atualizado (salonId: ${salonId}, connected: ${connected})`)
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
  }
}

/**
 * Salva QR Code no banco
 */
export async function saveQRCode(salonId: string, qrCode: string) {
  try {
    await prisma.whatsAppSession.upsert({
      where: { salonId },
      create: {
        salonId,
        creds: '{}',
        keys: '{}',
        qrCode,
        connected: false
      },
      update: { qrCode }
    })
    console.log(`📱 QR Code salvo (salonId: ${salonId})`)
  } catch (error) {
    console.error('❌ Erro ao salvar QR Code:', error)
  }
}

/**
 * Obtém QR Code do banco
 */
export async function getQRCode(salonId: string): Promise<string | null> {
  try {
    const session = await prisma.whatsAppSession.findUnique({
      where: { salonId },
      select: { qrCode: true }
    })
    return session?.qrCode || null
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error)
    return null
  }
}

/**
 * Verifica se há sessão ativa
 */
export async function hasActiveSession(salonId: string): Promise<boolean> {
  try {
    const session = await prisma.whatsAppSession.findUnique({
      where: { salonId },
      select: { connected: true }
    })
    return session?.connected || false
  } catch (error) {
    console.error('❌ Erro ao verificar sessão:', error)
    return false
  }
}
