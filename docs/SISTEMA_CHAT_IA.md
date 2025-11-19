# 🤖 Sistema de Chat com IA - Assistente Virtual

## 📋 Visão Geral

Sistema de chat inteligente integrado ao sistema de agendamento, usando **Groq AI (Llama 3.1 70B)** para fornecer atendimento automatizado 24/7 aos clientes.

## ✨ Funcionalidades

- ✅ **Chat em tempo real** com IA
- ✅ **Contexto dinâmico** do salão (serviços, preços, horários, profissionais)
- ✅ **Widget flutuante** responsivo
- ✅ **Respostas naturais** em português brasileiro
- ✅ **Interface moderna** com animações
- ✅ **Gratuito** (tier free do Groq)

## 🚀 Configuração

### 1. Obter API Key do Groq (GRATUITO)

1. Acesse: https://console.groq.com
2. Crie uma conta (login com Google/GitHub)
3. Vá em "API Keys"
4. Clique em "Create API Key"
5. Copie a chave gerada

### 2. Configurar Variável de Ambiente

Adicione no arquivo `.env`:

```bash
GROQ_API_KEY="gsk_sua_api_key_aqui"
```

### 3. Configurar no Railway

No painel do Railway:
1. Vá em "Variables"
2. Adicione nova variável:
   - Name: `GROQ_API_KEY`
   - Value: sua chave do Groq
3. Clique em "Deploy"

## 📁 Arquitetura

```
/app/api/chat/route.ts          # API endpoint do chat
/components/chat/
  └── ai-chat-widget.tsx         # Componente do chat widget
```

### API Route (`/api/chat`)

**Endpoint:** `POST /api/chat`

**Request:**
```json
{
  "salonId": "salon_id_here",
  "messages": [
    { "role": "user", "content": "Quanto custa um corte?" }
  ]
}
```

**Response:**
```json
{
  "message": "O corte feminino custa R$ 80,00...",
  "usage": {
    "prompt_tokens": 450,
    "completion_tokens": 120,
    "total_tokens": 570
  }
}
```

### Componente AIChatWidget

**Props:**
- `salonId`: ID do salão (obrigatório)
- `salonName`: Nome do salão (opcional)

**Uso:**
```tsx
import { AIChatWidget } from "@/components/chat/ai-chat-widget"

<AIChatWidget 
  salonId={salon.id} 
  salonName={salon.name} 
/>
```

## 💰 Custos

### Groq (Llama 3.1 70B) - Tier Gratuito

**Limites:**
- 14,400 requests/dia
- 6,000 requests/minuto
- ~200 requests/10 segundos

**Estimativa:**
- 1 conversa = ~500 tokens
- Gratuito até **14k conversas/dia**
- Para uso comercial típico: **R$ 0/mês**

### Quando escalar?

Se ultrapassar 14k conversas/dia, considere:
1. **Groq Paid Plan** - Mesma API, sem limites
2. **OpenAI GPT-4o-mini** - $0.15-0.60/1M tokens
3. **Cache de respostas** - Para perguntas frequentes

## 🎯 Capacidades do Assistente

O assistente virtual pode ajudar com:

✅ **Informações sobre serviços**
- Preços
- Duração
- Descrições

✅ **Informações sobre profissionais**
- Especialidades
- Disponibilidade

✅ **Horários de funcionamento**
- Dias da semana
- Horário de abertura/fechamento

✅ **Localização**
- Endereço completo
- Como chegar

✅ **Agendamento**
- Orienta cliente a usar sistema de agendamento
- Explica processo

❌ **Limitações (por design):**
- Não faz agendamentos diretamente
- Não confirma disponibilidade específica
- Não acessa dados de clientes
- Não processa pagamentos

## 🔒 Segurança

- API key armazenada em variáveis de ambiente
- Nenhum dado sensível enviado ao modelo
- Rate limiting no endpoint
- Validação de entrada

## 📊 Monitoramento

### Logs Disponíveis

A API registra no console:
```
Erro no chat: <detalhes do erro>
```

### Métricas do Groq

Acesse https://console.groq.com/usage para ver:
- Total de requests
- Tokens usados
- Latência média
- Taxa de erro

## 🎨 Personalização

### Ajustar Prompt do Sistema

Edite em `/app/api/chat/route.ts`:

```typescript
const systemPrompt = `
Você é [personalidade]...
[adicione instruções específicas]
`;
```

### Ajustar Aparência

Edite `/components/chat/ai-chat-widget.tsx`:
- Cores: classes `bg-*`, `text-*`
- Tamanho: `w-96 h-[600px]`
- Posição: `bottom-6 right-6`
- Animações: classes `animate-*`

## 🐛 Troubleshooting

### Chat não aparece?
1. Verifique se `GROQ_API_KEY` está configurada
2. Verifique console do navegador
3. Teste endpoint: `POST /api/chat`

### Respostas lentas?
- Groq é muito rápido (1-2s)
- Se lento, verifique:
  - Conexão internet
  - Logs do servidor
  - Status do Groq: https://status.groq.com

### Erro de API Key?
```
Groq API key não configurada
```
- Adicione `GROQ_API_KEY` no `.env`
- Reinicie servidor

## 📈 Roadmap Futuro

**Fase 2:**
- [ ] Histórico de conversas (salvar no DB)
- [ ] Analytics de perguntas frequentes
- [ ] Integração direta com agendamento
- [ ] Sugestões proativas

**Fase 3:**
- [ ] RAG (embeddings para FAQs)
- [ ] Voice input/output
- [ ] WhatsApp integration
- [ ] Multi-idioma

## 🎓 Exemplos de Uso

### Cliente pergunta sobre preço:
```
👤 Cliente: "Quanto custa um corte feminino?"
🤖 IA: "O corte feminino custa R$ 80,00 e dura cerca de 60 minutos. 
       Temos ótimos profissionais especializados! 
       Quer agendar? É só clicar em 'Agendar Agora' 📅"
```

### Cliente pergunta sobre horário:
```
👤 Cliente: "Vocês abrem no sábado?"
🤖 IA: "Trabalhamos de segunda a sexta, das 9h às 18h. 
       Infelizmente não abrimos aos sábados. 
       Posso ajudar com mais alguma coisa? 😊"
```

### Cliente quer agendar:
```
👤 Cliente: "Quero marcar um horário"
🤖 IA: "Que ótimo! Para agendar, clique no botão 'Agendar Agora' 
       acima e escolha o serviço e horário que prefere. 
       Nosso sistema mostra os horários disponíveis em tempo real! ⏰"
```

## 📞 Suporte

Dúvidas sobre implementação?
- Documentação Groq: https://console.groq.com/docs
- Issues: Abra um issue no GitHub do projeto

---

**Desenvolvido com ❤️ usando Groq AI + Next.js**
