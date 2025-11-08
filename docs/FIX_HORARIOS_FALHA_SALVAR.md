# Fix: Erro ao Salvar Horários

## 🐛 Problema Identificado

Erro ao tentar salvar horários disponíveis (slots) dos profissionais:
```
${failed.length} horário(s) falharam ao salvar
```

## 🔍 Causa Raiz

O erro ocorria na API `/api/availabilities` (route POST) ao tentar criar slots recorrentes. Os problemas identificados foram:

1. **Campo `createdBy` inválido**: 
   - O código tentava usar `session.user.id`, mas o objeto de sessão do NextAuth não possui esse campo por padrão
   - O campo `createdBy` no schema Prisma é opcional (`String?`), mas estava sendo preenchido com valor inválido

2. **Falta de logs detalhados**: 
   - Erros eram capturados mas não retornavam detalhes suficientes para debug
   - Não havia logs do payload recebido pela API

## ✅ Solução Implementada

### 1. Correção do campo `createdBy`

**Antes:**
```typescript
const createData: any = {
  staffId,
  startTime,
  endTime,
  available: available !== undefined ? available : (type === "RECURRING" ? true : false),
  reason: reason || null,
  type: type || "BLOCK",
  createdBy: session.user.id || null, // ❌ session.user.id não existe
};
```

**Depois:**
```typescript
const createData: any = {
  staffId,
  startTime,
  endTime,
  available: available !== undefined ? available : (type === "RECURRING" ? true : false),
  reason: reason || null,
  type: type || "BLOCK",
  // ✅ Usa email se disponível, senão omite o campo
  ...(session.user?.email && { createdBy: session.user.email }),
};
```

### 2. Melhorias nos Logs

Adicionados logs detalhados em 3 pontos-chave:

```typescript
// Log do payload recebido
console.log("📝 [availabilities POST] Dados recebidos:", JSON.stringify(data, null, 2));

// Log dos dados preparados para o Prisma
console.log("💾 [availabilities POST] Criando com dados:", JSON.stringify(createData, null, 2));

// Log de sucesso com ID criado
console.log("✅ [availabilities POST] Criado com sucesso:", availability.id);
```

### 3. Melhor Tratamento de Erros

```typescript
catch (error) {
  console.error("❌ [availabilities POST] Erro ao criar disponibilidade:", error);
  
  const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
  const errorDetails = error instanceof Error ? error.stack : undefined;
  
  console.error("Detalhes:", errorDetails);
  
  return NextResponse.json(
    { 
      error: "Erro ao criar disponibilidade",
      message: errorMessage,
      // Stack trace apenas em desenvolvimento
      details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
    },
    { status: 500 }
  );
}
```

## 📋 Arquivos Modificados

1. `app/api/availabilities/route.ts` - Correção principal
2. `test-slots-api.js` - Script de teste criado para debug

## 🧪 Como Testar

### Em Produção (Railway)

1. Acesse: https://salao-production.up.railway.app
2. Faça login como admin: `admin@agendasalao.com.br` / `admin123`
3. Vá em "Profissionais" → Selecione um profissional
4. Clique em "Slots" (ou "Horários Disponíveis")
5. Adicione um horário:
   - Dia da semana: Segunda-feira
   - Horário início: 09:00
   - Horário fim: 09:30
6. Clique em "Salvar Todos os Horários"
7. Deve mostrar: "X horário(s) salvos para Segunda-feira!"

### Verificar Logs no Railway

1. Acesse o Railway Dashboard
2. Vá em "Deployments" → Selecione o último deploy
3. Clique em "View Logs"
4. Procure por:
   - `📝 [availabilities POST] Dados recebidos:` - Mostra o payload
   - `💾 [availabilities POST] Criando com dados:` - Mostra os dados do Prisma
   - `✅ [availabilities POST] Criado com sucesso:` - Confirma sucesso
   - `❌ [availabilities POST] Erro` - Em caso de erro

## 🎯 Resultado Esperado

✅ Horários devem ser salvos com sucesso
✅ Mensagem de confirmação: "X horário(s) salvos para [Dia]!"
✅ Horários aparecem na listagem após salvar
✅ Sem erros no console ou nos logs

## 📝 Notas Técnicas

- O campo `createdBy` agora é opcional e só será preenchido se houver email na sessão
- Logs detalhados facilitam debug em produção
- Stack traces são expostos apenas em modo desenvolvimento
- A estrutura do objeto de sessão do NextAuth não inclui `id` por padrão, apenas `name`, `email` e `image`

## 🔗 Commit

```
fix: Corrigir erro ao salvar horários - melhorar logs e handling do campo createdBy
Hash: 041637a
```

## ✅ Status

- [x] Correção implementada
- [x] Código commitado
- [x] Push para GitHub
- [ ] Deploy automático no Railway (em progresso)
- [ ] Testes em produção

---

**Data**: 03/11/2025
**Autor**: GitHub Copilot
