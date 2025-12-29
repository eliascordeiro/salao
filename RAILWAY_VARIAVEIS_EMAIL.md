# 📧 Variáveis de Email para Railway

## Configuração SMTP no Railway

Para o sistema de **redefinição de senha** funcionar em produção, configure as seguintes variáveis no Railway:

### Variáveis Necessárias

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=agenda@salon-booking.com.br
SMTP_PASS=sua-senha-app-gmail
SMTP_FROM=AgendaSalão <agenda@salon-booking.com.br>
```

### ⚠️ Importante

1. **SMTP_FROM** deve usar o email `agenda@salon-booking.com.br` (já configurado no Railway)
2. O sistema de redefinição de senha usa essas variáveis automaticamente
3. Emails serão enviados de: `AgendaSalão <agenda@salon-booking.com.br>`

### 📝 Funcionalidades que Usam Email

- ✅ Redefinição de senha (`/api/auth/forgot-password`)
- ✅ Notificações de agendamentos (se configurado)
- ✅ Convites de usuários (sistema multi-usuário)

### 🔐 Segurança

- A senha do Gmail deve ser uma **"Senha de App"** (não a senha normal)
- Gere em: https://myaccount.google.com/apppasswords
- Requer autenticação em 2 fatores ativada

### ✅ Status Atual

- [x] APIs de redefinição de senha criadas
- [x] Templates de email HTML responsivos
- [x] Variáveis configuradas corretamente no código
- [ ] Confirmar que `agenda@salon-booking.com.br` está configurado no Railway

### 🧪 Teste

Após configurar no Railway:
1. Acesse: https://salon-booking.com.br/login
2. Clique em "Esqueceu a senha?"
3. Digite um email cadastrado
4. Verifique se o email chegou de `agenda@salon-booking.com.br`
