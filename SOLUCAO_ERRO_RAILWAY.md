# 🚨 SOLUÇÃO RÁPIDA: Erro 500 no Railway

## ❌ Erro Reportado

```
Application error: a client-side exception has occurred
Failed to load resource: the server responded with a status of 500 ()
TypeError: y.map is not a function
```

**Rota:** `https://salao-production.up.railway.app/dashboard/profissionais/novo`

---

## 🔍 Diagnóstico

O erro acontece porque:

1. ✅ **Código corrigido** - Validação de arrays implementada
2. ❌ **Banco vazio** - Railway não tem dados iniciais (salões, profissionais, etc.)
3. ❌ **Migrações pendentes** - Pode não ter aplicado as 3 migrações

---

## ✅ SOLUÇÃO COMPLETA (3 Passos)

### Passo 1: Aplicar Migrações

```bash
# Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# Login
railway login

# Vincular projeto
railway link

# Aplicar migrações
railway run npx prisma migrate deploy
```

**Resultado esperado:**
```
The following migration(s) have been applied:
  └─ 20251102000000_init
  └─ 20251104222817_add_reason_and_created_by_to_availability
  └─ 20251106225716_add_booking_type_to_salon

All migrations have been successfully applied.
```

---

### Passo 2: Popular Banco com Dados Iniciais

```bash
# Executar script de seed
railway run npx tsx scripts/seed-railway.ts
```

**Resultado esperado:**
```
🌱 Populando banco de dados Railway...

✅ Admin criado: admin@agendasalao.com.br
✅ Salão criado: Salão Exemplo
✅ Profissionais criados:
   - João Silva (Cortes Masculinos)
   - Maria Santos (Manicure e Pedicure)
✅ Serviços criados:
   - Corte Masculino (30min - R$ 35)
   - Manicure (45min - R$ 30)
   - Barba (20min - R$ 25)
✅ Cliente criado: pedro@exemplo.com

📊 RESUMO DO BANCO:
👥 Usuários:       2
🏢 Salões:         1
👨‍💼 Profissionais: 2
💇 Serviços:       3
📅 Agendamentos:   0

✅ Banco populado com sucesso!

🔑 Credenciais:
   Admin:   admin@agendasalao.com.br / admin123
   Cliente: pedro@exemplo.com / cliente123
```

---

### Passo 3: Verificar e Testar

```bash
# Verificar status do banco
railway run npx tsx scripts/check-railway-db.ts

# Verificar logs
railway logs --follow
```

**Testar na web:**
1. Acessar: `https://salao-production.up.railway.app`
2. Fazer login: `admin@agendasalao.com.br` / `admin123`
3. Ir em: Dashboard → Profissionais → Novo Profissional
4. **Deve funcionar sem erros!** ✅

---

## 🎯 Comando Único (Rápido)

Se você já tem Railway CLI instalado e vinculado:

```bash
railway run npx prisma migrate deploy && \
railway run npx tsx scripts/seed-railway.ts && \
railway run npx tsx scripts/check-railway-db.ts
```

Isso vai:
1. ✅ Aplicar migrações
2. ✅ Popular banco
3. ✅ Verificar status

**Tempo:** ~2 minutos ⚡

---

## 🔧 O Que Foi Corrigido no Código?

### Antes (com erro):
```typescript
const response = await fetch("/api/salons");
const data = await response.json();
setSalons(data); // ❌ Se data for { error: "..." }, dá erro no .map()
```

### Depois (corrigido):
```typescript
const response = await fetch("/api/salons");

if (!response.ok) {
  console.error("Erro ao carregar salões:", response.status);
  setSalons([]); // ✅ Array vazio
  return;
}

const data = await response.json();

if (Array.isArray(data)) {
  setSalons(data); // ✅ Só atribui se for array
} else {
  console.error("Resposta inválida:", data);
  setSalons([]); // ✅ Fallback
}
```

**Arquivos corrigidos:**
- `app/dashboard/profissionais/novo/page.tsx`
- `app/dashboard/profissionais/[id]/editar/page.tsx`
- `app/dashboard/servicos/novo/page.tsx`
- `app/dashboard/servicos/[id]/editar/page.tsx`

---

## 📊 Status Atual

| Item | Status |
|------|--------|
| Código corrigido | ✅ Sim (commit 5dd3fb5) |
| Enviado para GitHub | ✅ Sim |
| Railway atualizado | ❓ Aguardando deploy |
| Migrações aplicadas | ❓ Precisa executar |
| Banco populado | ❌ Precisa executar seed |

---

## 🆘 Troubleshooting

### Erro: "railway: command not found"
```bash
npm install -g @railway/cli
```

### Erro: "Project not found"
```bash
railway link
# Selecione o projeto "salao"
```

### Erro: "Failed to connect to database"
```bash
# Verificar DATABASE_URL
railway variables | grep DATABASE_URL

# Reiniciar service
railway restart
```

### Erro: "Migration already applied"
✅ Tudo certo! Pule para o Passo 2 (seed)

---

## 📝 Checklist Final

Execute e marque cada item:

- [ ] Railway CLI instalado
- [ ] Login feito (`railway login`)
- [ ] Projeto vinculado (`railway link`)
- [ ] Migrações aplicadas (`railway run npx prisma migrate deploy`)
- [ ] Banco populado (`railway run npx tsx scripts/seed-railway.ts`)
- [ ] Status verificado (`railway run npx tsx scripts/check-railway-db.ts`)
- [ ] Testado no navegador (login + criar profissional)
- [ ] Sem erros 500 ✅

---

## 🎉 Próximos Passos Após Correção

Depois que tudo funcionar:

1. ✅ Testar todas as páginas do dashboard
2. ✅ Criar serviços e profissionais adicionais
3. ✅ Fazer agendamentos de teste
4. ✅ Configurar horários dos profissionais
5. ✅ Testar sistema de pagamentos (modo teste)

---

## 📚 Documentos Relacionados

- 📄 `RAILWAY_STATUS.txt` - Status geral
- 📋 `docs/CHECKLIST_RAILWAY.md` - Checklist completo
- 🚂 `docs/RAILWAY_COMMANDS.md` - Comandos úteis
- ⚙️ `scripts/check-railway-db.ts` - Verificação
- 🌱 `scripts/seed-railway.ts` - Popular banco

---

**Criado em:** 07/11/2025  
**Commit da correção:** 5dd3fb5  
**Próximo passo:** Executar os 3 comandos acima! 🚀
