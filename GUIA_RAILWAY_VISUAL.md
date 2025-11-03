# 🎯 GUIA VISUAL: Configurar PostgreSQL no Railway

## 📍 VOCÊ ESTÁ AQUI
O deploy falhou porque **o banco de dados PostgreSQL não está configurado**.

---

## 🚀 PASSO 1: Adicionar PostgreSQL

### No Railway Dashboard:

```
┌─────────────────────────────────────────┐
│  Railway Dashboard                      │
│  ┌───────────────────────────────────┐  │
│  │  Seu Projeto                      │  │
│  │  ┌──────────┐   ┌──────────┐     │  │
│  │  │ Next.js  │   │          │     │  │
│  │  │  App     │   │   ???    │ ← FALTA O BANCO
│  │  └──────────┘   └──────────┘     │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Ações:
1. Clique no botão **"+ New"** (canto superior direito)
2. Selecione **"Database"**
3. Escolha **"Add PostgreSQL"**

```
Depois de adicionar:

┌─────────────────────────────────────────┐
│  Seu Projeto                            │
│  ┌──────────┐   ┌──────────┐           │
│  │ Next.js  │   │PostgreSQL│ ← AGORA TEM!
│  │  App     │   │          │           │
│  └──────────┘   └──────────┘           │
└─────────────────────────────────────────┘
```

---

## 🔗 PASSO 2: Copiar DATABASE_URL

### Clique no card do **PostgreSQL**:

```
┌─────────────────────────────────────────────┐
│ PostgreSQL                                  │
├─────────────────────────────────────────────┤
│ Variables  Connect  Settings  Metrics      │
├─────────────────────────────────────────────┤
│                                             │
│ DATABASE_URL                         [Copy] │ ← CLIQUE AQUI
│ postgresql://postgres:ABC123@postgres...    │
│                                             │
│ PGHOST                                      │
│ postgres.railway.internal                   │
│                                             │
│ PGPASSWORD                                  │
│ ABC123XYZ789                                │
│                                             │
└─────────────────────────────────────────────┘
```

**O QUE COPIAR:**
```
postgresql://postgres:SuaSenhaAqui@postgres.railway.internal:5432/railway
```

---

## 🎯 PASSO 3: Adicionar na Aplicação

### Clique no card do **Next.js** (sua aplicação):

```
┌─────────────────────────────────────────────┐
│ salao (Next.js)                             │
├─────────────────────────────────────────────┤
│ Deployments  Variables  Settings  Metrics  │ ← CLIQUE EM "Variables"
├─────────────────────────────────────────────┤
│                                             │
│ [+ New Variable]  [Bulk Import]             │ ← CLIQUE EM "+ New Variable"
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Variable Name:                          ││
│ │ [DATABASE_URL________________]          ││ ← COLE "DATABASE_URL"
│ │                                         ││
│ │ Value:                                  ││
│ │ [postgresql://postgres:ABC123@...____] ││ ← COLE A URL COPIADA
│ │                                         ││
│ │        [Cancel]  [Add] ←─────────────────┤ CLIQUE EM "Add"
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

## ♻️ PASSO 4: Redeploy Automático

Após adicionar a variável, o Railway vai:

```
1. Detectar nova variável
   ↓
2. Iniciar novo deploy automaticamente
   ↓
3. Executar: npm install → build → start.sh
   ↓
4. start.sh vai:
   - Aguardar banco estar pronto (até 30 segundos)
   - Rodar migrations
   - Iniciar aplicação
```

---

## ✅ PASSO 5: Verificar Sucesso

### Nos logs, você deve ver:

```
🔍 Verificando conexão com o banco de dados...
✅ Conexão com banco estabelecida!
🔄 Executando migrations...
✅ Migrations aplicadas com sucesso!
🚀 Iniciando aplicação...

Listening on port 3000
```

### Se der certo:

```
┌─────────────────────────────────────────┐
│  Seu Projeto                            │
│  ┌──────────┐   ┌──────────┐           │
│  │ Next.js  │───│PostgreSQL│           │
│  │  App     │   │          │           │
│  │  ✅ OK   │   │  ✅ OK   │           │
│  └──────────┘   └──────────┘           │
│                                         │
│  🌐 https://salao-production-xxx...     │ ← SUA URL!
└─────────────────────────────────────────┘
```

---

## ❌ Se Ainda Não Funcionar

### Erro comum: "Can't reach database server"

**Possíveis causas:**

1. **DATABASE_URL não foi adicionada na aplicação**
   - Solução: Volte ao Passo 3

2. **DATABASE_URL está diferente entre PostgreSQL e App**
   - Solução: Delete a variável e adicione novamente

3. **Serviços estão em projetos diferentes**
   - Solução: Crie o PostgreSQL no MESMO projeto da app

### Como verificar:

```
App Variables deve ter:
DATABASE_URL = postgresql://postgres:SENHA@postgres.railway.internal:5432/railway
              └─────────────────┬─────────────────────────────────────────────┘
                         Deve ser exatamente igual
                                    ↓
PostgreSQL Variables mostra:
DATABASE_URL = postgresql://postgres:SENHA@postgres.railway.internal:5432/railway
```

---

## 🎉 Próximo Passo Após Sucesso

Quando o deploy der certo, você precisa configurar as outras variáveis:

```
NEXTAUTH_SECRET=seu-secret-gerado
NEXTAUTH_URL=https://sua-url-railway.up.railway.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Veja detalhes em: **VARIAVEIS_RAILWAY.md**

---

## 📞 Ficou preso em algum passo?

Compartilhe:
1. Em qual passo você está (1, 2, 3, 4 ou 5)
2. O que aparece nos logs (últimas 20 linhas)
3. Screenshot da aba "Variables" da sua aplicação
