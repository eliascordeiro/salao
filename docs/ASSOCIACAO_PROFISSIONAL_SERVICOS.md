# 🔗 Sistema de Associação Profissional ↔ Serviços

## 📋 Visão Geral

Sistema que permite associar profissionais aos serviços que eles prestam, criando uma relação N:N (muitos-para-muitos) entre Staff e Service através da tabela `ServiceStaff`.

---

## 🗄️ Estrutura do Banco de Dados

### Tabela: `ServiceStaff`

```prisma
model ServiceStaff {
  id        String   @id @default(cuid())
  serviceId String
  staffId   String
  
  service   Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  staff     Staff    @relation(fields: [staffId], references: [id], onDelete: Cascade)
  
  @@unique([serviceId, staffId])
}
```

**Características:**
- Relacionamento N:N entre `Staff` e `Service`
- `@@unique([serviceId, staffId])`: Impede duplicatas
- `onDelete: Cascade`: Deleta associações ao deletar staff ou serviço

---

## 🎨 Interface do Usuário

### 1. Cadastro de Profissional (`/dashboard/profissionais/novo`)

**Funcionalidades:**
- ✅ Formulário de dados básicos (nome, email, telefone, especialidade)
- ✅ Seção "Serviços que este profissional presta"
- ✅ Seleção múltipla com checkboxes estilizados
- ✅ Cards visuais para cada serviço
- ✅ Exibe duração e preço do serviço
- ✅ Loading state ao buscar serviços
- ✅ Mensagem quando não há serviços cadastrados

**Exemplo Visual:**
```
┌─────────────────────────────────────┐
│ 💼 Serviços que este profissional   │
│    presta                           │
├─────────────────────────────────────┤
│ ☑️ Corte Masculino                  │
│    30 min · R$ 35.00                │
├─────────────────────────────────────┤
│ ☐  Barba                            │
│    20 min · R$ 25.00                │
├─────────────────────────────────────┤
│ ☑️ Corte + Barba                    │
│    50 min · R$ 55.00                │
└─────────────────────────────────────┘
```

### 2. Edição de Profissional (`/dashboard/profissionais/[id]/editar`)

**Funcionalidades:**
- ✅ Carrega serviços já associados
- ✅ Permite adicionar/remover serviços
- ✅ Mesma interface visual do cadastro
- ✅ Atualização em tempo real

### 3. Listagem de Profissionais (`/dashboard/profissionais`)

**Funcionalidades:**
- ✅ Exibe serviços associados em badges
- ✅ Mostra até 3 serviços + contador "+X"
- ✅ Indica quando não há serviços associados

**Exemplo Visual:**
```
João Silva
📧 joao@exemplo.com
✨ Serviços prestados:
   [Corte Masculino] [Barba] [Coloração] +2
```

---

## 🔧 Backend (APIs)

### POST `/api/staff` - Criar Profissional

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "(11) 98765-4321",
  "specialty": "Barbeiro",
  "active": true,
  "serviceIds": [
    "service-id-1",
    "service-id-2",
    "service-id-3"
  ]
}
```

**Lógica:**
1. Valida dados básicos
2. Cria registro em `Staff`
3. Cria múltiplos registros em `ServiceStaff` (via `create` nested)
4. Retorna staff com serviços incluídos

**Código:**
```typescript
const staff = await prisma.staff.create({
  data: {
    name,
    email,
    phone,
    specialty,
    salonId: userSalonId,
    services: {
      create: serviceIds.map((serviceId: string) => ({
        serviceId,
      })),
    },
  },
  include: {
    services: {
      include: {
        service: true
      }
    }
  }
})
```

### PUT `/api/staff/[id]` - Atualizar Profissional

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "phone": "(11) 98765-4321",
  "specialty": "Barbeiro",
  "active": true,
  "serviceIds": [
    "service-id-1",
    "service-id-4"
  ]
}
```

**Lógica:**
1. **Se `serviceIds` fornecido:**
   - Deleta todas associações antigas (`deleteMany`)
   - Cria novas associações (`createMany`)
2. Atualiza dados do profissional
3. Retorna staff atualizado com serviços

**Código:**
```typescript
// Atualizar associações de serviços
if (serviceIds !== undefined) {
  // Remover associações antigas
  await prisma.serviceStaff.deleteMany({
    where: { staffId: params.id }
  })

  // Criar novas associações
  if (serviceIds.length > 0) {
    await prisma.serviceStaff.createMany({
      data: serviceIds.map((serviceId: string) => ({
        staffId: params.id,
        serviceId,
      })),
    })
  }
}

// Atualizar dados do profissional
const staff = await prisma.staff.update({
  where: { id: params.id },
  data: { name, email, phone, specialty, active },
  include: {
    services: {
      include: { service: true }
    }
  }
})
```

### GET `/api/staff` - Listar Profissionais

**Response:**
```json
[
  {
    "id": "staff-id-1",
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "services": [
      {
        "serviceId": "service-id-1",
        "service": {
          "id": "service-id-1",
          "name": "Corte Masculino",
          "duration": 30,
          "price": 35.00
        }
      }
    ]
  }
]
```

### GET `/api/staff/[id]` - Buscar Profissional

**Response:**
```json
{
  "id": "staff-id-1",
  "name": "João Silva",
  "email": "joao@exemplo.com",
  "services": [
    {
      "serviceId": "service-id-1",
      "service": {
        "id": "service-id-1",
        "name": "Corte Masculino",
        "duration": 30,
        "price": 35.00
      }
    },
    {
      "serviceId": "service-id-2",
      "service": {
        "id": "service-id-2",
        "name": "Barba",
        "duration": 20,
        "price": 25.00
      }
    }
  ]
}
```

---

## 🎯 Fluxo de Uso

### Cenário 1: Cadastrar Novo Profissional

1. Admin acessa `/dashboard/profissionais/novo`
2. Preenche dados básicos (nome, email, etc)
3. Seleciona serviços que o profissional presta (checkboxes)
4. Clica em "Salvar Profissional"
5. Sistema:
   - Cria registro em `Staff`
   - Cria registros em `ServiceStaff` para cada serviço selecionado
   - Redireciona para listagem

### Cenário 2: Editar Profissional

1. Admin acessa `/dashboard/profissionais`
2. Clica em "Editar" no profissional desejado
3. Sistema carrega:
   - Dados do profissional
   - Serviços já associados (checkboxes marcados)
4. Admin adiciona/remove serviços
5. Clica em "Salvar Alterações"
6. Sistema:
   - Deleta todas associações antigas
   - Cria novas associações baseadas na seleção atual
   - Atualiza dados do profissional

### Cenário 3: Visualizar Serviços de um Profissional

1. Admin acessa `/dashboard/profissionais`
2. Vê card do profissional com:
   - Nome, email, telefone
   - **Badges dos serviços associados**
   - Contador "+X" se houver mais de 3 serviços

---

## ✅ Validações

### Frontend
- ✅ Permite criar profissional **sem** serviços associados
- ✅ Permite selecionar múltiplos serviços
- ✅ Checkboxes com estado visual claro (selecionado/não selecionado)

### Backend
- ✅ Aceita `serviceIds` como array vazio `[]`
- ✅ Valida que serviceIds são strings válidas
- ✅ Impede duplicatas (constraint `@@unique` no banco)
- ✅ Deleta associações ao deletar profissional (cascade)

---

## 🎨 Componentes Visuais

### Checkbox de Serviço

```tsx
<label
  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
    selected
      ? "border-primary bg-primary/5"
      : "border-border bg-background-alt hover:border-primary/50"
  }`}
>
  <input
    type="checkbox"
    checked={selected}
    onChange={() => toggle(serviceId)}
    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
  />
  <div className="flex-1">
    <div className="font-semibold text-foreground">{service.name}</div>
    <div className="text-xs text-foreground-muted mt-1">
      {service.duration} min · R$ {service.price.toFixed(2)}
    </div>
  </div>
</label>
```

**Estados:**
- **Não selecionado**: Borda cinza, fundo alternativo, hover sutil
- **Selecionado**: Borda primária, fundo primário/5%, destaque visual

### Badge de Serviço (Listagem)

```tsx
<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass-card bg-primary/10 text-primary">
  {service.name}
</span>
```

---

## 📊 Impacto no Sistema

### Sistema de Agendamentos
- ✅ Agendamentos filtram profissionais disponíveis por serviço
- ✅ Apenas profissionais associados ao serviço aparecem na seleção
- ✅ Validação: impede agendar serviço com profissional não associado

### Dashboard
- ✅ Cards de profissionais mostram expertise (serviços)
- ✅ Fácil identificar quem faz o quê
- ✅ Gestão visual clara das competências da equipe

### Relatórios
- ✅ Possível analisar serviços mais populares por profissional
- ✅ Identificar profissionais multi-serviço vs especialistas

---

## 🚀 Melhorias Futuras

### Curto Prazo
- [ ] Filtro na listagem por serviço prestado
- [ ] Badge com ícone do serviço
- [ ] Contador de agendamentos por serviço+profissional

### Médio Prazo
- [ ] Nível de expertise (iniciante/intermediário/avançado)
- [ ] Preço diferenciado por profissional+serviço
- [ ] Comissões por serviço
- [ ] Histórico de mudanças nas associações

### Longo Prazo
- [ ] Certificações e cursos vinculados aos serviços
- [ ] Sistema de avaliação por serviço prestado
- [ ] Sugestão automática de serviços baseado em bookings

---

## 🐛 Troubleshooting

### Problema: Serviços não aparecem no cadastro
**Solução:**
1. Verificar se há serviços cadastrados no salão
2. Conferir se API `/api/services` está retornando dados
3. Verificar console do navegador para erros

### Problema: Associações não são salvas
**Solução:**
1. Verificar se `serviceIds` está sendo enviado no request
2. Conferir logs do servidor para erros de banco
3. Validar constraint `@@unique` não está sendo violada

### Problema: Serviços duplicados na listagem
**Solução:**
1. Verificar constraint `@@unique([serviceId, staffId])`
2. Limpar associações duplicadas no banco
3. Re-salvar o profissional

---

## 📝 Conclusão

Sistema robusto e escalável para gerenciar a expertise da equipe, com:
- ✅ Interface intuitiva e visual
- ✅ Backend consistente e validado
- ✅ Suporte completo ao tema dark/light
- ✅ Integração com sistema de agendamentos
- ✅ Pronto para expansões futuras

**Mantido por**: Equipe de Desenvolvimento  
**Última atualização**: 7 de novembro de 2025
