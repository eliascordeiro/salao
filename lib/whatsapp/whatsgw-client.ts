/**
 * WhatsGW Client - HTTP API para WhatsApp
 * Documentação: https://documenter.getpostman.com/view/3741041/SztBa7ku
 */

export interface WhatsGWConfig {
  baseUrl: string // URL do servidor WhatsGW (ex: http://localhost:3000)
  token?: string  // Token de autenticação (se configurado)
}

export interface SendMessageParams {
  phone: string   // Número com DDI (ex: 5541999999999)
  message: string // Texto da mensagem
}

export interface WhatsGWStatus {
  connected: boolean
  phone?: string
  qrCode?: string
}

export class WhatsGWClient {
  private config: WhatsGWConfig

  constructor(config: WhatsGWConfig) {
    this.config = config
  }

  /**
   * Headers para requisições
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`
    }

    return headers
  }

  /**
   * Iniciar sessão WhatsApp (gera QR Code)
   */
  async startSession(): Promise<{ qrCode?: string; connected: boolean }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/session/start`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ sessionName: 'default' }),
      })

      if (!response.ok) {
        throw new Error(`Erro ao iniciar sessão: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        qrCode: data.qrCode,
        connected: data.connected || false,
      }
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão WhatsGW:', error)
      throw error
    }
  }

  /**
   * Verificar status da sessão
   */
  async getStatus(): Promise<WhatsGWStatus> {
    try {
      const response = await fetch(`${this.config.baseUrl}/session/status/default`, {
        method: 'GET',
        headers: this.getHeaders(),
      })

      if (!response.ok) {
        return { connected: false }
      }

      const data = await response.json()
      return {
        connected: data.connected || data.status === 'connected',
        phone: data.phone || data.me?.user,
        qrCode: data.qrCode,
      }
    } catch (error) {
      console.error('❌ Erro ao verificar status WhatsGW:', error)
      return { connected: false }
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

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Erro ao enviar mensagem',
        }
      }

      return {
        success: true,
        messageId: data.messageId || data.id,
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
   * Desconectar sessão (logout)
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/session/logout/default`, {
        method: 'POST',
        headers: this.getHeaders(),
      })

      return { success: response.ok }
    } catch (error) {
      console.error('❌ Erro ao desconectar WhatsGW:', error)
      return { success: false }
    }
  }

  /**
   * Verificar se sessão está ativa
   */
  async isConnected(): Promise<boolean> {
    const status = await this.getStatus()
    return status.connected
  }

  /**
   * Aguardar QR Code ser escaneado (polling)
   */
  async waitForConnection(maxAttempts = 30, intervalMs = 2000): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getStatus()
      
      if (status.connected) {
        return true
      }

      // Aguardar antes de próxima tentativa
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }

    return false
  }
}

/**
 * Criar instância do cliente WhatsGW
 */
export function createWhatsGWClient(config: WhatsGWConfig): WhatsGWClient {
  return new WhatsGWClient(config)
}
