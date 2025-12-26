# WhatsApp Troubleshooting - Baileys Nativo

## Problema Resolvido: Prisma P2025 "Record to update not found"

### Sintoma
```
❌ Erro ao salvar QR Code: PrismaClientKnownRequestError: 
Invalid `prisma.whatsAppSession.update()` invocation:
Record to update not found.
code: 'P2025'
```

### Causa Raiz
Race condition entre criação de credenciais e evento de QR Code:

1. `usePrismaAuthState()` carrega ou cria novas credenciais (pode ser assíncrono)
2. `WASocket` conecta ao WhatsApp Web
3. WhatsApp gera QR Code imediatamente (2-3 segundos)
4. `saveQRCode()` tenta fazer UPDATE no banco
5. **Erro**: Record ainda não existe (saveCreds async não completou)

### Solução
Usar `upsert()` ao invés de `update()` nas funções:
- `saveQRCode()` (linha ~143)
- `updateConnectionStatus()` (linha ~124)

**Código Correto:**
```typescript
// lib/whatsapp/baileys-auth-store.ts

export async function saveQRCode(salonId: string, qrCode: string) {
  try {
    await prisma.whatsAppSession.upsert({
      where: { salonId },
      create: {
        salonId,
        creds: '{}',
        keys: '{}',
        qrCode,
        connected: false
      },
      update: { qrCode }
    })
    console.log(`📱 QR Code salvo (salonId: ${salonId})`)
  } catch (error) {
    console.error('❌ Erro ao salvar QR Code:', error)
  }
}

export async function updateConnectionStatus(salonId: string, connected: boolean, phone?: string) {
  try {
    await prisma.whatsAppSession.upsert({
      where: { salonId },
      create: {
        salonId,
        creds: '{}',
        keys: '{}',
        connected,
        phone,
        lastConnected: connected ? new Date() : undefined
      },
      update: {
        connected,
        phone,
        lastConnected: connected ? new Date() : undefined
      }
    })
    console.log(`🔄 Status atualizado (salonId: ${salonId}, connected: ${connected})`)
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error)
  }
}
```

### Logs Antes vs Depois

**ANTES (com erro):**
```
📱 QR Code gerado (salonId: cmibxciqz0004of99js1m0ojh)
❌ Erro ao salvar QR Code: PrismaClientKnownRequestError: Record to update not found
```

**DEPOIS (funcionando):**
```
📱 QR Code gerado (salonId: cmibxciqz0004of99js1m0ojh)
📱 QR Code salvo (salonId: cmibxciqz0004of99js1m0ojh)
✅ QR Code disponível (salonId: cmibxciqz0004of99js1m0ojh)
```

---

## Problema: Erro 515 "Stream Errored" após scanear QR Code

### Sintoma
```
{"msg":"pairing configured successfully, expect to restart the connection..."}
{"fullErrorNode":{"tag":"stream:error","attrs":{"code":"515"}},"msg":"stream errored out"}
Error: Stream Errored (restart required)
```

### Causa Raiz
Credenciais antigas/corrompidas no banco de dados após múltiplas tentativas de conexão.

### Solução
1. Deletar sessão WhatsApp do banco:
```sql
DELETE FROM "WhatsAppSession" WHERE "salonId" = 'seu-salon-id';
```

2. Ou via Prisma CLI:
```bash
npx prisma db execute --stdin <<< "DELETE FROM \"WhatsAppSession\" WHERE \"salonId\" = 'cmibxciqz0004of99js1m0ojh';"
```

3. Limpar cache do Next.js:
```bash
rm -rf .next
```

4. Reiniciar servidor e tentar nova conexão com QR Code fresco

### Como Evitar
- Sempre limpar sessão ao detectar erro 401 (Connection Failure)
- Implementar auto-cleanup de credenciais corrompidas
- Não reusar credenciais após erro 515

---

## Problema: Webpack Cache não reflete mudanças no código

### Sintoma
Código alterado, mas erros antigos persistem nos logs.

### Causa
Next.js usa cache webpack intensivo. Mudanças em arquivos dentro de `lib/` podem não recompilar.

### Solução
```bash
rm -rf .next
npm run dev
```

Ou no desenvolvimento:
- Reiniciar servidor (Ctrl+C → npm run dev)
- Forçar hot-reload salvando um arquivo de rota (app/api/*/route.ts)

---

## Checklist de Debugging

Ao depurar problemas de conexão WhatsApp:

1. ✅ Verificar logs do terminal (não só do navegador)
2. ✅ Procurar por `📱 QR Code salvo` (confirma upsert funcionando)
3. ✅ Verificar se há erros P2025 (significa update em vez de upsert)
4. ✅ Limpar sessões antigas do banco se erro 515
5. ✅ Limpar `.next/` se mudanças não refletirem
6. ✅ Confirmar que Baileys gera QR (msg "QR Code gerado")
7. ✅ Verificar se SSE recebe QR (frontend mostra imagem)
8. ✅ Após scanear, aguardar "pairing configured successfully"
9. ✅ Se erro 401/515 após parear, deletar sessão e recomeçar
10. ✅ Verificar database com `SELECT * FROM "WhatsAppSession"`

---

## Comandos Úteis

**Ver sessões no banco:**
```bash
npx prisma studio
# ou
psql postgresql://usuario:senha@host:5432/salon_booking -c 'SELECT * FROM "WhatsAppSession";'
```

**Deletar todas as sessões:**
```sql
DELETE FROM "WhatsAppSession";
```

**Deletar sessão específica:**
```sql
DELETE FROM "WhatsAppSession" WHERE "salonId" = 'seu-id';
```

**Limpar cache Next.js:**
```bash
rm -rf .next
```

**Logs em tempo real:**
```bash
npm run dev | grep "📱\|❌\|✅"
```

---

## Status Atual

✅ **Problema P2025:** RESOLVIDO (commit: fix P2025 usando upsert)
✅ **QR Code salva no banco:** FUNCIONANDO
✅ **SSE entrega QR Code:** FUNCIONANDO
⏳ **Conexão WhatsApp:** PARCIAL (scaneia QR mas desconecta com erro 515)

**Próximo Passo:** Testar com sessão limpa e QR Code fresco.
