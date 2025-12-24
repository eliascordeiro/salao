# Migração para WPPConnect

## 📋 Resumo
Migração do sistema de WhatsApp de **Evolution API** para **WPPConnect** devido a problemas com geração de QR Code no Evolution API v2.2.3.

## 🔴 Problema com Evolution API
- ❌ QR Code nunca gerado (sempre retorna `{"count": 0}`)
- ❌ Testado versões v2.2.3 e v2.1.1
- ❌ Testado múltiplos endpoints (`/instance/connect`, `/instance/qrcode`, etc)
- ❌ Manager UI não exibe QR Code
- ❌ Pairing code também não funciona
- ✅ Infraestrutura funcional (PostgreSQL + Redis + Webhooks)
- ✅ Outros endpoints funcionam (status, criar instância, etc)

**Conclusão**: Bug fundamental na geração de QR Code no Evolution API v2.2.3

## ✅ Solução: WPPConnect
WPPConnect é uma alternativa brasileira open source mais confiável para WhatsApp Web.

### Vantagens
- ✅ QR Code funciona (biblioteca madura)
- ✅ 100% gratuito e open source
- ✅ Comunidade ativa brasileira
- ✅ Baseado em Puppeteer (estável)
- ✅ Callbacks em tempo real para QR Code
- ✅ Sessão persistente
- ⚠️ Risco de bloqueio (não é API oficial WhatsApp)

### Limitações
- ⚠️ Requer Chromium/Puppeteer (consumo de memória)
- ⚠️ Não é API oficial (WhatsApp pode bloquear)
- ⚠️ Recomendado apenas para testes (2 semanas)

## 🔧 Implementação

### 1. Instalação
```bash
npm install @wppconnect-team/wppconnect
```
**Resultado**: 198 pacotes adicionados (incluindo puppeteer-core, qrcode, etc)

### 2. Client Library (`lib/whatsapp/wppconnect-client.ts`)
```typescript
import * as wppconnect from '@wppconnect-team/wppconnect';

// Funções implementadas:
- initializeWPPConnect() → Inicializa sessão, retorna QR Code via callback
- sendWhatsAppMessage(phone, message) → Envia mensagem
- getLastQRCode() → Retorna último QR Code gerado
- isWhatsAppConnected() → Verifica status da conexão
- disconnectWhatsApp() → Logout e fecha sessão
```

**Storage**: QR Code armazenado em `global.lastQRCode` (temporário, não persiste)

### 3. API Endpoints (`app/api/whatsapp/wppconnect/route.ts`)

#### GET `/api/whatsapp/wppconnect`
**Resposta (não conectado):**
```json
{
  "connected": false,
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "message": "Escaneie o QR Code"
}
```

**Resposta (conectado):**
```json
{
  "connected": true,
  "message": "WhatsApp conectado"
}
```

#### POST `/api/whatsapp/wppconnect`
Inicializa WPPConnect, gera QR Code (aguarda 2s)
```json
{
  "success": true,
  "message": "Inicializando WhatsApp...",
  "qrCode": "data:image/png;base64,..."
}
```

#### DELETE `/api/whatsapp/wppconnect`
Desconecta WhatsApp
```json
{
  "success": true,
  "message": "WhatsApp desconectado"
}
```

### 4. Frontend (`app/(admin)/dashboard/configuracoes/whatsapp/page.tsx`)

**Mudanças**:
- ✅ `fetchStatus()` → agora chama `/api/whatsapp/wppconnect` (GET)
- ✅ `handleConnect()` → agora chama `/api/whatsapp/wppconnect` (POST)
  - Polling a cada 2s para detectar conexão
  - Timeout de 60s
- ✅ `fetchDirectQRCode()` → agora chama `/api/whatsapp/wppconnect` (GET)
- ✅ `handleDisconnect()` → agora chama `/api/whatsapp/wppconnect` (DELETE)

**Removido**:
- ❌ Referências ao Evolution API URL
- ❌ Configuração manual (API key, instance name)
- ❌ Lógica de "needsManualSetup"

## 🧪 Como Testar

### 1. Desenvolvimento Local
```bash
npm run dev
```

### 2. Acessar Configurações WhatsApp
http://localhost:3000/dashboard/configuracoes/whatsapp

### 3. Conectar WhatsApp
1. Clicar em **"Conectar WhatsApp"**
2. Aguardar geração do QR Code (2-5 segundos)
3. Clicar em **"Ver QR Code Direto"** (se não aparecer automaticamente)
4. Escanear QR Code com WhatsApp (5541996123839)
5. Verificar status mudar para "Conectado"

### 4. Testar Envio
1. Preencher número de teste: `5541996123839`
2. Preencher mensagem: `Teste WPPConnect`
3. Clicar em **"Enviar Mensagem de Teste"**
4. Verificar recebimento no WhatsApp

## 📊 Comparação Evolution vs WPPConnect

| Feature | Evolution API | WPPConnect |
|---------|---------------|------------|
| QR Code geração | ❌ Quebrado | ✅ Funciona |
| API oficial | ❌ Não | ❌ Não |
| Risco bloqueio | Alto | Alto |
| Configuração | Complexa | Simples |
| Infraestrutura | PostgreSQL + Redis | Apenas Node.js |
| Custo | Grátis | Grátis |
| Suporte | Limitado | Comunidade ativa |
| Persistência | Banco de dados | Arquivos locais |
| Consumo RAM | Baixo | Alto (Puppeteer) |

## 🚀 Deploy Railway

### Configuração Necessária
WPPConnect requer Chromium para funcionar. No Railway:

1. **Adicionar buildpack** (criar `nixpacks.toml`):
```toml
[phases.setup]
nixPkgs = ["chromium"]
```

2. **Variáveis de ambiente**:
```env
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/store/.../bin/chromium
```

3. **Memória**: Aumentar para pelo menos **512MB** (Puppeteer consome ~200MB)

### Deploy
```bash
railway up
# ou usar GitHub auto-deploy
```

## ⚠️ Avisos Importantes

### 1. Período de Teste (2 semanas)
WPPConnect é **solução de teste**, não produção definitiva.

**Motivos**:
- Risco de bloqueio pelo WhatsApp (não é API oficial)
- Consome muita memória (Puppeteer)
- Sessão pode quebrar sem aviso

### 2. Plano de Migração Futura

**Opção 1: SMS Twilio** (Recomendado)
- ✅ Confiável e oficial
- ✅ R$ 0,25 por SMS
- ✅ 99.9% uptime
- ❌ Custo por mensagem

**Opção 2: WhatsApp Twilio** (Oficial)
- ✅ API oficial WhatsApp
- ✅ R$ 0,025 por mensagem (10x mais barato)
- ✅ Templates aprovados
- ❌ Requer aprovação (1-2 semanas)
- ❌ Processo de verificação

**Opção 3: Continuar WPPConnect**
- ✅ Grátis
- ⚠️ Risco de bloqueio
- ⚠️ Manutenção constante

### 3. Monitoramento
Monitorar logs para:
- ❌ Erros de conexão Puppeteer
- ❌ Sessão desconectada inesperadamente
- ❌ QR Code expirando muito rápido
- ❌ Mensagens não sendo entregues

## 📝 Checklist de Migração

- [x] Instalar `@wppconnect-team/wppconnect`
- [x] Criar `lib/whatsapp/wppconnect-client.ts`
- [x] Criar API `/api/whatsapp/wppconnect`
- [x] Atualizar frontend `page.tsx`
- [ ] Testar QR Code geração (desenvolvimento)
- [ ] Testar conexão WhatsApp
- [ ] Testar envio de mensagem
- [ ] Configurar Railway (nixpacks, memória)
- [ ] Deploy para produção
- [ ] Teste final com usuário real (5541996123839)
- [ ] Monitorar por 2 semanas
- [ ] Decidir: continuar WPPConnect ou migrar para Twilio

## 🔗 Recursos

- [WPPConnect GitHub](https://github.com/wppconnect-team/wppconnect)
- [WPPConnect Docs](https://wppconnect.io/)
- [Twilio SMS](https://www.twilio.com/pt-br/messaging/sms)
- [Twilio WhatsApp](https://www.twilio.com/pt-br/whatsapp)

## 📞 Próximos Passos

1. **Testar agora** (desenvolvimento local)
2. **Deploy Railway** (com configuração Chromium)
3. **Monitorar 2 semanas** (estabilidade)
4. **Decidir solução final**:
   - ✅ WPPConnect funcionou? → Continuar
   - ❌ Problemas/bloqueios? → Migrar para Twilio SMS/WhatsApp

---

**Data Migração**: Janeiro 2025  
**Status Evolution API**: Desativado (infraestrutura mantida no Railway)  
**Status WPPConnect**: Em teste (2 semanas)
