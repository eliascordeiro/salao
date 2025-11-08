# 💈 AgendaSalão - Sistema de Agendamento Profissional# 💈 Sistema de Agendamento para Salões & Barbearias# 💈 AgendaSalão - Sistema de Agendamento para Salões & Barbearias



> Sistema completo de agendamento online com **Railway Theme** para salões de beleza e barbearias



[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)Sistema completo de gestão e agendamento online para salões de beleza e barbearias.Sistema completo de agendamento online desenvolvido com Next.js 14, TypeScript, Prisma e Tailwind CSS.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com/)

[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748)](https://www.prisma.io/)

[![Railway Theme](https://img.shields.io/badge/Theme-Railway-7C3AED)](./docs/TEMA_RAILWAY_COMPLETO.md)## 🚀 Tecnologias## 🚀 Tecnologias



---



## 🎨 Railway Theme- **Framework:** Next.js 14 (App Router)- **Framework**: Next.js 14 (App Router)



Sistema de design moderno com **glassmorphism**, **gradientes vibrantes** e **animações suaves** aplicado em 100% das páginas client-facing.- **Linguagem:** TypeScript- **Linguagem**: TypeScript



### Características do Tema:- **Estilização:** Tailwind CSS + shadcn/ui- **Banco de Dados**: SQLite com Prisma ORM

- ✨ **Glassmorphism** - Efeito de vidro com blur e transparência

- 🎨 **Gradientes Vibrantes** - Primary (Roxo→Azul), Accent (Rosa→Laranja), Success (Verde→Ciano)- **Banco de Dados:** PostgreSQL- **Estilização**: Tailwind CSS

- 🌟 **Glow Effects** - Brilhos suaves ao hover

- 🎬 **7 Animações CSS** - fadeInUp, pulseGlow, float, shimmer, gradient, slideInLeft, scaleIn- **ORM:** Prisma 5.0- **Autenticação**: NextAuth.js

- 🌙 **Dark Mode Nativo** - Tema escuro elegante por padrão

- 📱 **100% Responsivo** - Mobile, Tablet e Desktop- **Autenticação:** NextAuth.js- **Componentes**: shadcn/ui



📖 **[Documentação Completa do Tema Railway](./docs/TEMA_RAILWAY_COMPLETO.md)**  - **Pagamentos:** Stripe- **Ícones**: Lucide React

📖 **[Guia Rápido de Referência](./docs/RAILWAY_QUICK_REFERENCE.md)**

- **Email:** Nodemailer (SMTP)

---

- **Gráficos:** Recharts## 📋 Funcionalidades

## 🚀 Tecnologias



- **Next.js 14** - App Router com Server/Client Components

- **TypeScript 5.0** - Type-safe development## ✨ Funcionalidades### Para Clientes:

- **Tailwind CSS 3.4** - Utility-first styling

- **Railway UI Components** - GlassCard, GradientButton, AnimatedText, GridBackground- ✅ Agendamento online 24/7

- **Prisma ORM 5.0** - Type-safe database access

- **PostgreSQL** - Banco de dados relacional### Para Clientes- ✅ Visualização de serviços e preços

- **NextAuth.js** - Autenticação e sessões

- **Stripe** - Pagamentos online- 📅 Agendamento online de serviços- ✅ Escolha de profissional preferido

- **Nodemailer** - Envio de emails (SMTP)

- **Recharts** - Gráficos e visualizações- 👤 Seleção de profissional preferido- ✅ Histórico de agendamentos



---- ⏰ Visualização de horários disponíveis em tempo real- ✅ Lembretes automáticos



## ✨ Funcionalidades- 📧 Notificações por email (confirmação, lembretes)



### 👥 Para Clientes- 💳 Pagamento online via Stripe### Para Administradores:



- 📅 **Agendamento Online Completo** - Fluxo em 4 etapas (Serviço → Profissional → Data/Hora → Confirmação)- 📱 Interface responsiva- ✅ Dashboard completo

- 💳 **Pagamentos Online** - Checkout seguro via Stripe

- 📧 **Notificações por Email** - Confirmação, Lembretes 24h antes, Status de Pagamento- ✅ Gestão de profissionais

- 📱 **Gestão de Agendamentos** - Visualizar, Cancelar, Pagar (Próximos/Anteriores/Cancelados)

- 🎨 **Interface Moderna** - Railway Theme com glassmorphism e animações### Para Administradores- ✅ Catálogo de serviços



### 🔧 Para Administradores- 🏪 Gestão completa do salão- ✅ Controle de agendamentos



- 📊 **Dashboard Avançado** - Métricas, Gráficos, Comparação de Períodos- 💇 CRUD de serviços (nome, duração, preço)- ✅ Relatórios e análises

- 📈 **Relatórios e Analytics** - 4 tipos de análises com exportação CSV

- 💼 **Gestão de Serviços** - CRUD completo, Preços, Duração, Categorias- 👨‍💼 CRUD de profissionais- ✅ Gestão de clientes

- 👨‍💼 **Gestão de Profissionais** - CRUD completo, Horários, Especialidades

- 📅 **Gestão de Agendamentos** - Visualização completa, Filtros, Alteração de Status- 📆 Gestão de agendamentos (confirmar, cancelar, completar)

- 💰 **Painel de Pagamentos** - Estatísticas, Histórico, Status detalhado

- ⏱️ Configuração de horários por profissional## 🛠️ Instalação e Execução

---

- 🚫 Sistema de bloqueio de horários

## 🎨 Componentes Railway

- 📊 Dashboard com métricas e gráficos### Pré-requisitos

### GlassCard

```tsx- 💰 Relatórios de receita e desempenho- Node.js 18.17.0+ instalado (versão mínima requerida pelo Next.js 14)

<GlassCard hover glow="primary" className="p-8">

  Conteúdo- 📈 Análise de serviços mais populares- npm ou yarn

</GlassCard>

```



### GradientButton## 🚀 Deploy na Railway> ⚠️ **Importante**: Se você estiver usando Node.js 18.13.0 ou inferior, será necessário atualizar para v18.17.0 ou superior.

```tsx

<GradientButton variant="primary">> 

  Ação

</GradientButton>### 1. Criar conta na Railway> Para verificar sua versão: `node --version`

```

- Acesse: https://railway.app> 

### AnimatedText

```tsx- Faça login com GitHub> Para atualizar, visite: https://nodejs.org/

<AnimatedText gradient="primary">

  Título Animado

</AnimatedText>

```### 2. Criar novo projeto### Passos



### GridBackground- Clique em "New Project"

```tsx

<GridBackground>- Selecione "Deploy from GitHub repo"1. **Instale as dependências** (se ainda não instalou)

  <div>Conteúdo da página</div>

</GridBackground>- Escolha este repositório```bash

```

npm install

📖 **[Ver Guia Completo de Componentes](./docs/RAILWAY_QUICK_REFERENCE.md)**

### 3. Adicionar PostgreSQL```

---

- No projeto, clique em "+ New"

## 📊 Páginas Implementadas

- Selecione "Database" → "PostgreSQL"2. **Configure as variáveis de ambiente**

| Página | Rota | Tema Railway | Descrição |

|--------|------|--------------|-----------|- Railway criará automaticamente a variável `DATABASE_URL````bash

| 🏠 Landing Page | `/` | ✅ | Hero, Features, Stats, CTA |

| 📊 Dashboard | `/dashboard` | ✅ | Métricas, Gráficos, Quick Actions |cp .env.example .env

| 💼 Serviços | `/servicos` | ✅ | Catálogo com filtros |

| 📅 Meus Agendamentos | `/meus-agendamentos` | ✅ | Histórico e gestão |### 4. Configurar variáveis de ambiente```

| 🎯 Agendar | `/agendar` | ✅ | Fluxo 4 etapas |

| 💳 Checkout | `/agendar/checkout/[id]` | ✅ | Resumo e pagamento |No painel de variáveis, adicione:



---3. **Inicialize o banco de dados**



## 🚀 Como Executar```env```bash



### Pré-requisitosNEXTAUTH_SECRET=<gere com: openssl rand -base64 32>npx prisma generate

- Node.js 18.17.0+

- PostgreSQL (ou SQLite para desenvolvimento)NEXTAUTH_URL=https://seu-app.up.railway.appnpx prisma db push

- Conta Stripe (para pagamentos)

- Servidor SMTP (para emails)SMTP_HOST=smtp.gmail.com```



### 1. Clone e InstaleSMTP_PORT=587

```bash

git clone https://github.com/eliascordeiro/salao.gitSMTP_USER=seu-email@gmail.com4. **Execute o projeto em desenvolvimento**

cd salao

npm installSMTP_PASS=sua-senha-de-app```bash

```

EMAIL_FROM=Seu Salão <noreply@seusalao.com>npm run dev

### 2. Configure `.env`

```envSTRIPE_SECRET_KEY=sk_...```

DATABASE_URL="postgresql://user:password@localhost:5432/agendasalao"

NEXTAUTH_SECRET="sua-chave-secreta"STRIPE_PUBLISHABLE_KEY=pk_...

NEXTAUTH_URL="http://localhost:3000"

STRIPE_SECRET_KEY="sk_test_..."STRIPE_WEBHOOK_SECRET=whsec_...Acesse: [http://localhost:3000](http://localhost:3000)

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

STRIPE_WEBHOOK_SECRET="whsec_..."NODE_ENV=production

EMAIL_HOST="smtp.gmail.com"

EMAIL_PORT="587"```## 📦 Scripts Disponíveis

EMAIL_USER="seu-email@gmail.com"

EMAIL_PASSWORD="sua-senha-app"

EMAIL_FROM="AgendaSalão <noreply@agendasalao.com>"

```### 5. Deploy automático```bash



### 3. Configure o Banco- Railway detecta automaticamente o `railway.json`npm run dev        # Inicia servidor de desenvolvimento

```bash

npx prisma migrate dev- O deploy inicia automaticamentenpm run build      # Cria build de produção

npm run db:seed:local

```- Migrations rodam no primeiro deploynpm run start      # Inicia servidor de produção



### 4. Inicie o Servidornpm run lint       # Executa linter

```bash

npm run dev### 6. Popular banco de dadosnpx prisma studio  # Abre interface visual do banco de dados

```

Após o primeiro deploy, execute via Railway CLI:```

Acesse: **http://localhost:3000**

```bash

---

railway run npm run db:seed## 🗂️ Estrutura do Projeto

## 🔐 Credenciais de Teste

```

**Administrador:**  

Email: `admin@agendasalao.com.br`  ```

Senha: `admin123`

## 📦 Instalação Localempresa_de_apps/

**Cliente:**  

Email: `pedro@exemplo.com`  ├── app/                    # Páginas e rotas (App Router)

Senha: `cliente123`

```bash│   ├── page.tsx           # Página inicial (Landing Page)

**Stripe (Teste):**  

Cartão: `4242 4242 4242 4242`# Clonar repositório│   ├── layout.tsx         # Layout global



---git clone https://github.com/seu-usuario/sistema-agendamento-salao.git│   └── globals.css        # Estilos globais



## 📚 Documentaçãocd sistema-agendamento-salao├── components/            # Componentes React reutilizáveis



- 📖 [Documentação Completa do Tema Railway](./docs/TEMA_RAILWAY_COMPLETO.md)│   └── ui/               # Componentes UI (Button, Card, etc)

- 📖 [Guia Rápido de Referência](./docs/RAILWAY_QUICK_REFERENCE.md)

- 📖 [Copilot Instructions](.github/copilot-instructions.md)# Instalar dependências├── lib/                  # Utilitários e configurações



---npm install│   ├── prisma.ts        # Cliente Prisma



## 📈 Performance│   └── utils.ts         # Funções auxiliares



- ⚡ **Server Components** por padrão (Next.js 14)# Configurar variáveis de ambiente├── prisma/              # Schema e migrações do banco

- ⚡ **Code Splitting** automático

- ⚡ **Image Optimization** com next/imagecp .env.example .env│   └── schema.prisma    # Definição dos models

- ⚡ **Font Optimization** com next/font

- ⚡ **CSS Optimizado** (Tailwind JIT)# Edite o .env com suas credenciais└── public/              # Arquivos estáticos



---```



## 🔒 Segurança# Rodar migrations



- ✅ Autenticação JWT via NextAuth.jsnpx prisma migrate dev## 🎨 Schema do Banco de Dados

- ✅ Proteção de rotas com middleware

- ✅ Criptografia de senhas (bcrypt)

- ✅ Validação de dados no backend

- ✅ CSRF protection (Next.js nativo)# Popular banco com dados de exemplo### Models Principais:

- ✅ Webhooks assinados (Stripe)

npm run db:seed- **User**: Clientes e administradores

---

- **Salon**: Salões/barbearias

## 📱 Responsividade

# Iniciar servidor de desenvolvimento- **Staff**: Profissionais (barbeiros, cabeleireiros)

✅ Testado em:

- 📱 Mobile (375px+)npm run dev- **Service**: Serviços oferecidos

- 📱 Tablet (768px+)

- 💻 Desktop (1024px+)```- **Booking**: Agendamentos

- 🖥️ Large Desktop (1280px+)

- **ServiceStaff**: Relação entre serviços e profissionais

---

## 👤 Credenciais Padrão (após seed)

## 🙏 Agradecimentos

## 🎯 Roadmap

- [Next.js](https://nextjs.org/) - Framework React

- [Tailwind CSS](https://tailwindcss.com/) - Utility CSS**Admin:**

- [Prisma](https://www.prisma.io/) - ORM moderno

- [Stripe](https://stripe.com/) - Pagamentos- Email: admin@agendasalao.com.br- [x] Estrutura do projeto Next.js

- [shadcn/ui](https://ui.shadcn.com/) - Componentes base

- [Lucide React](https://lucide.dev/) - Ícones- Senha: admin123- [x] Schema do banco de dados

- [Railway Design System](./docs/TEMA_RAILWAY_COMPLETO.md) - Tema visual

- [x] Landing page

---

**Cliente:**- [x] Sistema de autenticação (NextAuth.js)

<div align="center">

- Email: pedro@exemplo.com  - [x] Login

**💜 Desenvolvido com Railway Design System**

- Senha: cliente123  - [x] Registro

⭐ Se este projeto te ajudou, considere dar uma estrela!

  - [x] Proteção de rotas

[Documentação](./docs/TEMA_RAILWAY_COMPLETO.md) • [Guia Rápido](./docs/RAILWAY_QUICK_REFERENCE.md) • [Demo](https://salao.vercel.app)

⚠️ **IMPORTANTE:** Altere estas senhas em produção!  - [x] Dashboard básico

</div>

- [ ] Dashboard administrativo completo

## 📧 Sistema de Notificações- [ ] Página de agendamento interativa

- [ ] Integração com WhatsApp

Emails automáticos enviados em:- [ ] Sistema de pagamento online

- ✅ Criação de agendamento (PENDING)- [ ] Aplicativo mobile

- ✅ Confirmação de agendamento (CONFIRMED)

- ❌ Cancelamento de agendamento---

- ⏰ Lembrete 24h antes

- 💳 Confirmação de pagamento**Desenvolvido com ❤️ para transformar salões em negócios digitais**



## 💳 Pagamentos com Stripe## Deploy on Vercel



### Modo TesteThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Cartão de teste: `4242 4242 4242 4242`

- Qualquer CVC (3 dígitos)Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- Qualquer data futura

### Modo Produção
1. Crie conta no Stripe: https://stripe.com
2. Configure webhooks apontando para: `https://seu-dominio.com/api/webhooks/stripe`
3. Use as chaves de produção no `.env`

## 📄 Licença

MIT License - Sinta-se livre para usar este projeto!

---

⭐ Se este projeto foi útil, considere dar uma estrela!
