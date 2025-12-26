/**
 * WhatsGW Client - HTTP API para WhatsApp
 * Documentação oficial: https://github.com/whatsgw/whatsgw
 * API: https://app.whatsgw.com.br/api/WhatsGw/Send
 * Método: POST application/json (testado e validado com notificações push)
 */

export interface WhatsGWConfig {
  baseUrl: string      // URL base (ex: https://app.whatsgw.com.br)
  apiKey: string       // API Key do WhatsGW
  phoneNumber: string  // Seu número WhatsApp (ex: 5541996123839)
}

export interface SendMessageParams {
  phone: string   // Número destinatário com DDI (ex: 5541999999999)
  message: string // Texto da mensagem
}

export interface WhatsGWResponse {
  result: 'success' | 'error'
  message_id?: number
  contact_phone_number?: string
  phone_state?: string // "Conectado" | "Desconectado"
  error?: string
}

export interface SendMessageResult {
  success: boolean
  messageId?: number
  phoneState?: string
  error?: string
}

export class WhatsGWClient {
  private config: WhatsGWConfig

  constructor(config: WhatsGWConfig) {
    this.config = config
  }

  /**
   * Verificar status do número WhatsApp
   * Retorna se está configurado corretamente (sem enviar mensagem de teste)
   */
  async getStatus(): Promise<{ connected: boolean; phone: string }> {
    try {
      // Verificar apenas se as credenciais estão configuradas
      // NÃO envia mensagem de teste para evitar spam
      const isConfigured = !!(
        this.config.apiKey && 
        this.config.phoneNumber && 
        this.config.baseUrl
      )

      return {
        connected: isConfigured,
        phone: this.config.phoneNumber,
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status WhatsGW:', error)
      return { 
        connected: false,
        phone: this.config.phoneNumber
      }
    }
  }

  /**
   * Enviar mensagem de texto
   * Método: POST application/json (igual ao Python que funciona)
   */
  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    try {
      // Garantir que número está no formato correto (apenas dígitos)
      const phone = params.phone.replace(/\D/g, '')
      
      // Gerar ID único para a mensagem
      const messageCustomId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`

      // Montar payload JSON (mesmo formato do Python que funciona)
      const payload = {
        apikey: this.config.apiKey,
        phone_number: this.config.phoneNumber,
        contact_phone_number: phone,
        message_custom_id: messageCustomId,
        message_type: 'text',
        message_body: params.message,
      }

      console.log('📤 Sending WhatsGW message:', {
        phone,
        messageLength: params.message.length,
        messageId: messageCustomId,
      })

      // POST com application/json (igual ao Python que funciona com notificação)
      const response = await fetch(`${this.config.baseUrl}/api/WhatsGw/Send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data: WhatsGWResponse = await response.json()

      console.log('📥 WhatsGW response:', data)

      return {
        success: data.result === 'success',
        messageId: data.message_id,
        phoneState: data.phone_state,
        error: data.result === 'error' ? (data.error || 'Erro ao enviar mensagem') : undefined,
      }
    } catch (error) {
      console.error('❌ WhatsGW error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Enviar documento (PDF, imagem, etc)
   * Requer base64 do arquivo
   */
  async sendDocument(params: {
    phone: string
    filename: string
    mimetype: string
    caption?: string
    base64Data: string
  }): Promise<SendMessageResult> {
    try {
      const phone = params.phone.replace(/\D/g, '')
      const messageCustomId = `doc-${Date.now()}`

      const formData = new URLSearchParams({
        apikey: this.config.apiKey,
        phone_number: this.config.phoneNumber,
        contact_phone_number: phone,
        message_custom_id: messageCustomId,
        message_type: 'document',
        message_body_filename: params.filename,
        message_body_mimetype: params.mimetype,
        message_caption: params.caption || '',
        message_body: params.base64Data,
      })

      const response = await fetch(`${this.config.baseUrl}/api/WhatsGw/Send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      const data: WhatsGWResponse = await response.json()

      return {
        success: data.result === 'success',
        messageId: data.message_id,
        phoneState: data.phone_state,
        error: data.result === 'error' ? (data.error || 'Erro ao enviar documento') : undefined,
      }
    } catch (error) {
      console.error('❌ WhatsGW document error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Verificar se está conectado
   */
  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }
}

/**
 * Factory function para criar cliente WhatsGW
 */
export function createWhatsGWClient(config: WhatsGWConfig): WhatsGWClient {
  return new WhatsGWClient(config)
}
