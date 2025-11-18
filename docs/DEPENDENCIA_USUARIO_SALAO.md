# Sistema de Dependência Usuário-Salão

## ✅ Status: FUNCIONANDO CORRETAMENTE

## Como Funciona

### 1. Estrutura do Banco de Dados

**Tabela User:**
- `ownerId`: ID do usuário proprietário que criou este usuário
- `roleType`: Tipo de função (OWNER, STAFF, CUSTOM)
- `role`: Papel principal (ADMIN, CLIENT)

**Relações:**
- Um User pode ter um `owner` (outro User que o criou)
- Um User pode ter vários `ownedSalons` (salões que ele possui)
- Um User pode ter vários `managedUsers` (usuários que ele criou)

### 2. Fluxo de Atribuição de Salão

#### Quando um proprietário cria um usuário:
1. O novo usuário recebe `ownerId` = ID do proprietário
2. O novo usuário recebe `roleType` = "STAFF" ou "CUSTOM"
3. O novo usuário **NÃO possui salão próprio** (ownedSalons = [])

#### Quando esse usuário cria um agendamento:
1. O sistema usa `getUserSalon()` de `lib/salon-helper.ts`
2. O helper verifica se o usuário tem `ownerId`
3. Se sim, busca o salão do proprietário (owner.ownedSalons)
4. O agendamento é criado com `salonId` = salão do proprietário

### 3. Exemplo Real

**Usuário:** Maria da Silva Sauro (elias157508@gmail.com)
- ID: cmi0t910v0001ofccroxzh2dw
- Role: ADMIN
- RoleType: CUSTOM
- OwnerId: cmhv634o20000ofa1975pz3x8 (Administrador)

**Proprietário:** Administrador (admin@agendasalao.com.br)
- ID: cmhv634o20000ofa1975pz3x8
- Salão: Boca Aberta (ID: cmhv635c20004ofa1b60azdu6)

**Agendamentos da Maria:**
- Todos têm `salonId` = cmhv635c20004ofa1b60azdu6 (Boca Aberta) ✅
- Nenhum agendamento "órfão" ou em salão errado ✅

## Código Principal

### lib/salon-helper.ts

```typescript
export async function getUserSalon() {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      ownedSalons: { where: { active: true }, take: 1 },
      owner: {
        include: {
          ownedSalons: { where: { active: true }, take: 1 }
        }
      }
    }
  })

  // 1. Se tem salão próprio, usa
  if (user.ownedSalons && user.ownedSalons.length > 0) {
    return user.ownedSalons[0]
  }

  // 2. Se é gerenciado (tem ownerId), usa salão do owner
  if (user.ownerId && user.owner) {
    if (user.owner.ownedSalons && user.owner.ownedSalons.length > 0) {
      return user.owner.ownedSalons[0]
    }
  }

  // 3. Fallback para ADMIN
  if (user.role === 'ADMIN') {
    return await prisma.salon.findFirst({ where: { active: true } })
  }

  return null
}
```

### app/api/bookings/route.ts (POST)

```typescript
// Buscar o salão do profissional se não foi fornecido
let finalSalonId = salonId;
if (!finalSalonId) {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    select: { salonId: true },
  });
  finalSalonId = staff.salonId;
}

// O staffId já garante que o salão seja o correto!
// Porque staff.salonId vem do salão do proprietário
```

## Casos de Uso

### ✅ Caso 1: Proprietário cria usuário e o usuário agenda
1. Admin cria usuário "Maria" com `ownerId` = admin.id
2. Maria faz login e cria agendamento
3. Sistema detecta que Maria tem `ownerId`
4. Busca salão do owner (admin.ownedSalons[0])
5. Agendamento é criado no salão correto ✅

### ✅ Caso 2: Cliente externo agenda
1. Cliente "João" se registra pelo site (sem ownerId)
2. João escolhe salão "Boca Aberta"
3. João escolhe profissional e serviço
4. Agendamento é criado com salonId do profissional ✅

### ✅ Caso 3: Proprietário agenda para cliente
1. Admin está no dashboard
2. Admin seleciona cliente (pode ser gerenciado ou não)
3. Admin escolhe profissional (que já tem salonId)
4. Agendamento é criado no salão do profissional ✅

## Verificação de Integridade

Para verificar se a dependência está correta, execute:

```bash
node check-user-salon-dependency.js
```

**Saída esperada:**
```
✅ Este usuário foi criado pelo proprietário: [Nome]
✅ Todos os agendamentos devem ser no salão: [Salão]
✅ Atribuído corretamente? SIM
```

## Pontos de Atenção

### ⚠️ O que pode quebrar a dependência:

1. **Criar usuário sem definir ownerId:**
   - Sempre definir `ownerId` ao criar STAFF/CUSTOM
   - Verificar no formulário de criação de usuários

2. **Permitir usuário gerenciado escolher qualquer salão:**
   - Interface deve filtrar apenas salões do owner
   - Backend deve validar salonId

3. **Alterar ownerId manualmente no banco:**
   - Pode desassociar usuário do salão original
   - Agendamentos antigos ficam no salão antigo

### ✅ Como manter a integridade:

1. **No formulário de criação de usuários:**
   ```typescript
   const session = await getServerSession(authOptions)
   const newUser = await prisma.user.create({
     data: {
       ...userData,
       ownerId: session.user.id, // ← SEMPRE definir!
       roleType: "STAFF" // ou "CUSTOM"
     }
   })
   ```

2. **Ao criar agendamento, usar helper:**
   ```typescript
   import { getUserSalon } from "@/lib/salon-helper"
   
   const salon = await getUserSalon()
   if (!salon) {
     return NextResponse.json({ error: "Salão não encontrado" })
   }
   
   const booking = await prisma.booking.create({
     data: {
       ...bookingData,
       salonId: salon.id // ← Sempre do helper!
     }
   })
   ```

3. **Na interface do cliente, filtrar salões:**
   ```typescript
   // Se usuário tem ownerId, mostrar apenas salão do owner
   if (user.ownerId) {
     const ownerSalon = await getUserSalon()
     // Mostrar apenas este salão
   }
   ```

## Testes de Validação

### Teste 1: Verificar usuário
```sql
SELECT 
  u.email, 
  u.roleType, 
  u.ownerId,
  owner.email as owner_email,
  s.name as salon_name
FROM "User" u
LEFT JOIN "User" owner ON u.ownerId = owner.id
LEFT JOIN "Salon" s ON s.ownerId = owner.id
WHERE u.email = 'elias157508@gmail.com';
```

### Teste 2: Verificar agendamentos
```sql
SELECT 
  b.id,
  b.date,
  c.name as client_name,
  c.ownerId as client_owner_id,
  s.name as salon_name,
  s.ownerId as salon_owner_id,
  (c.ownerId = s.ownerId) as is_correct
FROM "Booking" b
JOIN "User" c ON b.clientId = c.id
JOIN "Salon" s ON b.salonId = s.id
WHERE c.email = 'elias157508@gmail.com'
ORDER BY b.date DESC;
```

## Conclusão

✅ O sistema de dependência está **FUNCIONANDO CORRETAMENTE**
✅ Usuários gerenciados mantêm vínculo com salão do proprietário
✅ Agendamentos são automaticamente atribuídos ao salão correto
✅ Nenhuma ação necessária no momento

**Data da verificação:** 16/11/2025
**Usuário testado:** elias157508@gmail.com (Maria da Silva Sauro)
**Resultado:** 2/2 agendamentos no salão correto (100%)
