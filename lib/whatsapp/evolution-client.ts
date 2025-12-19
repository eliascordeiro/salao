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
    
    // Primeiro, verificar se a instância existe
    console.log("  - Verificando se instância existe...");
    const fetchUrl = `${this.config.baseUrl}/instance/fetchInstances`;
    console.log("  - Fetch URL:", fetchUrl);
    
    const fetchResponse = await fetch(fetchUrl, {
      headers: {
        apikey: this.config.apiKey,
      },
    });
    
    if (!fetchResponse.ok) {
      console.error("❌ Erro ao buscar instâncias");
      throw new Error("Erro ao buscar instâncias");
    }
    
    const instances = await fetchResponse.json();
    console.log("  - Instâncias encontradas:", instances);
    
    const instanceExists = Array.isArray(instances) && 
      instances.some((inst: any) => inst.name === this.config.instanceName);
    
    console.log("  - Instância existe?", instanceExists);
    
    if (!instanceExists) {
      console.log("  - Instância não existe, precisa criar primeiro");
      throw new Error("INSTANCE_NOT_FOUND");
    }
    
    // Verificar se está conectada
    const instance = instances.find((inst: any) => inst.name === this.config.instanceName);
    console.log("  - Status da conexão:", instance?.connectionStatus);
    
    if (instance?.connectionStatus === 'close') {
      console.log("  ⚠️ Instância existe mas está desconectada, deletando e recriando...");
      
      // Deletar instância antiga
      const deleteUrl = `${this.config.baseUrl}/instance/delete/${this.config.instanceName}`;
      console.log("  - Delete URL:", deleteUrl);
      
      const deleteResponse = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          apikey: this.config.apiKey,
        },
      });
      
      console.log("  - Delete status:", deleteResponse.status);
      
      if (deleteResponse.ok || deleteResponse.status === 404) {
        console.log("  ✅ Instância antiga deletada");
        console.log("  ⏳ Aguardando 2 segundos...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Agora a instância não existe mais, lançar erro para criar nova
        console.log("  🔄 Forçando criação de nova instância...");
        throw new Error("INSTANCE_NOT_FOUND");
      } else {
        console.error("  ❌ Erro ao deletar instância antiga");
      }
    }
    
    // Agora buscar o QR Code
    console.log("  - Buscando QR Code...");
    
    // Endpoint correto: GET /instance/connect/:instanceName
    const connectUrl = `${this.config.baseUrl}/instance/connect/${this.config.instanceName}`;
    console.log("  - Connect URL:", connectUrl);
    
    const response = await fetch(connectUrl, {
      method: "GET",
      headers: {
        apikey: this.config.apiKey,
      },
    });

    console.log("  - Response status:", response.status);
    console.log("  - Response OK:", response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro ao obter QR Code:", errorText);
      
      // Se 404, tentar restart uma última vez
      if (response.status === 404) {
        console.log("  - Tentando restart da instância (segunda tentativa)...");
        const restartUrl = `${this.config.baseUrl}/instance/restart/${this.config.instanceName}`;
        const restartResponse = await fetch(restartUrl, {
          method: "PUT",
          headers: {
            apikey: this.config.apiKey,
          },
        });
        
        if (restartResponse.ok) {
          console.log("  ✅ Instância reiniciada, aguardando...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Tentar buscar QR Code novamente
          const retryResponse = await fetch(connectUrl, {
            method: "GET",
            headers: {
              apikey: this.config.apiKey,
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error("Erro ao obter QR Code após restart");
          }
          
          const retryResult = await retryResponse.json();
          console.log("✅ QR Code obtido após restart:", Object.keys(retryResult));
          return retryResult;
        }
      }
      
      throw new Error("Erro ao obter QR Code");
    }

    const result = await response.json();
    console.log("✅ QR Code obtido:", Object.keys(result));
    console.log("  - Dados completos:", JSON.stringify(result, null, 2));
    
    // Se retornou apenas {"count": 0}, significa que não há QR Code ainda
    if (result.count === 0 && !result.base64 && !result.code && !result.qrcode) {
      console.log("  ⚠️ QR Code ainda não gerado (count: 0)");
      throw new Error("QR_CODE_NOT_READY");
    }
    
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
