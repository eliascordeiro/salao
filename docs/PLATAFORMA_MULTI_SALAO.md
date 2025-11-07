# Plataforma Multi-Salão - Arquitetura

## 🎯 Visão Geral

Transformar o sistema atual em uma **plataforma marketplace** onde:
- **Proprietários** se cadastram, gerenciam seus salões
- **Clientes** escolhem entre vários salões e agendam

---

## 🌐 Estrutura de URLs

### 1. **Landing Page (Marketing)**
**URL:** `https://www.agendasalao.com` ou `https://agendasalao.com`

**Objetivo:** Apresentar a plataforma para ambos os públicos

**Conteúdo:**
- Hero: "Encontre o salão perfeito para você"
- CTA principal (grande): **"Buscar Salões"** → Leva para `/saloes`
- CTA secundário: **"Cadastre seu Salão"** → Leva para `/cadastro-salao`
- Seção: Como funciona (para clientes)
- Seção: Como funciona (para proprietários)
- Depoimentos de salões parceiros
- Footer com links úteis

---

### 2. **Portal do Cliente (Nova Interface)**
**URL Base:** `https://app.agendasalao.com` ou rotas `/saloes/*`

**Páginas:**

#### `/saloes` - Listagem de Salões
- Grid de cards com foto, nome, cidade, rating
- Filtros: cidade, tipo de serviço (corte, coloração, etc.)
- Busca por nome
- Ordenação: mais populares, melhor avaliados, mais próximos

#### `/salao/[id]` - Página do Salão
- Header: foto, nome, endereço, telefone, horário
- Abas:
  - **Serviços** (lista com preços e duração)
  - **Profissionais** (grid com fotos e especialidades)
  - **Sobre** (descrição, fotos do salão, localização no mapa)
  - **Avaliações** (comentários de clientes)
- Botão flutuante: **"Agendar Agora"**

#### `/salao/[id]/agendar` - Fluxo de Agendamento
- Passo 1: Escolher serviço
- Passo 2: Escolher profissional
- Passo 3: Escolher data e horário
- Passo 4: Confirmar (login/cadastro se necessário)
- Passo 5: Pagamento (opcional)

#### `/meus-agendamentos` - Agendamentos do Cliente
- Lista de agendamentos futuros
- Histórico de agendamentos
- Opção de avaliar após conclusão

---

### 3. **Portal do Proprietário (Sistema Atual)**
**URL Base:** `https://dashboard.agendasalao.com` ou rotas `/dashboard/*`

**Acesso:** APENAS para usuários com role `ADMIN`

**Páginas (já existentes):**
- `/dashboard` - Dashboard com estatísticas
- `/dashboard/servicos` - CRUD de serviços
- `/dashboard/profissionais` - CRUD de profissionais
- `/dashboard/agendamentos` - Gestão de agendamentos
- `/dashboard/meu-salao` - Informações do salão
- `/dashboard/configuracoes` - Configurações

**Nova página:**
- `/dashboard/plano` - Plano de assinatura (opcional)

---

## 👥 Fluxos de Usuário

### Fluxo do Cliente

```
1. Acessa landing page (agendasalao.com)
   ↓
2. Clica em "Buscar Salões"
   ↓
3. Vê lista de salões (/saloes)
   ↓
4. Filtra por cidade/serviço
   ↓
5. Clica em um salão (/salao/[id])
   ↓
6. Navega pelas abas (serviços, profissionais, sobre)
   ↓
7. Clica em "Agendar Agora" (/salao/[id]/agendar)
   ↓
8. Escolhe serviço → profissional → data/hora
   ↓
9. Faz login/cadastro (se necessário)
   ↓
10. Confirma agendamento
    ↓
11. Recebe confirmação por email
    ↓
12. Após atendimento, avalia o salão
```

### Fluxo do Proprietário

```
1. Acessa landing page (agendasalao.com)
   ↓
2. Clica em "Cadastre seu Salão"
   ↓
3. Preenche formulário (/cadastro-salao):
   - Dados do salão (nome, cidade, endereço)
   - Dados pessoais (nome, email, senha)
   ↓
4. Salão é criado + conta de admin
   ↓
5. Recebe email de boas-vindas
   ↓
6. É redirecionado para /dashboard
   ↓
7. Completa perfil do salão
   ↓
8. Cadastra serviços
   ↓
9. Cadastra profissionais
   ↓
10. Configura horários e slots
    ↓
11. Salão aparece na listagem pública
    ↓
12. Começa a receber agendamentos!
```

---

## 🗄️ Mudanças no Banco de Dados

### Model: `Salon`
**Campos novos:**

```prisma
model Salon {
  // ... campos existentes
  
  // Localização
  city         String?          // Cidade
  state        String?          // Estado (UF)
  zipCode      String?          // CEP
  latitude     Float?           // Para mapa
  longitude    Float?           // Para mapa
  
  // Mídia
  coverPhoto   String?          // Foto de capa
  photos       String[]         // Array de URLs de fotos
  
  // Avaliações
  rating       Float  @default(0)     // Média das avaliações
  reviewsCount Int    @default(0)     // Total de avaliações
  
  // Destaque
  featured     Boolean @default(false) // Salão em destaque
  verified     Boolean @default(false) // Salão verificado
  
  // Marketing
  description  String? @db.Text        // Descrição longa do salão
  specialties  String[]                // Especialidades (ex: "corte masculino", "coloração")
  
  // Controle
  publishedAt  DateTime?               // Data de publicação (quando aparece na busca)
  
  // Relações
  reviews      Review[]
}
```

### Model: `Review` (NOVO)
**Avaliações de clientes:**

```prisma
model Review {
  id          String   @id @default(uuid())
  rating      Int      // 1 a 5 estrelas
  comment     String?  @db.Text
  
  // Relações
  salonId     String
  salon       Salon    @relation(fields: [salonId], references: [id], onDelete: Cascade)
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  bookingId   String?  @unique
  booking     Booking? @relation(fields: [bookingId], references: [id])
  
  // Controle
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([salonId])
  @@index([userId])
}
```

---

## 🔌 APIs Públicas (Sem Autenticação)

### 1. **GET /api/public/salons**
**Listar todos os salões**

**Query params:**
- `city` - Filtrar por cidade
- `state` - Filtrar por estado
- `service` - Filtrar por tipo de serviço
- `featured` - Apenas salões em destaque
- `sort` - Ordenação: `popular`, `rating`, `newest`

**Resposta:**
```json
[
  {
    "id": "uuid",
    "name": "Salão Beleza Total",
    "city": "Curitiba",
    "state": "PR",
    "address": "Rua das Flores, 123",
    "coverPhoto": "url",
    "rating": 4.8,
    "reviewsCount": 245,
    "featured": true,
    "specialties": ["corte feminino", "coloração"]
  }
]
```

---

### 2. **GET /api/public/salons/[id]**
**Detalhes de um salão**

**Resposta:**
```json
{
  "id": "uuid",
  "name": "Salão Beleza Total",
  "description": "Há 15 anos trazendo beleza...",
  "city": "Curitiba",
  "state": "PR",
  "address": "Rua das Flores, 123",
  "zipCode": "80000-000",
  "phone": "(41) 99999-9999",
  "email": "contato@salao.com",
  "coverPhoto": "url",
  "photos": ["url1", "url2", "url3"],
  "openTime": "09:00",
  "closeTime": "19:00",
  "workDays": "1,2,3,4,5",
  "rating": 4.8,
  "reviewsCount": 245,
  "specialties": ["corte feminino", "coloração"],
  "services": [...],
  "staff": [...],
  "recentReviews": [...]
}
```

---

### 3. **GET /api/public/salons/[id]/services**
**Serviços do salão**

---

### 4. **GET /api/public/salons/[id]/staff**
**Profissionais do salão**

---

### 5. **GET /api/public/salons/[id]/reviews**
**Avaliações do salão**

**Query params:**
- `limit` - Número de avaliações (padrão: 10)
- `sort` - `newest`, `highest`, `lowest`

---

## 🎨 Componentes Novos

### `<SalonCard>` - Card de Salão na Listagem
```tsx
<SalonCard
  salon={{
    id: "uuid",
    name: "Salão Beleza Total",
    city: "Curitiba",
    coverPhoto: "url",
    rating: 4.8,
    reviewsCount: 245,
    specialties: ["corte", "coloração"]
  }}
/>
```

### `<SalonHeader>` - Header da Página do Salão
```tsx
<SalonHeader
  name="Salão Beleza Total"
  coverPhoto="url"
  rating={4.8}
  reviewsCount={245}
  address="Rua das Flores, 123"
  city="Curitiba"
  phone="(41) 99999-9999"
/>
```

### `<ServiceCard>` - Card de Serviço do Salão
```tsx
<ServiceCard
  service={{
    name: "Corte Feminino",
    duration: 60,
    price: 80,
    description: "Corte completo com finalização"
  }}
  onBook={() => startBooking()}
/>
```

### `<ReviewCard>` - Card de Avaliação
```tsx
<ReviewCard
  review={{
    rating: 5,
    comment: "Adorei o atendimento!",
    userName: "Maria Silva",
    date: "2025-11-05"
  }}
/>
```

---

## 🔐 Controle de Acesso

### Middleware Ajustado

**Rotas públicas (sem auth):**
- `/` - Landing page
- `/saloes` - Listagem de salões
- `/salao/[id]/*` - Páginas do salão
- `/cadastro-salao` - Cadastro de proprietário
- `/auth/*` - Login/registro

**Rotas de cliente (auth obrigatória, role: CLIENT):**
- `/meus-agendamentos` - Agendamentos do cliente
- `/perfil` - Perfil do cliente

**Rotas de admin (auth obrigatória, role: ADMIN):**
- `/dashboard/*` - Todo o painel administrativo

---

## 📊 Métricas e Analytics

### Dashboard do Proprietário
**Métricas adicionais:**
- Visualizações do perfil do salão
- Cliques em "Agendar"
- Taxa de conversão (visitas → agendamentos)
- Avaliação média e evolução
- Comparação com concorrentes da mesma cidade

### Dashboard da Plataforma (admin geral)
**Métricas globais:**
- Total de salões cadastrados
- Total de agendamentos na plataforma
- Receita total (se houver comissão)
- Salões mais populares
- Cidades com mais salões

---

## 🚀 Roadmap de Implementação

### Fase 1: Estrutura Base (Sprint 1)
1. ✅ Criar modelo Review
2. ✅ Adicionar campos no modelo Salon
3. ✅ Migração do banco
4. ✅ Criar APIs públicas
5. ✅ Criar página /cadastro-salao

### Fase 2: Interface do Cliente (Sprint 2)
1. ✅ Criar página /saloes (listagem)
2. ✅ Criar componente SalonCard
3. ✅ Implementar filtros e busca
4. ✅ Criar página /salao/[id] (detalhes)
5. ✅ Criar fluxo de agendamento

### Fase 3: Sistema de Avaliações (Sprint 3)
1. ✅ API de criar avaliação
2. ✅ Componente ReviewCard
3. ✅ Página de avaliações do salão
4. ✅ Cálculo automático de rating médio

### Fase 4: Melhorias (Sprint 4)
1. ✅ Upload de fotos do salão
2. ✅ Integração com maps (Google Maps)
3. ✅ Sistema de notificações push
4. ✅ Dashboard de analytics avançado

---

## 💰 Monetização (Opcional)

### Modelo de Negócio
1. **Plano Gratuito:** Até X agendamentos/mês
2. **Plano Básico:** R$ 49/mês - Agendamentos ilimitados
3. **Plano Pro:** R$ 99/mês - + Analytics + Destaque na busca
4. **Comissão:** % sobre agendamentos com pagamento online

---

## 📝 Checklist de Migração

- [ ] Atualizar schema Prisma
- [ ] Rodar migração no banco
- [ ] Criar seed com salões de exemplo
- [ ] Criar APIs públicas
- [ ] Criar página /cadastro-salao
- [ ] Criar página /saloes
- [ ] Criar página /salao/[id]
- [ ] Ajustar middleware de auth
- [ ] Atualizar landing page
- [ ] Testar fluxo completo
- [ ] Deploy em produção

---

## 🎯 Benefícios da Nova Arquitetura

### Para Clientes
✅ Vários salões em um só lugar  
✅ Comparação fácil (preços, avaliações)  
✅ Agendamento online 24/7  
✅ Histórico de agendamentos  
✅ Avaliações de outros clientes  

### Para Proprietários
✅ Visibilidade em uma plataforma  
✅ Sistema completo de gestão  
✅ Notificações automáticas  
✅ Relatórios e analytics  
✅ Pagamentos online (opcional)  

### Para a Plataforma
✅ Escalabilidade  
✅ Múltiplos salões = mais receita  
✅ Rede de efeito (mais salões → mais clientes)  
✅ Dados para insights  
✅ Possibilidade de monetização  

---

## 📚 Documentos Relacionados

- [Sistema Multi-Tenant](./SISTEMA_MULTI_TENANT.md)
- [Sistema de Pagamentos](./SISTEMA_PAGAMENTOS.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Status:** 🚧 Em Planejamento  
**Última atualização:** 7 de novembro de 2025
