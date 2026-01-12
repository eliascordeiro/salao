# 🔐 Sistema Platform Admin - SalãoBlza

## 📋 Visão Geral

Sistema administrativo da plataforma SalãoBlza para controle total de todos os salões, usuários, assinaturas e métricas da plataforma.

## 🎯 Funcionalidades Implementadas

### ✅ Dashboard Principal (`/platform-admin`)
- **Overview completo da plataforma**
  - Total de salões (ativos/inativos)
  - Total de usuários (por role)
  - Assinaturas ativas
  - MRR (Monthly Recurring Revenue)
  - Estatísticas de agendamentos
  - Receita total processada (Stripe)
  - Cards de ações rápidas

### 🏪 Gestão de Salões (`/platform-admin/saloes`)
- Listar todos os salões da plataforma
- Busca por nome, email, cidade
- Filtrar por status (ativo/inativo)
- Ver informações do proprietário
- Contadores (profissionais, serviços, agendamentos)
- Ativar/Desativar salões
- API: `/api/platform/salons`

### 👥 Gestão de Usuários (`/platform-admin/usuarios`)
- Listar todos os usuários da plataforma
- Filtrar por role (ADMIN, CLIENT, PLATFORM_ADMIN)
- Filtrar por status (ativo/inativo)
- Ver estatísticas (agendamentos, salões)
- Ativar/Desativar usuários
- API: `/api/platform/users`

### 💳 Gestão de Assinaturas (`/platform-admin/assinaturas`)
- Listar todas as assinaturas
- Filtrar por status (ACTIVE, CANCELLED, PAST_DUE)
- Filtrar por plano (Essencial, Profissional)
- Ver histórico de pagamentos
- Informações do usuário e plano
- API: `/api/platform/subscriptions`

### 📊 Analytics (`/platform-admin/analytics`)
- Seletor de período (7d, 30d, 90d, 1y)
- Agendamentos por status
- Novos usuários por role
- Novos salões
- Receita do período
- Métricas de assinaturas:
  - MRR (Monthly Recurring Revenue)
  - Taxa de conversão (trial → pago)
  - Churn rate
  - Novas assinaturas
  - Assinaturas canceladas
- API: `/api/platform/analytics`

## 🔐 Autenticação e Permissões

### Role: `PLATFORM_ADMIN`

**Acesso exclusivo:**
- `/platform-admin/*` - Todas as rotas do dashboard da plataforma
- `/api/platform/*` - Todas as APIs administrativas

**Bloqueios:**
- Usuários com roles `ADMIN`, `CLIENT`, `STAFF`, `CUSTOM` são redirecionados
- Middleware verifica `session.user.role === "PLATFORM_ADMIN"`

### Credenciais Padrão

**Email:** `platform@salaoblza.com.br`  
**Senha:** `SuperAdmin2026!`

> ⚠️ **IMPORTANTE:** Altere a senha após primeiro login!

### Variáveis de Ambiente

```env
# .env
PLATFORM_ADMIN_EMAIL="platform@salaoblza.com.br"
PLATFORM_ADMIN_PASSWORD="SuperAdmin2026!"
```

## 📁 Estrutura de Arquivos

```
app/
├── (platform)/
│   └── platform-admin/
│       ├── layout.tsx           # Layout do dashboard
│       ├── page.tsx             # Overview principal
│       ├── saloes/              # Gestão de salões (TODO)
│       ├── usuarios/            # Gestão de usuários (TODO)
│       ├── assinaturas/         # Gestão de assinaturas (TODO)
│       ├── analytics/           # Analytics avançados (TODO)
│       ├── suporte/             # Tickets de suporte (TODO)
│       └── configuracoes/       # Configurações (TODO)
│
├── api/platform/
│   ├── salons/route.ts          # GET, PATCH - Gestão de salões
│   ├── users/route.ts           # GET, PATCH - Gestão de usuários
│   ├── subscriptions/route.ts   # GET - Gestão de assinaturas
│   └── analytics/route.ts       # GET - Métricas da plataforma
│
prisma/
├── schema.prisma                # User.role inclui "PLATFORM_ADMIN"
└── seed.ts                      # Seed com usuário PLATFORM_ADMIN

middleware.ts                    # Proteção de rotas /platform-admin
```

## 🚀 Como Usar

### 1. Desenvolvimento Local

```bash
# 1. Criar usuário PLATFORM_ADMIN
node create-platform-admin.js

# 2. Iniciar servidor
npm run dev

# 3. Acessar dashboard
# URL: http://localhost:3000/platform-admin
# Email: platform@salaoblza.com.br
# Senha: SuperAdmin2026!
```

### 2. Produção (Railway)

```bash
# 1. Configurar variáveis no Railway Dashboard
PLATFORM_ADMIN_EMAIL=platform@salaoblza.com.br
PLATFORM_ADMIN_PASSWORD=SuaSenhaSuperSegura123!

# 2. Após deploy, criar usuário via Railway Shell
railway run node create-platform-admin.js

# 3. Acessar via domínio
https://seu-app.up.railway.app/platform-admin
```

## 🎨 Design System

### Layout
- **Sidebar fixa** com navegação
- **Header** com logo e informações do admin
- **Cards glass-effect** para métricas
- **Ícones Lucide React**

### Cores
- **Purple/Pink gradient** para branding
- **Status colors:**
  - Verde: Ativo, Confirmado, Sucesso
  - Amarelo: Pendente, Trial
  - Vermelho: Inativo, Cancelado, Erro
  - Azul: Informações gerais

### Componentes
- `Card` (shadcn/ui)
- `Button` (shadcn/ui)
- Ícones: `lucide-react`

## 📊 APIs Disponíveis

### 1. GET `/api/platform/salons`
**Parâmetros de query:**
- `search` (string): Buscar por nome, email, cidade
- `status` (string): "active" | "inactive" | "all"
- `page` (number): Página atual
- `limit` (number): Itens por página

**Resposta:**
```json
{
  "salons": [...],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### 2. PATCH `/api/platform/salons`
**Body:**
```json
{
  "salonId": "salon-id",
  "active": true
}
```

### 3. GET `/api/platform/users`
**Parâmetros de query:**
- `search` (string): Buscar por nome, email
- `role` (string): "ADMIN" | "CLIENT" | "PLATFORM_ADMIN"
- `status` (string): "active" | "inactive"
- `page` (number)
- `limit` (number)

### 4. PATCH `/api/platform/users`
**Body:**
```json
{
  "userId": "user-id",
  "active": true
}
```

### 5. GET `/api/platform/subscriptions`
**Parâmetros de query:**
- `status` (string): "ACTIVE" | "CANCELLED" | "PAST_DUE"
- `planId` (string)
- `page` (number)
- `limit` (number)

### 6. GET `/api/platform/analytics`
**Parâmetros de query:**
- `period` (string): "7d" | "30d" | "90d" | "1y"

**Resposta:**
```json
{
  "period": "30d",
  "dateRange": { "start": "...", "end": "..." },
  "bookings": { "byStatus": [...] },
  "users": { "new": [...] },
  "salons": { "new": 5 },
  "revenue": { "total": 50000, "count": 120 },
  "subscriptions": {
    "active": 50,
    "new": 10,
    "cancelled": 2,
    "mrr": 4950,
    "conversionRate": 35.5,
    "churnRate": 4.2
  }
}
```

## 🔒 Segurança

### Proteção de Rotas
- Middleware verifica `role === "PLATFORM_ADMIN"`
- Redirecionamento automático para não-autorizados
- APIs retornam 401 Unauthorized

### Boas Práticas
1. **Alterar senha padrão** após primeiro acesso
2. **Usar HTTPS** em produção
3. **Não compartilhar credenciais**
4. **Rotacionar senhas** periodicamente
5. **Monitorar logs** de acesso

## 📝 Próximos Passos (TODO)

### Páginas a Implementar
- [ ] `/platform-admin/saloes` - Interface completa de gestão
- [ ] `/platform-admin/usuarios` - Interface completa de gestão
- [ ] `/platform-admin/assinaturas` - Interface completa de gestão
- [ ] `/platform-admin/analytics` - Gráficos e visualizações
- [ ] `/platform-admin/suporte` - Ver todos os tickets
- [ ] `/platform-admin/configuracoes` - Configurações globais

### Funcionalidades Avançadas
- [ ] Logs de auditoria (quem fez o quê)
- [ ] Notificações em tempo real
- [ ] Exportar relatórios em PDF/CSV
- [ ] Gráficos interativos (Recharts)
- [ ] Sistema de alertas (churn alto, falhas, etc)
- [ ] Backup e restore de dados
- [ ] Gestão de planos (criar, editar, deletar)
- [ ] Análise de cohort (retenção por período)
- [ ] Forecast de receita (ML opcional)

## 🎯 Métricas Principais

### KPIs Monitorados
1. **MRR** - Monthly Recurring Revenue
2. **Churn Rate** - Taxa de cancelamento
3. **Conversion Rate** - Trial → Pago
4. **ARR** - Annual Recurring Revenue
5. **LTV** - Lifetime Value (futuro)
6. **CAC** - Customer Acquisition Cost (futuro)

### Fórmulas
```
MRR = Σ(assinaturas ativas × preço do plano)
Churn Rate = (cancelamentos / total de assinaturas) × 100
Conversion Rate = (trials convertidos / total de trials) × 100
```

## 🆘 Troubleshooting

### Erro: "Unauthorized"
**Causa:** Usuário não tem role PLATFORM_ADMIN  
**Solução:**
```bash
# Atualizar role manualmente no banco
node create-platform-admin.js
```

### Não consigo acessar `/platform-admin`
**Causa:** Middleware bloqueando  
**Solução:** Verificar se está logado com credenciais corretas

### Dados não carregam
**Causa:** API retornando erro 500  
**Solução:** Verificar logs do servidor e conexão com banco

## 📚 Documentação Relacionada

- [Sistema de Assinaturas](./SISTEMA_ASSINATURAS_MERCADOPAGO.md)
- [Sistema de Permissões](./docs/SISTEMA_PERMISSOES.md)
- [Sistema Multi-Tenant](./docs/SISTEMA_MULTI_TENANT.md)
- [Guia de Deploy Railway](./GUIA_DEPLOY_RAILWAY.md)

---

**Última atualização:** 12/01/2026  
**Versão:** 1.0.0  
**Status:** ✅ Funcional (Overview completo)
