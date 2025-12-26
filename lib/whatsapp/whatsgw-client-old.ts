/**
 * WhatsGW Client - HTTP API para WhatsApp
 * API: https://app.whatsgw.com.br/api/WhatsGw/Send
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
  phone_state?: string
  error?: string
}

export class WhatsGWClient {
  private config: WhatsGWConfig

  constructor(config: WhatsGWConfig) {
    this.config = config
  }

  /**
   * Constrói URL da API com parâmetros
   */
  private buildUrl(params: Record<string, string>): string {
    const url = new URL('/api/WhatsGw/Send', this.config.baseUrl)
    
    // Adicionar apikey e phone_number em todos requests
    url.searchParams.set('apikey', this.config.apiKey)
    url.searchParams.set('phone_number', this.config.phoneNumber)
    
    // Adicionar demais parâmetros
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    
    return url.toString()
  }

  /**
   * Verificar status do número WhatsApp
   */
  async getStatus(): Promise<{ connected: boolean; phone: string }> {
    try {
      // Fazer uma requisição de teste para verificar status
      const url = this.buildUrl({
        contact_phone_number: this.config.phoneNumber,
        message_custom_id: 'status_check',
        message_type: 'text',
        message_body: 'status', // Não será enviado, apenas verifica conexão
      })

      const response = await fetch(url)
      const data: WhatsGWResponse = await response.json()

      return {
        connected: data.phone_state === 'Conectado',
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
   */
  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Garantir que número está no formato correto
      let phone = params.phone.replace(/\D/g, '')
      
      // Adicionar @c.us se necessário (formato WhatsGW)
      if (!phone.includes('@')) {
        phone = `${phone}@c.us`
      }

      const response = await fetch(`${this.config.baseUrl}/message/text`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          sessionName: 'default',
          to: phone,
          text: params.message,
        }),
      })

  /**
   * Enviar mensagem de texto
   * URL: https://app.whatsgw.com.br/api/WhatsGw/Send
   */
  async sendMessage(params: SendMessageParams): Promise<{ success: boolean; messageId?: number; error?: string; phoneState?: string }> {
    try {
      // Garantir que número está no formato correto (apenas dígitos)
      const phone = params.phone.replace(/\D/g, '')
      
      // Construir URL com parâmetros
      const url = this.buildUrl({
        contact_phone_number: phone,
        message_custom_id: `msg_${Date.now()}`,
        message_type: 'text',
        message_body: params.message,
      })

      console.log('📤 Enviando mensagem WhatsGW:', { phone, preview: params.message.substring(0, 50) })

      const response = await fetch(url)
      const data: WhatsGWResponse = await response.json()

      console.log('📥 Resposta WhatsGW:', data)

      if (data.result === 'success') {
        return {
          success: true,
          messageId: data.message_id,
          phoneState: data.phone_state,
        }
      } else {
        return {
          success: false,
          error: data.error || 'Erro ao enviar mensagem',
        }
      }
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem WhatsGW:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      }
    }
  }

  /**
   * Verificar se sessão está ativa
   */
  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }
}