/**
 * Script para verificar status do WhatsApp na Evolution API (Railway)
 * e gerar QR Code se necessário
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'salon-booking';

async function checkInstanceStatus() {
  try {
    console.log('🔍 Verificando status da instância:', INSTANCE_NAME);
    console.log('📡 URL:', EVOLUTION_API_URL);
    
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Erro ao buscar status:', response.status, response.statusText);
      const text = await response.text();
      console.error('Resposta:', text);
      return;
    }

    const data = await response.json();
    console.log('\n📊 Status da Conexão:');
    console.log(JSON.stringify(data, null, 2));

    if (data.state === 'close' || data.state === 'connecting') {
      console.log('\n⚠️  Instância não conectada. Gerando QR Code...\n');
      await generateQRCode();
    } else if (data.state === 'open') {
      console.log('\n✅ WhatsApp conectado!');
      console.log('📱 Número:', data.phoneNumber);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

async function generateQRCode() {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`,
      {
        headers: {
          'apikey': EVOLUTION_API_KEY,
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Erro ao gerar QR Code:', response.status);
      const text = await response.text();
      console.error('Resposta:', text);
      return;
    }

    const data = await response.json();
    
    if (data.qrcode?.base64) {
      console.log('📱 QR CODE GERADO!');
      console.log('🔗 Acesse o painel: https://salon-booking.com.br/dashboard/configuracoes/whatsapp');
      console.log('\nOu use este QR Code base64:');
      console.log(data.qrcode.base64.substring(0, 100) + '...');
      console.log('\n⏰ Escaneie em até 40 segundos!');
    } else {
      console.log('⚠️  QR Code não disponível:', data);
    }

  } catch (error) {
    console.error('❌ Erro ao gerar QR:', error.message);
  }
}

async function restartInstance() {
  try {
    console.log('🔄 Reiniciando instância:', INSTANCE_NAME);
    
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/restart/${INSTANCE_NAME}`,
      {
        method: 'PUT',
        headers: {
          'apikey': EVOLUTION_API_KEY,
        }
      }
    );

    if (!response.ok) {
      console.error('❌ Erro ao reiniciar:', response.status);
      return;
    }

    const data = await response.json();
    console.log('✅ Instância reiniciada:', data);
    
    // Aguardar 3 segundos e verificar status
    console.log('\n⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    await checkInstanceStatus();

  } catch (error) {
    console.error('❌ Erro ao reiniciar:', error.message);
  }
}

// Executar
const args = process.argv.slice(2);
const command = args[0] || 'status';

console.log('🚀 Evolution API - Railway\n');

if (command === 'restart') {
  restartInstance();
} else if (command === 'qr') {
  generateQRCode();
} else {
  checkInstanceStatus();
}
