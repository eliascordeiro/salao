# 💈 Sistema de Agendamento para Salões & Barbearias# 💈 AgendaSalão - Sistema de Agendamento para Salões & Barbearias



Sistema completo de gestão e agendamento online para salões de beleza e barbearias.Sistema completo de agendamento online desenvolvido com Next.js 14, TypeScript, Prisma e Tailwind CSS.



## 🚀 Tecnologias## 🚀 Tecnologias



- **Framework:** Next.js 14 (App Router)- **Framework**: Next.js 14 (App Router)

- **Linguagem:** TypeScript- **Linguagem**: TypeScript

- **Estilização:** Tailwind CSS + shadcn/ui- **Banco de Dados**: SQLite com Prisma ORM

- **Banco de Dados:** PostgreSQL- **Estilização**: Tailwind CSS

- **ORM:** Prisma 5.0- **Autenticação**: NextAuth.js

- **Autenticação:** NextAuth.js- **Componentes**: shadcn/ui

- **Pagamentos:** Stripe- **Ícones**: Lucide React

- **Email:** Nodemailer (SMTP)

- **Gráficos:** Recharts## 📋 Funcionalidades



## ✨ Funcionalidades### Para Clientes:

- ✅ Agendamento online 24/7

### Para Clientes- ✅ Visualização de serviços e preços

- 📅 Agendamento online de serviços- ✅ Escolha de profissional preferido

- 👤 Seleção de profissional preferido- ✅ Histórico de agendamentos

- ⏰ Visualização de horários disponíveis em tempo real- ✅ Lembretes automáticos

- 📧 Notificações por email (confirmação, lembretes)

- 💳 Pagamento online via Stripe### Para Administradores:

- 📱 Interface responsiva- ✅ Dashboard completo

- ✅ Gestão de profissionais

### Para Administradores- ✅ Catálogo de serviços

- 🏪 Gestão completa do salão- ✅ Controle de agendamentos

- 💇 CRUD de serviços (nome, duração, preço)- ✅ Relatórios e análises

- 👨‍💼 CRUD de profissionais- ✅ Gestão de clientes

- 📆 Gestão de agendamentos (confirmar, cancelar, completar)

- ⏱️ Configuração de horários por profissional## 🛠️ Instalação e Execução

- 🚫 Sistema de bloqueio de horários

- 📊 Dashboard com métricas e gráficos### Pré-requisitos

- 💰 Relatórios de receita e desempenho- Node.js 18.17.0+ instalado (versão mínima requerida pelo Next.js 14)

- 📈 Análise de serviços mais populares- npm ou yarn



## 🚀 Deploy na Railway> ⚠️ **Importante**: Se você estiver usando Node.js 18.13.0 ou inferior, será necessário atualizar para v18.17.0 ou superior.

> 

### 1. Criar conta na Railway> Para verificar sua versão: `node --version`

- Acesse: https://railway.app> 

- Faça login com GitHub> Para atualizar, visite: https://nodejs.org/



### 2. Criar novo projeto### Passos

- Clique em "New Project"

- Selecione "Deploy from GitHub repo"1. **Instale as dependências** (se ainda não instalou)

- Escolha este repositório```bash

npm install

### 3. Adicionar PostgreSQL```

- No projeto, clique em "+ New"

- Selecione "Database" → "PostgreSQL"2. **Configure as variáveis de ambiente**

- Railway criará automaticamente a variável `DATABASE_URL````bash

cp .env.example .env

### 4. Configurar variáveis de ambiente```

No painel de variáveis, adicione:

3. **Inicialize o banco de dados**

```env```bash

NEXTAUTH_SECRET=<gere com: openssl rand -base64 32>npx prisma generate

NEXTAUTH_URL=https://seu-app.up.railway.appnpx prisma db push

SMTP_HOST=smtp.gmail.com```

SMTP_PORT=587

SMTP_USER=seu-email@gmail.com4. **Execute o projeto em desenvolvimento**

SMTP_PASS=sua-senha-de-app```bash

EMAIL_FROM=Seu Salão <noreply@seusalao.com>npm run dev

STRIPE_SECRET_KEY=sk_...```

STRIPE_PUBLISHABLE_KEY=pk_...

STRIPE_WEBHOOK_SECRET=whsec_...Acesse: [http://localhost:3000](http://localhost:3000)

NODE_ENV=production

```## 📦 Scripts Disponíveis



### 5. Deploy automático```bash

- Railway detecta automaticamente o `railway.json`npm run dev        # Inicia servidor de desenvolvimento

- O deploy inicia automaticamentenpm run build      # Cria build de produção

- Migrations rodam no primeiro deploynpm run start      # Inicia servidor de produção

npm run lint       # Executa linter

### 6. Popular banco de dadosnpx prisma studio  # Abre interface visual do banco de dados

Após o primeiro deploy, execute via Railway CLI:```

```bash

railway run npm run db:seed## 🗂️ Estrutura do Projeto

```

```

## 📦 Instalação Localempresa_de_apps/

├── app/                    # Páginas e rotas (App Router)

```bash│   ├── page.tsx           # Página inicial (Landing Page)

# Clonar repositório│   ├── layout.tsx         # Layout global

git clone https://github.com/seu-usuario/sistema-agendamento-salao.git│   └── globals.css        # Estilos globais

cd sistema-agendamento-salao├── components/            # Componentes React reutilizáveis

│   └── ui/               # Componentes UI (Button, Card, etc)

# Instalar dependências├── lib/                  # Utilitários e configurações

npm install│   ├── prisma.ts        # Cliente Prisma

│   └── utils.ts         # Funções auxiliares

# Configurar variáveis de ambiente├── prisma/              # Schema e migrações do banco

cp .env.example .env│   └── schema.prisma    # Definição dos models

# Edite o .env com suas credenciais└── public/              # Arquivos estáticos

```

# Rodar migrations

npx prisma migrate dev## 🎨 Schema do Banco de Dados



# Popular banco com dados de exemplo### Models Principais:

npm run db:seed- **User**: Clientes e administradores

- **Salon**: Salões/barbearias

# Iniciar servidor de desenvolvimento- **Staff**: Profissionais (barbeiros, cabeleireiros)

npm run dev- **Service**: Serviços oferecidos

```- **Booking**: Agendamentos

- **ServiceStaff**: Relação entre serviços e profissionais

## 👤 Credenciais Padrão (após seed)

## 🎯 Roadmap

**Admin:**

- Email: admin@agendasalao.com.br- [x] Estrutura do projeto Next.js

- Senha: admin123- [x] Schema do banco de dados

- [x] Landing page

**Cliente:**- [x] Sistema de autenticação (NextAuth.js)

- Email: pedro@exemplo.com  - [x] Login

- Senha: cliente123  - [x] Registro

  - [x] Proteção de rotas

⚠️ **IMPORTANTE:** Altere estas senhas em produção!  - [x] Dashboard básico

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
