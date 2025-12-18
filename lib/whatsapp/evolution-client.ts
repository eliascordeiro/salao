/**
 * Cliente para Evolution API (WhatsApp)
 * Documentação: https://doc.evolution-api.com/
 */

interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
}

interface SendMessageParams {
  number: string; // Número com DDI (ex: 5511999999999)
  text: string;
  delay?: number; // Delay em ms (simular digitação)
}

interface SendMediaParams extends SendMessageParams {
  mediaUrl: string;
  caption?: string;
}

export class EvolutionWhatsAppClient {
  private config: EvolutionConfig;

  constructor(config: EvolutionConfig) {
    this.config = config;
  }

  /**
   * Formata número para padrão WhatsApp
   * Remove caracteres especiais e garante DDI
   */
  private formatPhoneNumber(phone: string): string {
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, "");
    
    // Se já tem DDI (55 do Brasil)
    if (cleaned.startsWith("55")) {
      return cleaned;
    }
    
    // Se tem 11 dígitos (DDD + número), adiciona DDI Brasil
    if (cleaned.length === 11 || cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Envia mensagem de texto
   */
  async sendText({ number, text, delay = 1000 }: SendMessageParams) {
    const formattedNumber = this.formatPhoneNumber(number);
    
    const response = await fetch(
      `${this.config.baseUrl}/message/sendText/${this.config.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.apiKey,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text,
          delay,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao enviar WhatsApp: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Envia imagem com legenda
   */
  async sendMedia({ number, mediaUrl, caption, delay = 1000 }: SendMediaParams) {
    const formattedNumber = this.formatPhoneNumber(number);
    
    const response = await fetch(
      `${this.config.baseUrl}/message/sendMedia/${this.config.instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: this.config.apiKey,
        },
        body: JSON.stringify({
          number: formattedNumber,
          mediaUrl,
          caption,
          delay,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao enviar mídia WhatsApp: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Verifica status da instância
   */
  async getInstanceStatus() {
    const response = await fetch(
      `${this.config.baseUrl}/instance/connectionState/${this.config.instanceName}`,
      {
        headers: {
          apikey: this.config.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao verificar status da instância");
    }

    return response.json();
  }

  /**
   * Cria nova instância
   */
  async createInstance() {
    console.log("🆕 [createInstance] Criando instância...");
    console.log("  - URL:", `${this.config.baseUrl}/instance/create`);
    console.log("  - Instance name:", this.config.instanceName);
    
    const response = await fetch(`${this.config.baseUrl}/instance/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.config.apiKey,
      },
      body: JSON.stringify({
        instanceName: this.config.instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    console.log("  - Response status:", response.status);
    console.log("  - Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro na resposta:", errorText);
      
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      
      throw new Error(`Erro ao criar instância: ${error.message || response.statusText}`);
    }

    const result = await response.json();
    console.log("✅ Instância criada com sucesso:", result);
    return result;
  }

  /**
   * Obtém QR Code para conectar
   */
  async getQRCode() {
    console.log("📱 [getQRCode] Obtendo QR Code...");
    console.log("  - URL:", `${this.config.baseUrl}/instance/connect/${this.config.instanceName}`);
    
    const response = await fetch(
      `${this.config.baseUrl}/instance/connect/${this.config.instanceName}`,
      {
        headers: {
          apikey: this.config.apiKey,
        },
      }
    );

    console.log("  - Response status:", response.status);
    console.log("  - Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao obter QR Code:", errorText);
      throw new Error("Erro ao obter QR Code");
    }

    const result = await response.json();
    console.log("✅ QR Code obtido:", Object.keys(result));
    return result;
  }

  /**
   * Desconecta instância
   */
  async logout() {
    const response = await fetch(
      `${this.config.baseUrl}/instance/logout/${this.config.instanceName}`,
      {
        method: "DELETE",
        headers: {
          apikey: this.config.apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao desconectar");
    }

    return response.json();
  }
}

/**
 * Instância singleton do cliente WhatsApp
 */
let whatsappClient: EvolutionWhatsAppClient | null = null;

export function getWhatsAppClient(): EvolutionWhatsAppClient {
  if (!whatsappClient) {
    const baseUrl = process.env.EVOLUTION_API_URL || "";
    const apiKey = process.env.EVOLUTION_API_KEY || "";
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || "salon-booking";

    if (!baseUrl || !apiKey) {
      throw new Error("Configuração Evolution API não encontrada");
    }

    whatsappClient = new EvolutionWhatsAppClient({
      baseUrl,
      apiKey,
      instanceName,
    });
  }

  return whatsappClient;
}
