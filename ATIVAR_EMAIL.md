# 🚀 GUIA RÁPIDO: Ativar Envio de Emails

## ⚠️ Problema Atual
O Railway **bloqueia portas SMTP** (587, 465). Por isso emails não funcionam com Gmail/SMTP tradicional.

## ✅ Solução Implementada
Integração com **Resend** (serviço moderno via API):
- 🆓 Grátis até 3.000 emails/mês
- ⚡ Funciona perfeitamente no Railway
- 🔧 Já está no código, só falta configurar

---

## 📋 PASSO A PASSO (5 minutos)

### 1️⃣ Criar Conta Resend
```
1. Abra: https://resend.com/signup
2. Crie conta com seu email
3. Confirme o email
```

### 2️⃣ Obter API Key
```
1. Login em: https://resend.com
2. Menu lateral: "API Keys"
3. Botão: "Create API Key"
   - Nome: AgendaSalão Production
   - Permissão: Sending access
4. 📋 COPIE a chave (começa com "re_...")
   ⚠️ Ela só aparece UMA VEZ!
```

### 3️⃣ Configurar no Railway
No seu terminal (onde tem Railway CLI instalado):

```bash
railway variables --set RESEND_API_KEY="re_SuaChaveAqui"
```

**Pronto!** O sistema já vai usar automaticamente. ✨

### 4️⃣ Testar (após ~2 min)
```
1. Acesse: https://salao-production.up.railway.app/dashboard/usuarios
2. Clique "Adicionar Usuário"
3. Preencha dados
4. Clique "Enviar Convite"
5. ✅ Email deve chegar!
```

---

## 📊 Verificar se Funcionou

### Ver logs em tempo real:
```bash
railway logs --tail 50 | grep -i "email\|resend"
```

### ✅ Log de SUCESSO:
```
📧 Usando Resend para enviar email...
✅ Email enviado via Resend: { id: 're_abc123...' }
```

### ❌ Log de ERRO (falta configurar):
```
⚠️ Email não configurado. Configure RESEND_API_KEY
```

---

## 🎯 Resumo

| Item | Status | Ação |
|------|--------|------|
| Código | ✅ Pronto | Já no sistema |
| Biblioteca | ✅ Instalada | `npm install resend` |
| Configuração | ⏳ **FALTA** | Configure RESEND_API_KEY |

**Você só precisa fazer:** Passos 1, 2 e 3 acima (5 min)

---

## 🆘 Problemas?

### Email não chegou?
1. Confira SPAM/Lixeira
2. Veja dashboard: https://resend.com/emails
3. Verifique logs: `railway logs`

### "Invalid API key"?
- API key errada ou expirou
- Crie nova em: https://resend.com/api-keys
- Configure novamente

### Quer usar domínio próprio?
Veja: `docs/CONFIGURAR_RESEND_EMAIL.md` (seção "Usar Domínio Próprio")

---

## 💰 Custos
- **Free**: 3.000 emails/mês (suficiente para ~100 convites/mês)
- **Pro**: $20/mês (50k emails)

Para 99% dos salões, o plano FREE é suficiente.

---

## 📚 Documentação Completa
Ver: `docs/CONFIGURAR_RESEND_EMAIL.md`
