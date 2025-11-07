# 🏗️ Arquitetura Multi-Domínio - Monorepo

## Estratégia Recomendada: Route Groups do Next.js

### Por que Monorepo?
- ✅ Reutilização de código (70% já pronto)
- ✅ 1 banco de dados compartilhado
- ✅ 1 deploy Railway (economia)
- ✅ APIs compartilhadas
- ✅ Componentes reutilizáveis
- ✅ Fácil manutenção

---

## 📁 Estrutura de Diretórios (Reorganização)

```
app/
├── (marketing)/                    # www.agendasalao.com
│   ├── page.tsx                   # Landing page
│   ├── sobre/page.tsx
│   ├── contato/page.tsx
│   └── layout.tsx                 # Layout público
│
├── (admin)/                       # dashboard.agendasalao.com
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── servicos/
│   │   ├── profissionais/
│   │   ├── agendamentos/
│   │   ├── pagamentos/
│   │   ├── relatorios/
│   │   └── configuracoes/
│   ├── meu-salao/page.tsx
│   └── layout.tsx                # DashboardLayout
│
├── (client)/                      # app.agendasalao.com
│   ├── saloes/page.tsx           # Listagem
│   ├── salao/[id]/
│   │   ├── page.tsx              # Detalhes
│   │   └── agendar/page.tsx      # Agendamento
│   ├── meus-agendamentos/page.tsx
│   ├── perfil/page.tsx
│   └── layout.tsx                # ClientLayout
│
├── api/                          # Compartilhado
│   ├── auth/
│   ├── bookings/
│   ├── services/
│   ├── staff/
│   └── public/
│
└── cadastro-salao/page.tsx      # Público (onboarding)
```

### Nomenclatura Route Groups:
- `(marketing)` → Landing page pública
- `(admin)` → Dashboard proprietários
- `(client)` → Portal clientes

**Nota:** Parênteses `()` no Next.js 14 criam grupos de rotas sem afetar URL

---

## 🌐 Configuração de Domínios

### Railway (variáveis de ambiente)

```env
# Domínios configurados
NEXTAUTH_URL="https://dashboard.agendasalao.com"
ADMIN_DOMAIN="dashboard.agendasalao.com"
CLIENT_DOMAIN="app.agendasalao.com"
MARKETING_DOMAIN="www.agendasalao.com"
```

### Middleware (app/middleware.ts)

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;
  
  // 1. Dashboard (proprietários)
  if (hostname.includes("dashboard.agendasalao.com")) {
    // Apenas ADMIN pode acessar
    if (!pathname.startsWith("/dashboard") && 
        !pathname.startsWith("/meu-salao")) {
      return NextResponse.rewrite(new URL("/dashboard", request.url));
    }
  }
  
  // 2. Portal Cliente
  if (hostname.includes("app.agendasalao.com")) {
    // Redirecionar /dashboard para /saloes
    if (pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/saloes", request.url));
    }
  }
  
  // 3. Landing (www)
  if (hostname.includes("www.agendasalao.com")) {
    // Apenas rotas públicas
    const publicRoutes = ["/", "/sobre", "/contato", "/cadastro-salao"];
    if (!publicRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 🔀 Roteamento por Domínio

### Fluxo de Navegação

#### **Dashboard (Proprietários)**
- `dashboard.agendasalao.com` → Landing admin
- `dashboard.agendasalao.com/dashboard` → Dashboard
- `dashboard.agendasalao.com/meu-salao` → Gestão do salão
- `dashboard.agendasalao.com/dashboard/servicos` → CRUD serviços

#### **Portal (Clientes)**
- `app.agendasalao.com` → Redireciona para /saloes
- `app.agendasalao.com/saloes` → Listagem de salões
- `app.agendasalao.com/salao/[id]` → Detalhes do salão
- `app.agendasalao.com/meus-agendamentos` → Agendamentos do cliente

#### **Landing (Público)**
- `www.agendasalao.com` → Home marketing
- `www.agendasalao.com/cadastro-salao` → Onboarding proprietários
- `www.agendasalao.com/sobre` → Sobre a plataforma
- `www.agendasalao.com/contato` → Fale conosco

---

## 🚀 Plano de Migração (5 passos)

### ✅ Passo 1: Reorganizar estrutura atual
```bash
# Mover arquivos para route groups
app/dashboard/ → app/(admin)/dashboard/
app/saloes/ → app/(client)/saloes/
app/page.tsx → app/(marketing)/page.tsx
```

### ✅ Passo 2: Criar layouts específicos
- `app/(admin)/layout.tsx` → DashboardLayout (navbar admin)
- `app/(client)/layout.tsx` → ClientLayout (navbar cliente)
- `app/(marketing)/layout.tsx` → PublicLayout (navbar landing)

### ✅ Passo 3: Atualizar middleware
- Detectar domínio via headers
- Redirecionar rotas inadequadas
- Bloquear acesso cruzado

### ✅ Passo 4: Configurar Railway
- Adicionar 3 domínios customizados
- Atualizar variáveis de ambiente
- Configurar DNS (CNAME)

### ✅ Passo 5: Testar localmente
```bash
# Simular múltiplos domínios no /etc/hosts
127.0.0.1 dashboard.agendasalao.local
127.0.0.1 app.agendasalao.local
127.0.0.1 www.agendasalao.local
```

---

## 📊 Comparação Final

| Aspecto | Monorepo | Repos Separados |
|---------|----------|-----------------|
| Custo Railway | $5/mês | $10/mês |
| Banco de dados | 1 compartilhado | 2 ou API Bridge |
| Reuso de código | ✅ 100% | ❌ Duplicado |
| Manutenção | ✅ Simples | ❌ Complexa |
| Deploy | 1 pipeline | 2 pipelines |
| Aproveitamento atual | ✅ 70% pronto | ❌ Refazer tudo |

---

## 🎯 Decisão Recomendada

**MANTER MONOREPO** com Route Groups do Next.js 14

### Próximos Passos:
1. Reorganizar diretórios em route groups
2. Criar layouts específicos
3. Configurar middleware de domínios
4. Atualizar landing page
5. Configurar DNS no Railway

### Quando considerar separar?
- Se tiver 100k+ usuários simultâneos
- Se precisar escalar admin/client independentemente
- Se tiver times separados (admin team vs client team)

**Para MVP e crescimento inicial: Monorepo é PERFEITO! 🚀**
