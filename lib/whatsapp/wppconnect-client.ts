// WPPConnect Client para WhatsApp Web
// IMPORTANTE: Esta biblioteca só funciona no servidor Node.js

// Usar global para compartilhar cliente entre processos Next.js
declare global {
  var wppConnectClient: any;
  var wppConnectInitializing: boolean;
}

// Acessar via global para persistir entre API calls
const getClient = () => global.wppConnectClient || null;
const setClient = (value: any) => { global.wppConnectClient = value; };
const isInitializing = () => global.wppConnectInitializing || false;
const setInitializing = (value: boolean) => { global.wppConnectInitializing = value; };

// Função para importar WPPConnect dinamicamente
async function getWPPConnect() {
  // Import dinâmico para evitar erro no webpack
  const wppconnect = await import('@wppconnect-team/wppconnect');
  return wppconnect;
}

/**
 * Inicializa o cliente WPPConnect
 * Reconecta automaticamente se já foi autenticado antes!
 */
export async function initializeWPPConnect() {
  const client = getClient();
  if (client) {
    console.log('✅ Cliente WPPConnect já inicializado');
    
    // Verificar se ainda está conectado
    try {
      const state = await client.getConnectionState();
      console.log('📊 Estado da conexão:', state);
      
      if (state === 'CONNECTED') {
        console.log('✅ Cliente já está conectado e pronto!');
        return client;
      }
    } catch (error) {
      console.log('⚠️ Cliente existe mas não está conectado, reconectando...');
      setClient(null); // Resetar para criar novo
    }
  }

  if (isInitializing()) {
    console.log('⏳ WPPConnect já está inicializando...');
    return null;
  }

  try {
    setInitializing(true);
    console.log('🚀 Iniciando WPPConnect...');
    console.log('📁 Verificando sessão salva em: tokens/salon-booking/');
    
    const hasSession = hasStoredSession();
    if (hasSession) {
      console.log('🔄 Sessão anterior encontrada! Tentando reconectar automaticamente...');
      console.log('⏳ Aguarde, reconectando sem precisar escanear QR Code...');
    } else {
      console.log('📱 Primeira conexão! QR Code será gerado...');
    }

    const wppconnect = await getWPPConnect();
    
    const newClient = await wppconnect.create({
      session: 'salon-booking',
      headless: true, // Navegador escondido (mude para false para debug visual)
      autoClose: 300000, // 5 minutos (300s) para escanear QR Code
      logQR: true, // Mostra QR Code no terminal (útil!)
      disableWelcome: true, // Desabilitar mensagem de boas-vindas
      updatesLog: false, // Desabilitar logs de atualização
      catchQR: (base64Qr, asciiQR, attempts, urlCode) => {
        console.log('📱 QR Code gerado! Tentativa:', attempts);
        console.log('🔗 QR Code URL:', urlCode);
        console.log('📦 Base64 QR (primeiros 100 chars):', base64Qr?.substring(0, 100));
        
        // Salvar QR Code para exibir na UI
        (global as any).lastQRCode = base64Qr;
        (global as any).lastQRCodeUrl = urlCode;
        
        console.log('💾 QR Code salvo no global:', {
          hasBase64: !!(global as any).lastQRCode,
          hasUrl: !!(global as any).lastQRCodeUrl,
          base64Length: (global as any).lastQRCode?.length || 0
        });
      },
      statusFind: async (statusSession, session) => {
        console.log('📊 Status da sessão:', statusSession);
        
        if (statusSession === 'autocloseCalled') {
          console.log('⏱️ Tempo de espera do QR Code expirou');
        }
        
        if (statusSession === 'qrReadSuccess') {
          console.log('✅ QR Code escaneado com sucesso!');
          // Limpar QR Code da UI pois já foi escaneado
          (global as any).lastQRCode = null;
          (global as any).lastQRCodeUrl = null;
        }
        
        if (statusSession === 'isLogged') {
          console.log('✅ WhatsApp autenticado! Sessão salva para reconexão automática.');
        }
        
        if (statusSession === 'chatsAvailable') {
          console.log('💬 Conversas carregadas e disponíveis');
        }
        
        // Quando conectar completamente, enviar mensagem de teste automática
        if (statusSession === 'inChat') {
          console.log('🎉 WhatsApp totalmente conectado e operacional!');
          console.log('💾 Sessão salva em: tokens/salon-booking/');
          console.log('🔄 Na próxima vez que reiniciar o servidor, reconectará automaticamente!');
          
          // Aguardar 2 segundos para garantir que está pronto
          setTimeout(async () => {
            try {
              const client = getClient();
              if (client) {
                const phone = '5541996123839@c.us';
                const message = '🎉 WhatsApp conectado com sucesso! Sistema de notificações ativo.';
                
                console.log(`📤 Enviando mensagem automática para ${phone}...`);
                const result = await client.sendText(phone, message);
                
                console.log('✅ Mensagem automática enviada!');
                console.log('📊 Detalhes do envio:', JSON.stringify(result, null, 2));
                console.log('📱 Status de entrega (ack):', result?.ack);
                console.log('🆔 ID da mensagem:', result?.id);
                
                // ACK status:
                // 0 = Erro/Não enviado
                // 1 = Enviado (1 check ✓)
                // 2 = Recebido pelo servidor (2 checks ✓✓)
                // 3 = Entregue ao destinatário (2 checks azuis ✓✓)
                // 4 = Lido pelo destinatário (2 checks azuis ✓✓)
                if (result?.ack === 1) {
                  console.log('✅ Mensagem ENVIADA (1 check ✓)');
                } else if (result?.ack === 2) {
                  console.log('✅ Mensagem RECEBIDA pelo servidor (2 checks ✓✓)');
                } else if (result?.ack === 3) {
                  console.log('✅ Mensagem ENTREGUE ao destinatário (azul ✓✓)');
                } else if (result?.ack === 4) {
                  console.log('✅ Mensagem LIDA pelo destinatário (azul ✓✓)');
                }
              }
            } catch (error) {
              console.error('❌ Erro ao enviar mensagem automática:', error);
            }
          }, 2000);
        }
        
        if (statusSession === 'notLogged') {
          console.log('❌ WhatsApp desconectado');
        }
        
        if (statusSession === 'browserClose') {
          console.log('🔌 Navegador fechado');
          setClient(null); // Limpar cliente
        }
      },
      logQR: false, // Não logar QR Code ASCII no console (muito grande)
      disableSpins: true, // Desabilitar animações no terminal
      disableWelcome: true, // Desabilitar mensagem de boas-vindas
    });

    setClient(newClient);
    console.log('✅ WPPConnect inicializado com sucesso!');
    setInitializing(false);
    return newClient;

  } catch (error) {
    console.error('❌ Erro ao inicializar WPPConnect:', error);
    setInitializing(false);
    setClient(null);
    throw error;
  }
}

/**
 * Envia mensagem de texto via WhatsApp
 */
export async function sendWhatsAppMessage(phone: string, message: string) {
  try {
    // Verificar se já existe um cliente conectado
    let client = getClient();
    if (!client) {
      throw new Error('❌ WhatsApp não está conectado. Conecte primeiro via Dashboard.');
    }

    // Verificar se está conectado
    const isConnected = await isWhatsAppConnected();
    if (!isConnected) {
      throw new Error('❌ WhatsApp não está conectado. Escaneie o QR Code primeiro.');
    }

    // Formatar número: remover caracteres especiais e adicionar @c.us
    const formattedPhone = phone.replace(/\D/g, '') + '@c.us';

    console.log(`📤 Enviando mensagem para ${formattedPhone}...`);
    
    const result = await client.sendText(formattedPhone, message);
    
    console.log('✅ Mensagem enviada!');
    console.log('📊 Detalhes do envio:', JSON.stringify(result, null, 2));
    console.log('📱 Status de entrega (ack):', result?.ack);
    console.log('🆔 ID da mensagem:', result?.id);
    
    // ACK status:
    // 0 = Erro/Não enviado
    // 1 = Enviado (1 check ✓)
    // 2 = Recebido pelo servidor (2 checks ✓✓)
    // 3 = Entregue ao destinatário (2 checks azuis ✓✓)
    // 4 = Lido pelo destinatário (2 checks azuis ✓✓)
    if (result?.ack === 1) {
      console.log('✅ Status: ENVIADA (1 check ✓)');
    } else if (result?.ack === 2) {
      console.log('✅ Status: RECEBIDA pelo servidor (2 checks ✓✓)');
    } else if (result?.ack === 3) {
      console.log('✅ Status: ENTREGUE ao destinatário (azul ✓✓)');
    } else if (result?.ack === 4) {
      console.log('✅ Status: LIDA pelo destinatário (azul ✓✓)');
    }
    
    return result;

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    throw error;
  }
}

/**
 * Verifica se existe sessão salva
 */
function hasStoredSession() {
  try {
    const fs = require('fs');
    const path = require('path');
    const sessionPath = path.join(process.cwd(), 'tokens', 'salon-booking');
    
    if (fs.existsSync(sessionPath)) {
      const files = fs.readdirSync(sessionPath);
      const hasSession = files.length > 0;
      console.log(`📁 Sessão salva encontrada em: ${sessionPath}`);
      console.log(`📄 Arquivos de sessão: ${files.length} arquivo(s)`);
      return hasSession;
    }
    
    console.log('📁 Nenhuma sessão salva encontrada (primeira conexão)');
    return false;
  } catch (error) {
    console.log('⚠️ Erro ao verificar sessão salva:', error);
    return false;
  }
}

/**
 * Obtém o último QR Code gerado
 */
export function getLastQRCode() {
  return {
    base64: (global as any).lastQRCode || null,
    url: (global as any).lastQRCodeUrl || null,
  };
}

/**
 * Verifica se o WhatsApp está conectado
 */
export async function isWhatsAppConnected() {
  try {
    const client = getClient();
    if (!client) {
      return false;
    }

    const status = await client.getConnectionState();
    return status === 'CONNECTED';

  } catch (error) {
    console.error('❌ Erro ao verificar conexão:', error);
    return false;
  }
}

/**
 * Desconecta o cliente WPPConnect
 */
export async function disconnectWhatsApp() {
  try {
    const client = getClient();
    if (client) {
      await client.logout();
      await client.close();
      setClient(null);
      console.log('✅ WhatsApp desconectado');
    }
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
    throw error;
  }
}
