# 💈 AgendaSalão - Sistema de Agendamento para Salões & Barbearias

Sistema completo de agendamento online desenvolvido com Next.js 14, TypeScript, Prisma e Tailwind CSS.

## 🚀 Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: SQLite com Prisma ORM
- **Estilização**: Tailwind CSS
- **Autenticação**: NextAuth.js
- **Componentes**: shadcn/ui
- **Ícones**: Lucide React

## 📋 Funcionalidades

### Para Clientes:
- ✅ Agendamento online 24/7
- ✅ Visualização de serviços e preços
- ✅ Escolha de profissional preferido
- ✅ Histórico de agendamentos
- ✅ Lembretes automáticos

### Para Administradores:
- ✅ Dashboard completo
- ✅ Gestão de profissionais
- ✅ Catálogo de serviços
- ✅ Controle de agendamentos
- ✅ Relatórios e análises
- ✅ Gestão de clientes

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18.17.0+ instalado (versão mínima requerida pelo Next.js 14)
- npm ou yarn

> ⚠️ **Importante**: Se você estiver usando Node.js 18.13.0 ou inferior, será necessário atualizar para v18.17.0 ou superior.
> 
> Para verificar sua versão: `node --version`
> 
> Para atualizar, visite: https://nodejs.org/

### Passos

1. **Instale as dependências** (se ainda não instalou)
```bash
npm install
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

3. **Inicialize o banco de dados**
```bash
npx prisma generate
npx prisma db push
```

4. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Cria build de produção
npm run start      # Inicia servidor de produção
npm run lint       # Executa linter
npx prisma studio  # Abre interface visual do banco de dados
```

## 🗂️ Estrutura do Projeto

```
empresa_de_apps/
├── app/                    # Páginas e rotas (App Router)
│   ├── page.tsx           # Página inicial (Landing Page)
│   ├── layout.tsx         # Layout global
│   └── globals.css        # Estilos globais
├── components/            # Componentes React reutilizáveis
│   └── ui/               # Componentes UI (Button, Card, etc)
├── lib/                  # Utilitários e configurações
│   ├── prisma.ts        # Cliente Prisma
│   └── utils.ts         # Funções auxiliares
├── prisma/              # Schema e migrações do banco
│   └── schema.prisma    # Definição dos models
└── public/              # Arquivos estáticos
```

## 🎨 Schema do Banco de Dados

### Models Principais:
- **User**: Clientes e administradores
- **Salon**: Salões/barbearias
- **Staff**: Profissionais (barbeiros, cabeleireiros)
- **Service**: Serviços oferecidos
- **Booking**: Agendamentos
- **ServiceStaff**: Relação entre serviços e profissionais

## 🎯 Roadmap

- [x] Estrutura do projeto Next.js
- [x] Schema do banco de dados
- [x] Landing page
- [x] Sistema de autenticação (NextAuth.js)
  - [x] Login
  - [x] Registro
  - [x] Proteção de rotas
  - [x] Dashboard básico
- [ ] Dashboard administrativo completo
- [ ] Página de agendamento interativa
- [ ] Integração com WhatsApp
- [ ] Sistema de pagamento online
- [ ] Aplicativo mobile

---

**Desenvolvido com ❤️ para transformar salões em negócios digitais**

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
