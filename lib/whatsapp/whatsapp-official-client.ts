/**
 * Adapter WhatsGW → WhatsApp Official Client Interface
 * 
 * Este arquivo mantém a interface do whatsapp-official-client.ts
 * mas usa WhatsGW como backend real (sem necessidade de templates aprovados).
 * 
 * Motivo: Sistema de notificações já usa sendWhatsAppMessage() e isWhatsAppConfigured()
 * Solução: Adapter pattern para manter compatibilidade
 */

import { WhatsGWClient, type WhatsGWConfig } from './whatsgw-client';

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

/**
 * Singleton WhatsGW Client
 */
let whatsGWInstance: WhatsGWClient | null = null;

function getWhatsGWClient(): WhatsGWClient | null {
  if (whatsGWInstance) return whatsGWInstance;

  const apiKey = process.env.WHATSGW_API_KEY;
  const phoneNumber = process.env.WHATSGW_PHONE_NUMBER;
  const baseUrl = process.env.WHATSGW_URL || 'https://app.whatsgw.com.br';

  if (!apiKey || !phoneNumber) {
    console.warn('⚠️ WhatsGW não configurado. Configure WHATSGW_API_KEY e WHATSGW_PHONE_NUMBER');
    return null;
  }

  const config: WhatsGWConfig = {
    baseUrl,
    apiKey,
    phoneNumber,
  };

  whatsGWInstance = new WhatsGWClient(config);
  return whatsGWInstance;
}

/**
 * Formata número para padrão WhatsApp (apenas dígitos com DDI)
 */
function formatPhoneNumber(phone: string): string {
  // Remove tudo que não é número
  const cleaned = phone.replace(/\D/g, '');
  
  // Se já tem DDI (55 do Brasil)
  if (cleaned.startsWith('55')) {
    return cleaned;
  }
  
  // Se tem 11 dígitos (DDD + número), adiciona DDI Brasil
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `55${cleaned}`;
  }
  
  return cleaned;
}

/**
 * Envia mensagem WhatsApp via WhatsGW
 * Compatível com a interface original do whatsapp-official-client
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<MessageResponse> {
  const client = getWhatsGWClient();
  
  if (!client) {
    return {
      success: false,
      error: 'WhatsGW não configurado. Configure WHATSGW_API_KEY e WHATSGW_PHONE_NUMBER'
    };
  }

  try {
    const formattedPhone = formatPhoneNumber(to);
    console.log(`📱 [WhatsGW] Enviando mensagem para ${formattedPhone}`);

    const result = await client.sendMessage({
      phone: formattedPhone,
      message,
    });

    if (result.success && result.messageId) {
      console.log(`✅ [WhatsGW] Mensagem enviada (ID: ${result.messageId})`);
      return {
        success: true,
        messageId: result.messageId.toString(),
      };
    } else {
      console.error(`❌ [WhatsGW] Falha: ${result.error}`);
      return {
        success: false,
        error: result.error || 'Erro desconhecido ao enviar mensagem',
      };
    }
  } catch (error: any) {
    console.error('❌ [WhatsGW] Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido'
    };
  }
}

/**
 * Verifica se WhatsGW está configurado
 * Compatível com a interface original
 */
export function isWhatsAppConfigured(): boolean {
  const apiKey = process.env.WHATSGW_API_KEY;
  const phoneNumber = process.env.WHATSGW_PHONE_NUMBER;
  return !!(apiKey && phoneNumber);
}

/**
 * Verifica status da conexão WhatsGW
 */
export async function getWhatsAppStatus(): Promise<{ connected: boolean; phone: string }> {
  const client = getWhatsGWClient();
  
  if (!client) {
    return {
      connected: false,
      phone: 'Não configurado'
    };
  }

  try {
    return await client.getStatus();
  } catch (error) {
    console.error('❌ [WhatsGW] Erro ao verificar status:', error);
    return {
      connected: false,
      phone: 'Erro ao verificar'
    };
  }
}
