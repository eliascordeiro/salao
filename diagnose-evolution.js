/**
 * Script de Diagnóstico Evolution API
 * Descobre as configurações necessárias e testa conectividade
 */

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://evolution-api-production-6c1c.up.railway.app';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';

console.log('🔍 DIAGNÓSTICO EVOLUTION API\n');
console.log('📋 Configuração atual:');
console.log(`  URL: ${EVOLUTION_API_URL}`);
console.log(`  API Key: ${EVOLUTION_API_KEY ? '✅ Configurada' : '❌ Não configurada'}\n`);

async function testConnection() {
  console.log('1️⃣ Testando conectividade com Evolution API...\n');
  
  try {
    // Teste 1: Verificar se a API está online
    console.log('   Verificando se API está online...');
    const healthCheck = await fetch(`${EVOLUTION_API_URL}/`);
    console.log(`   Status: ${healthCheck.status} ${healthCheck.ok ? '✅' : '❌'}`);
    
    if (healthCheck.ok) {
      const data = await healthCheck.text();
      console.log(`   Resposta: ${data.substring(0, 100)}...\n`);
    }
  } catch (error) {
    console.error('   ❌ Erro de conexão:', error.message);
    console.log('   💡 Verifique se a URL está correta e se o serviço está rodando\n');
    return false;
  }
  
  return true;
}

async function listInstances() {
  console.log('2️⃣ Listando instâncias existentes...\n');
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Erro: ${error}\n`);
      
      if (response.status === 401) {
        console.log('   💡 Dicas:');
        console.log('      - Verifique se EVOLUTION_API_KEY está correta');
        console.log('      - No Evolution Manager, a chave está em: Settings → API Key');
        console.log('      - O header deve ser "apikey" (minúsculo)\n');
      }
      
      return null;
    }
    
    const instances = await response.json();
    console.log('   ✅ Instâncias encontradas:');
    console.log(JSON.stringify(instances, null, 2));
    console.log('');
    
    return instances;
    
  } catch (error) {
    console.error('   ❌ Erro ao listar instâncias:', error.message, '\n');
    return null;
  }
}

async function createInstance(instanceName = 'salon-booking') {
  console.log(`3️⃣ Criando instância "${instanceName}"...\n`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
        webhook: process.env.WEBHOOK_URL || 'https://salon-booking.com.br/api/webhooks/whatsapp',
        webhookByEvents: true,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'MESSAGES_UPDATE'
        ]
      })
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Erro: ${error}\n`);
      return null;
    }
    
    const result = await response.json();
    console.log('   ✅ Instância criada:');
    console.log(JSON.stringify(result, null, 2));
    console.log('');
    
    return result;
    
  } catch (error) {
    console.error('   ❌ Erro ao criar instância:', error.message, '\n');
    return null;
  }
}

async function getQRCode(instanceName = 'salon-booking') {
  console.log(`4️⃣ Gerando QR Code para "${instanceName}"...\n`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Erro: ${error}\n`);
      return null;
    }
    
    const result = await response.json();
    
    if (result.base64) {
      console.log('   ✅ QR Code gerado com sucesso!');
      console.log(`   Base64 length: ${result.base64.length} caracteres`);
      console.log('   💡 Você pode usar este base64 para exibir o QR code na interface\n');
    } else {
      console.log('   ⚠️ Resposta recebida, mas sem QR code:');
      console.log(JSON.stringify(result, null, 2));
      console.log('');
    }
    
    return result;
    
  } catch (error) {
    console.error('   ❌ Erro ao gerar QR code:', error.message, '\n');
    return null;
  }
}

async function getInstanceInfo(instanceName = 'salon-booking') {
  console.log(`5️⃣ Obtendo informações da instância "${instanceName}"...\n`);
  
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': EVOLUTION_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`   ❌ Erro: ${error}\n`);
      return null;
    }
    
    const info = await response.json();
    console.log('   ✅ Informações da instância:');
    console.log(JSON.stringify(info, null, 2));
    console.log('');
    
    if (info.state === 'open') {
      console.log('   🎉 WhatsApp está conectado!\n');
    } else if (info.state === 'close') {
      console.log('   ⚠️ WhatsApp desconectado. Execute novamente para gerar QR code.\n');
    }
    
    return info;
    
  } catch (error) {
    console.error('   ❌ Erro ao obter info da instância:', error.message, '\n');
    return null;
  }
}

// Executar diagnóstico completo
async function runDiagnostic() {
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // 1. Testar conexão
  const isOnline = await testConnection();
  if (!isOnline) {
    console.log('❌ Evolution API não está acessível. Verifique a URL.\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    return;
  }
  
  // 2. Listar instâncias
  const instances = await listInstances();
  
  // 3. Verificar se existe instância "salon-booking"
  const instanceName = 'salon-booking';
  const instanceExists = instances && instances.some(
    i => i.instance?.instanceName === instanceName || i.instanceName === instanceName
  );
  
  if (!instanceExists) {
    console.log(`   ⚠️ Instância "${instanceName}" não encontrada.\n`);
    
    // Perguntar se deve criar
    console.log('   💡 Criando instância automaticamente...\n');
    await createInstance(instanceName);
  } else {
    console.log(`   ✅ Instância "${instanceName}" já existe!\n`);
  }
  
  // 4. Obter informações da instância
  const info = await getInstanceInfo(instanceName);
  
  // 5. Se não estiver conectado, gerar QR code
  if (info && info.state !== 'open') {
    await getQRCode(instanceName);
  }
  
  // Resumo final
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMO DO DIAGNÓSTICO\n');
  console.log(`✅ Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`✅ API Key: ${EVOLUTION_API_KEY ? 'Configurada' : 'Não configurada'}`);
  console.log(`✅ Instância: ${instanceName}`);
  console.log(`✅ Status: ${info?.state || 'Desconhecido'}\n`);
  
  if (info?.state === 'open') {
    console.log('🎉 TUDO CONFIGURADO! WhatsApp conectado e pronto para uso.\n');
  } else {
    console.log('⏳ PRÓXIMO PASSO: Escaneie o QR code exibido acima com seu WhatsApp.\n');
    console.log('💡 DICA: Acesse http://localhost:3000/dashboard/configuracoes/whatsapp\n');
  }
  
  console.log('═══════════════════════════════════════════════════════════\n');
}

// Executar
runDiagnostic().catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});
