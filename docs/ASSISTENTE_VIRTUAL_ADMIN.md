# 🤖 Assistente Virtual Admin - Documentação Completa

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Sistema de Contexto](#sistema-de-contexto)
4. [Perguntas Rápidas](#perguntas-rápidas)
5. [Integração](#integração)
6. [Exemplos de Uso](#exemplos-de-uso)
7. [Customização](#customização)

---

## 🎯 Visão Geral

O **Assistente Virtual Admin** é uma IA conversacional integrada ao painel administrativo que ajuda os usuários a navegar e utilizar o sistema de gestão de salões. Utiliza o modelo **Llama 3.3 70B** via **Groq AI**.

### ✨ Características Principais

- ✅ **Contextual**: Detecta automaticamente a página atual
- ✅ **Proativo**: Oferece ajuda ao detectar mudança de página
- ✅ **Perguntas Rápidas**: Botões com questões comuns
- ✅ **Visual Diferenciado**: Gradiente azul/índigo (vs cliente: rosa/roxo)
- ✅ **Gratuito**: 14.400 requests/dia (Groq)
- ✅ **Globalmente Disponível**: Presente em todas as páginas admin

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│              AdminAIChatWidget                       │
│                 (Frontend)                           │
│  ┌────────────────────────────────────────────┐    │
│  │ • usePathname() → Detecta página atual      │    │
│  │ • useEffect() → Monitora mudanças de rota   │    │
│  │ • useState() → Gerencia mensagens e UI      │    │
│  └────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────┘
                 │
                 │ POST /api/chat/admin
                 │ { messages, context }
                 ▼
┌─────────────────────────────────────────────────────┐
│           /api/chat/admin/route.ts                  │
│                (Backend)                             │
│  ┌────────────────────────────────────────────┐    │
│  │ 1. Recebe mensagens + contexto             │    │
│  │ 2. Monta system prompt com contexto        │    │
│  │ 3. Chama Groq AI (Llama 3.3 70B)           │    │
│  │ 4. Retorna resposta formatada              │    │
│  └────────────────────────────────────────────┘    │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Groq AI API
                 ▼
         ┌───────────────────┐
         │   Llama 3.3 70B   │
         │  (groq-sdk)       │
         └───────────────────┘
```

### 📁 Estrutura de Arquivos

```
components/chat/
  ├── admin-ai-chat-widget.tsx    # Widget do assistente admin
  └── ai-chat-widget.tsx          # Widget do cliente (salões)

app/api/chat/
  ├── admin/route.ts              # API admin-específica
  └── route.ts                    # API cliente (salões)

app/(admin)/layout.tsx            # Integração global no admin

docs/
  └── ASSISTENTE_VIRTUAL_ADMIN.md # Esta documentação
```

---

## 🧭 Sistema de Contexto

### Detecção de Página

O assistente detecta automaticamente a página atual usando `usePathname()`:

```typescript
const getPageContextHelp = (path: string): string | null => {
  if (path.includes("/dashboard/caixa")) {
    return "📊 Você está no Caixa. Precisa de ajuda com pagamentos, descontos ou fechamento de contas?";
  }
  if (path.includes("/dashboard/agendamentos")) {
    return "📅 Você está em Agendamentos. Posso ajudar com confirmações, cancelamentos ou gestão de horários.";
  }
  if (path.includes("/dashboard/profissionais")) {
    return "👥 Você está em Profissionais. Precisa de ajuda para cadastrar ou configurar horários?";
  }
  if (path.includes("/dashboard/servicos")) {
    return "✂️ Você está em Serviços. Posso ajudar com preços, durações ou associação de profissionais.";
  }
  if (path.includes("/dashboard/relatorios")) {
    return "📈 Você está em Relatórios. Posso ajudar a interpretar métricas ou exportar dados.";
  }
  if (path.includes("/dashboard/financeiro")) {
    return "💰 Você está em Financeiro. Precisa de ajuda com análise de lucro ou despesas?";
  }
  if (path.includes("/dashboard/usuarios")) {
    return "🔐 Você está em Usuários. Posso ajudar com convites, permissões ou gestão de acesso.";
  }
  if (path.includes("/dashboard/configuracoes")) {
    return "⚙️ Você está em Configurações. Precisa de ajuda com algum ajuste do sistema?";
  }
  return null;
};
```

### Contexto Enviado para API

```typescript
const context = {
  page: currentPage,           // Ex: "Caixa"
  fullPath: pathname,          // Ex: "/dashboard/caixa"
  userRole: userRole,          // Ex: "OWNER"
};
```

### System Prompt da API

O prompt inclui:
- **Contexto atual**: Página, caminho, perfil do usuário
- **Funcionalidades do sistema**: 10 módulos principais
- **Instruções de comportamento**: Tom, formato, exemplos

```typescript
const systemPrompt = `Você é um assistente virtual especializado...

CONTEXTO ATUAL:
- Página: ${context?.page || "dashboard"}
- Caminho: ${context?.fullPath || "/dashboard"}
- Perfil: ${context?.userRole || "OWNER"}

FUNCIONALIDADES DO SISTEMA:

DASHBOARD:
- Visão geral de métricas...

CAIXA:
- Gerenciamento de pagamentos...
...
`;
```

---

## ⚡ Perguntas Rápidas

Botões com questões comuns para iniciar conversas rapidamente:

```typescript
const quickQuestions = [
  "Como adicionar um profissional?",
  "Como funciona o sistema de caixa?",
  "Explicar sistema de permissões",
  "Como exportar relatórios?",
];
```

### Como Funcionam

1. **Clique no botão**: Adiciona pergunta ao chat automaticamente
2. **Envio imediato**: Não precisa clicar em "Enviar"
3. **Contexto mantido**: IA sabe qual página você está

---

## 🔧 Integração

### 1. Componente no Layout

```tsx
// app/(admin)/layout.tsx
import { AdminAIChatWidget } from "@/components/chat/admin-ai-chat-widget";
import { useSession } from "next-auth/react";

function AdminLayoutContent({ children }) {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main>{children}</main>
      
      {/* ✅ Assistente disponível globalmente */}
      <AdminAIChatWidget 
        userName={session?.user?.name}
        userRole={session?.user?.role}
      />
    </div>
  );
}
```

### 2. Props do Componente

```typescript
interface AdminAIChatWidgetProps {
  userName?: string;    // Nome do usuário (ex: "João Silva")
  userRole?: string;    // Perfil (ex: "OWNER", "ADMIN", "STAFF")
}
```

### 3. Variável de Ambiente

```env
# .env.local
GROQ_API_KEY=gsk_...
```

**Como obter**: https://console.groq.com/keys

---

## 💬 Exemplos de Uso

### Exemplo 1: Ajuda no Caixa

**Usuário navega para `/dashboard/caixa`**

🤖 **Assistente (auto-sugestão):**
> 📊 Você está no Caixa. Precisa de ajuda com pagamentos, descontos ou fechamento de contas?

👤 **Usuário clica em "Como funciona o sistema de caixa?"**

🤖 **Assistente:**
> O sistema de Caixa funciona assim:
>
> 1. **Pendentes**: Mostra agendamentos com status OPEN (ainda não pagos)
> 2. **Checkboxes**: Você pode selecionar quais serviços cobrar (pagamento parcial)
> 3. **Descontos**: Aplicados ao subtotal dos serviços selecionados
> 4. **Métodos**: Dinheiro, Cartão, PIX ou Múltiplos
> 5. **Histórico**: Todas as sessões fechadas (CLOSED)
>
> Quer saber mais sobre pagamentos parciais?

---

### Exemplo 2: Configurando Horários

**Usuário navega para `/dashboard/profissionais`**

🤖 **Assistente (auto-sugestão):**
> 👥 Você está em Profissionais. Precisa de ajuda para cadastrar ou configurar horários?

👤 **Usuário pergunta:**
> Como configurar horários de trabalho de um profissional?

🤖 **Assistente:**
> Para configurar horários:
>
> 1. Na lista de profissionais, clique no botão "Horários" ao lado do nome
> 2. Selecione os **dias de trabalho** (ex: Seg-Sex)
> 3. Defina **horário de início** (ex: 08:00)
> 4. Defina **horário de término** (ex: 18:00)
> 5. (Opcional) Configure **horário de almoço** (ex: 12:00-13:00)
> 6. Clique em "Salvar Horários"
>
> ⚠️ Os slots de agendamento são gerados automaticamente baseado nestes horários!

---

### Exemplo 3: Análise de Relatórios

**Usuário navega para `/dashboard/relatorios`**

🤖 **Assistente (auto-sugestão):**
> 📈 Você está em Relatórios. Posso ajudar a interpretar métricas ou exportar dados.

👤 **Usuário pergunta:**
> O que significa "Taxa de Ocupação"?

🤖 **Assistente:**
> A **Taxa de Ocupação** mostra a porcentagem de horários preenchidos com agendamentos confirmados.
>
> **Cálculo**: (Agendamentos Confirmados / Total de Slots Disponíveis) × 100
>
> **Exemplo**:
> - 50 agendamentos confirmados
> - 200 slots disponíveis
> - Taxa de ocupação: 25%
>
> 📊 Uma taxa ideal varia entre 60-80%. Acima de 80% pode indicar necessidade de contratar mais profissionais.

---

## 🎨 Customização

### Alterar Estilo Visual

```typescript
// components/chat/admin-ai-chat-widget.tsx

// Botão de abrir chat (gradiente)
<button className="bg-gradient-to-r from-blue-600 to-indigo-600">

// Cabeçalho do chat
<div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">

// Cor do ícone
<HelpCircle className="h-6 w-6" /> // Mudar ícone se desejar
```

### Adicionar Mais Perguntas Rápidas

```typescript
const quickQuestions = [
  "Como adicionar um profissional?",
  "Como funciona o sistema de caixa?",
  "Explicar sistema de permissões",
  "Como exportar relatórios?",
  // ➕ Adicione mais aqui:
  "Como cancelar um agendamento?",
  "Diferença entre OWNER e ADMIN?",
  "Como criar despesas recorrentes?",
];
```

### Adicionar Mais Contextos de Página

```typescript
// Exemplo: Adicionar contexto para página de suporte
if (path.includes("/dashboard/suporte")) {
  return "🎫 Você está em Suporte. Posso ajudar com tickets, prioridades ou categorias.";
}
```

### Modificar System Prompt

```typescript
// app/api/chat/admin/route.ts

const systemPrompt = `
// Adicione ou remova seções aqui
// Exemplo: Adicionar instruções específicas

CASOS ESPECIAIS:
- Se perguntarem sobre integração com WhatsApp, explique que está em desenvolvimento
- Sempre mencione a documentação em /ajuda quando relevante
`;
```

---

## 📊 Estatísticas e Limites

### Groq AI (Gratuito)

- **Requests/dia**: 14.400
- **Requests/minuto**: 30
- **Tokens/request**: ~1.024 (resposta)
- **Modelo**: Llama 3.3 70B Versatile
- **Custo**: R$ 0,00 🎉

### Performance

- **Latência média**: 1-3 segundos
- **Taxa de sucesso**: ~99%
- **Contexto mantido**: Toda a conversa (até limite de tokens)

---

## 🔐 Segurança

### Validações Implementadas

- ✅ Usuário deve estar autenticado (session via NextAuth)
- ✅ Apenas rotas `/dashboard/*` têm acesso ao widget
- ✅ Context inclui apenas dados não-sensíveis (página, role)
- ✅ API não expõe dados de outros salões

### Dados NÃO Enviados

- ❌ IDs de sessões
- ❌ Tokens de autenticação
- ❌ Dados financeiros detalhados
- ❌ Informações de outros usuários

---

## 🚀 Testes

### Checklist de Validação

- [ ] Widget aparece em todas as páginas admin
- [ ] Ícone flutuante fixo no canto inferior direito
- [ ] Auto-sugestão aparece ao mudar de página
- [ ] Perguntas rápidas funcionam corretamente
- [ ] Chat mantém histórico de conversas
- [ ] Scroll automático para última mensagem
- [ ] Responsivo (mobile e desktop)
- [ ] Fecha ao clicar no X
- [ ] Reabre mantendo conversa anterior

### Testes por Página

| Página | Teste | Status |
|--------|-------|--------|
| Dashboard | Pergunta sobre métricas | ⏸️ |
| Caixa | Pergunta sobre pagamento parcial | ⏸️ |
| Agendamentos | Pergunta sobre confirmação | ⏸️ |
| Profissionais | Pergunta sobre horários | ⏸️ |
| Serviços | Pergunta sobre preços | ⏸️ |
| Relatórios | Pergunta sobre exportação CSV | ⏸️ |
| Financeiro | Pergunta sobre lucro | ⏸️ |
| Usuários | Pergunta sobre permissões | ⏸️ |

---

## 🐛 Troubleshooting

### Widget não aparece

**Solução 1**: Verificar se está autenticado
```bash
# Abrir DevTools → Application → Session Storage
# Deve existir next-auth.session-token
```

**Solução 2**: Verificar rota atual
```typescript
// O widget só aparece em rotas /dashboard/*
console.log(window.location.pathname);
```

### Respostas lentas

**Causa**: Groq API pode ter latência variável
**Solução**: Adicionar timeout e fallback:

```typescript
const response = await fetch("/api/chat/admin", {
  signal: AbortSignal.timeout(10000), // 10s timeout
});
```

### Erro 500 na API

**Verificar**:
1. `GROQ_API_KEY` está configurada?
2. Formato do request está correto?
3. Logs do servidor: `npm run dev` (terminal)

```bash
# Ver logs detalhados
console.log("Erro no chat admin:", error);
```

---

## 📚 Recursos Adicionais

- [Groq AI Documentation](https://console.groq.com/docs)
- [Llama 3.3 Model Card](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct)
- [Next.js App Router](https://nextjs.org/docs/app)
- [usePathname Hook](https://nextjs.org/docs/app/api-reference/functions/use-pathname)

---

## 🎯 Roadmap Futuro

### Curto Prazo (1-2 semanas)
- [ ] Adicionar análise de métricas em tempo real
- [ ] Sugerir ações baseado em padrões de uso
- [ ] Atalho de teclado (Ctrl+/)

### Médio Prazo (1-2 meses)
- [ ] Voice input (microfone)
- [ ] Screenshots contextuais
- [ ] Histórico persistente (banco de dados)

### Longo Prazo (3-6 meses)
- [ ] Analytics de perguntas comuns
- [ ] Fine-tuning do modelo com dados reais
- [ ] Multi-idioma (EN, ES)

---

## 📝 Changelog

### v1.0.0 (2025-01-XX)
- ✅ Lançamento inicial
- ✅ Detecção de contexto por página
- ✅ 8 páginas suportadas
- ✅ 4 perguntas rápidas
- ✅ Integração com Groq AI
- ✅ Auto-sugestões ao navegar

---

**Desenvolvido com ❤️ para o Sistema AgendaSalão**
