# 🔧 Fix: Endereços Não Aparecem na Página "Meu Salão"

## 🐛 Problema Identificado

Na página `/dashboard/meu-salao`, os campos de endereço (Rua, Número, Bairro, etc.) não aparecem preenchidos, mesmo que foram salvos no cadastro inicial pela landing page.

### Causa Raiz

Quando o salão é criado via `/api/auth/register-salon`, os dados eram salvos corretamente nos campos separados (`street`, `number`, `neighborhood`, `city`, `state`, `zipCode`). Porém, alguns salões antigos podem ter sido criados apenas com o campo `address` (endereço completo), sem preencher os campos individuais.

## ✅ Solução Implementada

### 1. Script de Migração Criado

**Arquivo**: `scripts/fix-salon-addresses.js`

Este script:
- ✅ Busca todos os salões no banco
- ✅ Identifica salões com `address` preenchido mas `street` vazio
- ✅ Parseia o endereço completo em partes (rua, número, bairro)
- ✅ Atualiza os campos separados no banco
- ✅ Mantém campos existentes (city, state, zipCode) intactos

**Formatos suportados**:
```
"Rua X, 123"                           → street: "Rua X", number: "123"
"Rua X, 123 - Bairro"                  → + neighborhood: "Bairro"
"Rua X, 123 - Bairro - Cidade/UF"     → + city: "Cidade", state: "UF"
"Rua X - Bairro"                       → street: "Rua X", neighborhood: "Bairro"
```

### 2. Resultados da Migração (Local)

```
📊 Total de salões encontrados: 4

✅ Atualizados: 3 salões
   - "Boca Aberta": Rua Augusto Gawleta, 256 - Estação
   - "Boca Aberta": teste
   - "Salão Teste Fantasia": Quadra SES 803

⏭️  Pulados: 1 salão (já tinha campos separados)
```

## 🚀 Como Executar no Railway (Produção)

### Opção 1: Via Railway CLI (Recomendado)

```bash
# 1. Instalar Railway CLI (se não tiver)
npm install -g @railway/cli

# 2. Fazer login
railway login

# 3. Conectar ao projeto
railway link

# 4. Executar migração
railway run bash scripts/migrate-addresses-railway.sh
```

### Opção 2: Via Railway Dashboard

1. Acesse o projeto no Railway: https://railway.app
2. Vá em **Settings** → **Variables**
3. Adicione uma nova variável temporária:
   ```
   RUN_MIGRATION=fix-addresses
   ```
4. No **Deployments**, clique em **View Logs**
5. Execute manualmente via terminal do Railway:
   ```bash
   node scripts/fix-salon-addresses.js
   ```

### Opção 3: Executar Via API Route (Mais Simples)

Crie uma rota administrativa temporária:

```typescript
// app/api/admin/migrate-addresses/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  
  // Apenas OWNER pode executar
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const salons = await prisma.salon.findMany({
      where: {
        street: null, // Apenas salões sem campos separados
        address: { not: null } // Mas com endereço completo
      }
    });

    let updated = 0;

    for (const salon of salons) {
      const parsed = parseAddress(salon.address!);
      
      if (parsed.street) {
        await prisma.salon.update({
          where: { id: salon.id },
          data: {
            street: parsed.street,
            number: parsed.number || null,
            neighborhood: parsed.neighborhood || null,
          }
        });
        updated++;
      }
    }

    return NextResponse.json({
      message: "Migração concluída",
      total: salons.length,
      updated
    });
  } catch (error) {
    console.error("Erro na migração:", error);
    return NextResponse.json(
      { error: "Erro ao migrar endereços" },
      { status: 500 }
    );
  }
}

function parseAddress(address: string) {
  // ... mesma lógica do script
}
```

Depois acesse: `https://salao-production.up.railway.app/api/admin/migrate-addresses` (via POST)

## 📋 Checklist Pós-Migração

- [ ] Executar migração no Railway
- [ ] Verificar logs para confirmar sucesso
- [ ] Acessar `/dashboard/meu-salao` em produção
- [ ] Confirmar que campos aparecem preenchidos:
  - [ ] CEP
  - [ ] Logradouro (Rua)
  - [ ] Número
  - [ ] Bairro
  - [ ] Cidade
  - [ ] Estado
- [ ] Testar edição e salvar (deve funcionar normalmente)

## 🔍 Verificação Manual (SQL)

Para verificar no banco de dados do Railway:

```sql
-- Ver salões sem campos separados
SELECT id, name, address, street, number, neighborhood, city, state
FROM "Salon"
WHERE street IS NULL AND address IS NOT NULL;

-- Após migração, verificar quantos foram atualizados
SELECT COUNT(*) as total_com_campos_separados
FROM "Salon"
WHERE street IS NOT NULL;
```

## 🎯 Resultado Esperado

Após a migração:
- ✅ Todos os salões terão campos `street`, `number`, `neighborhood` preenchidos
- ✅ A página "Meu Salão" exibirá os endereços corretamente
- ✅ Edições futuras funcionarão normalmente
- ✅ Novos cadastros já vêm com campos separados (API já corrigida)

## 📝 Notas Técnicas

### API Registro (`/api/auth/register-salon`)

✅ Já estava correta! A API salva nos campos separados:
```typescript
street: street || null,
number: salonNumber || null,
neighborhood: neighborhood,
city: salonCity,
state: salonState,
zipCode: salonZipCode || null,
```

### Frontend Cadastro (`/cadastro-salao`)

✅ Envia os campos corretos:
```typescript
salonAddress  → street (logradouro)
salonNumber   → number
salonCity     → city
salonState    → state
salonZipCode  → zipCode
```

### Problema Real

❌ Salões criados **antes** da correção não tinham campos separados preenchidos.

## 🔄 Próximos Cadastros

Todos os novos cadastros já funcionam corretamente! O problema afeta apenas salões existentes.

---

**Criado em**: 21/11/2025  
**Autor**: Sistema AgendaSalão  
**Status**: ✅ Pronto para executar
