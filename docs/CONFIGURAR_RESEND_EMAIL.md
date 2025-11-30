# Como Configurar Email com Resend no Railway

## Problema
O Railway bloqueia portas SMTP (587, 465, 25) para prevenir spam. Por isso, o envio de emails via SMTP (Gmail, etc) não funciona no Railway.

## Solução: Resend
Resend é um serviço moderno de envio de emails via API (sem SMTP):
- ✅ **Grátis**: 3.000 emails/mês no plano free
- ✅ **Confiável**: Funciona perfeitamente em plataformas cloud
- ✅ **Simples**: API REST fácil de usar
- ✅ **Já implementado**: Código já preparado no projeto

## Passo a Passo

### 1. Criar Conta no Resend
1. Acesse: https://resend.com/signup
2. Crie sua conta (use o email da empresa)
3. Confirme seu email

### 2. Obter API Key
1. Após login, acesse: https://resend.com/api-keys
2. Clique em "Create API Key"
3. Nome: "AgendaSalão Production"
4. Permissões: "Sending access"
5. **Copie a chave** (começa com `re_...`)
   - ⚠️ Ela só aparece uma vez! Guarde bem.

### 3. Configurar no Railway
```bash
# No terminal local (onde você tem Railway CLI):
railway variables --set RESEND_API_KEY="re_SuaChaveAqui"
```

### 4. (Opcional) Usar Domínio Próprio
Por padrão, emails são enviados de `onboarding@resend.dev`.

Para usar seu domínio (ex: `noreply@agendasalao.com.br`):

1. No Resend, vá em **Domains**
2. Clique **Add Domain**
3. Digite: `agendasalao.com.br`
4. Adicione os registros DNS (TXT, MX, CNAME) no seu provedor de domínio
5. Aguarde verificação (~15 min)
6. Configure no Railway:
```bash
railway variables --set SMTP_FROM="AgendaSalão <noreply@agendasalao.com.br>"
```

Se não tiver domínio próprio, pode usar o padrão do Resend mesmo.

### 5. Deploy
```bash
# Fazer commit das alterações de código
git add .
git commit -m "feat: adicionar suporte a Resend para envio de emails"
git push origin main

# Deploy no Railway
railway up --detach
```

### 6. Testar
1. Acesse: https://salao-production.up.railway.app/dashboard/usuarios
2. Clique em "Adicionar Usuário"
3. Preencha os dados
4. Clique em "Enviar Convite"
5. Verifique se o email chegou! 🎉

## Verificar Logs
```bash
railway logs --tail 50 | grep -i "email\|resend"
```

Você deve ver:
```
📧 Usando Resend para enviar email...
✅ Email enviado via Resend: { id: 're_...' }
```

## Troubleshooting

### "Missing required fields"
- Verifique se RESEND_API_KEY está configurada no Railway
- Comando: `railway variables | grep RESEND`

### "Invalid API key"
- API key expirou ou foi deletada
- Crie uma nova em: https://resend.com/api-keys
- Configure novamente no Railway

### Email não chega
1. Verifique spam/lixeira
2. Se usar domínio próprio, confirme que DNS está configurado
3. Confira dashboard do Resend: https://resend.com/emails
   - Ele mostra todos os emails enviados e status

### Ainda quer usar SMTP?
SMTP só funciona localmente (desenvolvimento). Em produção no Railway, você **precisa** usar Resend ou similar (SendGrid, Mailgun, Postmark).

## Custos
| Plano | Emails/mês | Custo |
|-------|------------|-------|
| Free | 3.000 | $0 |
| Pro | 50.000 | $20/mês |
| Business | 100.000 | $80/mês |

Para um salão, o plano gratuito é mais que suficiente (3k emails = ~100 clientes convidados/mês).

## Documentação Oficial
- Resend Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference/emails/send-email
- Node.js SDK: https://github.com/resendlabs/resend-node
