# 🧪 Guia de Teste WPPConnect

## ✅ Status Atual
- ✅ WPPConnect instalado (198 pacotes)
- ✅ Client library criada (`lib/whatsapp/wppconnect-client.ts`)
- ✅ API endpoints criados (`/api/whatsapp/wppconnect`)
- ✅ Frontend atualizado
- ✅ Servidor rodando em http://localhost:3000

## 🎯 Teste Rápido (5 minutos)

### 1. Acessar Configurações WhatsApp
```
http://localhost:3000/dashboard/configuracoes/whatsapp
```

**Login**: admin@agendasalao.com.br / admin123

### 2. Conectar WhatsApp
1. Clicar em **"Conectar WhatsApp"** (botão verde)
2. ⏳ Aguardar 2-5 segundos (WPPConnect inicializando)
3. ✅ Toast: "Inicializando WPPConnect..."

### 3. Ver QR Code
**Opção A**: QR Code aparece automaticamente na tela

**Opção B**: Clicar em **"Ver QR Code Direto"** (botão azul)

### 4. Escanear QR Code
1. Abrir WhatsApp no celular **5541996123839**
2. Ir em **Aparelhos conectados**
3. Tocar em **"Conectar um aparelho"**
4. Escanear o QR Code da tela
5. ⏳ Aguardar confirmação (até 10s)
6. ✅ Status muda para "Conectado" (automático via polling)

### 5. Enviar Mensagem de Teste
1. Campo **"Número WhatsApp"**: `5541996123839`
2. Campo **"Mensagem"**: `✅ Teste WPPConnect funcionando!`
3. Clicar em **"Enviar Mensagem de Teste"**
4. ✅ Verificar recebimento no WhatsApp

## 🐛 Problemas Esperados

### Problema 1: Erro "Chromium not found"
**Sintoma**: Erro ao inicializar WPPConnect
**Causa**: Puppeteer não encontrou Chromium
**Solução**:
```bash
# Instalar Chromium manualmente
npm install puppeteer --save-dev

# Ou especificar caminho
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### Problema 2: QR Code não aparece após 10s
**Sintoma**: QR Code sempre `null`
**Solução**:
1. Verificar console do navegador (F12)
2. Verificar logs do terminal (`npm run dev`)
3. Tentar novamente (pode demorar na 1ª vez)
4. Reiniciar servidor se necessário

### Problema 3: QR Code expira muito rápido
**Sintoma**: QR Code some antes de escanear
**Causa**: QR Code expira em ~20 segundos
**Solução**:
1. Clicar novamente em "Conectar WhatsApp"
2. Escanear mais rápido
3. Ter WhatsApp aberto antes de gerar QR Code

### Problema 4: Conexão cai após alguns minutos
**Sintoma**: Status muda para "Desconectado" sozinho
**Causa**: Sessão WPPConnect instável
**Solução**:
1. Normal em ambiente de desenvolvimento
2. Reconectar (gerar novo QR Code)
3. Em produção, implementar auto-reconexão

## 📊 Logs Esperados

### Console Navegador (F12)
```
🔍 Buscando QR Code do WPPConnect...
📱 Resposta do WPPConnect: {connected: false, qrCode: "data:image/png;base64,..."}
✅ QR Code carregado com sucesso!
```

### Terminal (npm run dev)
```
🔄 Inicializando WPPConnect...
📱 QR Code gerado!
✅ WhatsApp conectado!
📨 Mensagem enviada para 5541996123839
```

## ⚠️ Observações Importantes

### Primeira Execução
- 🐢 Pode demorar 30-60 segundos
- 📦 Puppeteer baixa Chromium automaticamente (~170MB)
- 💾 Cria pasta `.wppconnect` no projeto (sessões)

### Sessões Persistentes
WPPConnect salva sessões em:
```
.wppconnect/sessions/session-salon-booking/
```
**Importante**: Adicionar ao `.gitignore` (dados sensíveis)

### Memória
WPPConnect consome:
- 🧠 ~200MB RAM (Chromium headless)
- 💾 ~50MB disco (sessão + cache)

### Segurança
- 🔒 QR Code é temporário (expira em 20s)
- 🔒 Sessão criptografada localmente
- ⚠️ Não expor `.wppconnect/` publicamente

## ✅ Checklist de Validação

**Teste 1: Geração de QR Code**
- [ ] QR Code gerado em menos de 5s
- [ ] QR Code exibido na tela
- [ ] QR Code é uma imagem válida (data:image/png;base64...)
- [ ] QR Code pode ser escaneado

**Teste 2: Conexão WhatsApp**
- [ ] WhatsApp conecta após escanear QR Code
- [ ] Status muda para "Conectado"
- [ ] Polling detecta conexão automaticamente
- [ ] Toast de sucesso exibido

**Teste 3: Envio de Mensagem**
- [ ] Formulário de teste funciona
- [ ] Mensagem é recebida no WhatsApp
- [ ] Mensagem tem formatação correta
- [ ] Sem delay significativo (< 3s)

**Teste 4: Desconexão**
- [ ] Botão "Desconectar" funciona
- [ ] Status muda para "Desconectado"
- [ ] QR Code é limpo da tela
- [ ] Pode reconectar novamente

**Teste 5: Persistência**
- [ ] Após reconectar, não pede QR Code (usa sessão salva)
- [ ] Sessão sobrevive a restart do servidor
- [ ] Pasta `.wppconnect/sessions/` contém dados

## 🚀 Próximo Passo: Railway

Se teste local funcionar (✅ todos os checkboxes acima):

1. **Commit mudanças**:
```bash
git add .
git commit -m "Migração Evolution API → WPPConnect"
git push
```

2. **Configurar Railway**:
```bash
# Ver docs/MIGRACAO_WPPCONNECT.md seção "Deploy Railway"
```

3. **Testar produção**:
```
https://salon-booking.com.br/dashboard/configuracoes/whatsapp
```

## 📞 Suporte

**Problemas persistentes?**
1. Verificar logs completos (`npm run dev`)
2. Verificar console do navegador (F12)
3. Checar pasta `.wppconnect/` (existe?)
4. Revisar `docs/MIGRACAO_WPPCONNECT.md`

---

**Boa sorte nos testes!** 🍀
