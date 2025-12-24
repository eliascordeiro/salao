/**
 * Cliente para WhatsApp Business API Oficial (Meta/Facebook)
 * Documentação: https://developers.facebook.com/docs/whatsapp/cloud-api
 * 
 * Funcionalidades:
 * - Envio de mensagens de texto
 * - Mensagens com templates aprovados
 * - Verificação de status de entrega
 * - Webhooks para callbacks
 */

interface WhatsAppConfig {
  phoneNumberId: string; // ID do número de telefone do WhatsApp Business
  accessToken: string;   // Token de acesso permanente
  apiVersion?: string;   // Versão da API (default: v18.0)
}

interface SendMessageParams {
  to: string;      // Número com DDI (ex: 5511999999999)
  message: string; // Texto da mensagem
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string; // Default: pt_BR
  components?: TemplateComponent[];
}

interface TemplateComponent {
  type: 'header' | 'body' | 'button';
  parameters: TemplateParameter[];
}

interface TemplateParameter {
  type: 'text' | 'currency' | 'date_time';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
}

interface MessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
}

export class WhatsAppOfficialClient {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor(config: WhatsAppConfig) {
    this.config = {
      ...config,
      apiVersion: config.apiVersion || 'v21.0'
    };
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`;
  }

  /**
   * Formata número para padrão WhatsApp
   * Remove caracteres especiais e garante DDI
   */
  private formatPhoneNumber(phone: string): string {
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
   * Envia mensagem de texto simples
   */
  async sendTextMessage(params: SendMessageParams): Promise<MessageResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(params.to);
      
      console.log('📱 [WhatsApp Official] Enviando mensagem para:', formattedPhone);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: params.message
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [WhatsApp Official] Erro:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro ao enviar mensagem',
          details: data.error
        };
      }

      console.log('✅ [WhatsApp Official] Mensagem enviada:', data.messages?.[0]?.id);

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('❌ [WhatsApp Official] Erro ao enviar mensagem:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Envia mensagem usando template aprovado
   * Templates precisam ser criados e aprovados no Meta Business Manager
   */
  async sendTemplateMessage(params: SendTemplateParams): Promise<MessageResponse> {
    try {
      const formattedPhone = this.formatPhoneNumber(params.to);
      
      console.log('📋 [WhatsApp Official] Enviando template:', params.templateName);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: params.templateName,
            language: {
              code: params.languageCode || 'pt_BR'
            },
            components: params.components || []
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ [WhatsApp Official] Erro no template:', data);
        return {
          success: false,
          error: data.error?.message || 'Erro ao enviar template',
          details: data.error
        };
      }

      console.log('✅ [WhatsApp Official] Template enviado:', data.messages?.[0]?.id);

      return {
        success: true,
        messageId: data.messages?.[0]?.id
      };

    } catch (error: any) {
      console.error('❌ [WhatsApp Official] Erro ao enviar template:', error);
      return {
        success: false,
        error: error.message || 'Erro desconhecido'
      };
    }
  }

  /**
   * Marca mensagem como lida
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('❌ [WhatsApp Official] Erro ao marcar como lida:', error);
      return false;
    }
  }

  /**
   * Verifica se o cliente tem WhatsApp configurado corretamente
   */
  static isConfigured(): boolean {
    return !!(
      process.env.WHATSAPP_PHONE_NUMBER_ID &&
      process.env.WHATSAPP_ACCESS_TOKEN
    );
  }

  /**
   * Cria instância do cliente com configuração do ambiente
   */
  static fromEnv(): WhatsAppOfficialClient | null {
    if (!this.isConfigured()) {
      console.warn('⚠️  [WhatsApp Official] Credenciais não configuradas');
      return null;
    }

    return new WhatsAppOfficialClient({
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
    });
  }
}

// Helper functions para uso fácil
export async function sendWhatsAppMessage(to: string, message: string): Promise<MessageResponse> {
  const client = WhatsAppOfficialClient.fromEnv();
  
  if (!client) {
    return {
      success: false,
      error: 'WhatsApp não configurado. Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN'
    };
  }

  return client.sendTextMessage({ to, message });
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  components?: TemplateComponent[]
): Promise<MessageResponse> {
  const client = WhatsAppOfficialClient.fromEnv();
  
  if (!client) {
    return {
      success: false,
      error: 'WhatsApp não configurado'
    };
  }

  return client.sendTemplateMessage({ to, templateName, components });
}

export function isWhatsAppConfigured(): boolean {
  return WhatsAppOfficialClient.isConfigured();
}
