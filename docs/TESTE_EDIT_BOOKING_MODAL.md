# Guia de Teste: Modal de Edição de Agendamentos

## Preparação

### 1. Iniciar servidor de desenvolvimento
```bash
cd /media/araudata/28452488-400b-4bd9-9e97-e0023d96c6193/UBUNTU/salao/SalaoBlza
npm run dev
```

### 2. Fazer login como admin
- URL: http://localhost:3000
- Email: admin@agendasalao.com.br
- Senha: admin123

### 3. Navegar para Agendamentos
- Clicar em "Dashboard" no menu
- Clicar em "Agendamentos" na sidebar

## Testes de Edição

### ✅ Teste 1: Pré-seleção de Dados

**Passo a passo:**
1. Localizar qualquer agendamento existente na lista
2. Clicar no botão "Editar" (ícone de lápis)
3. Aguardar modal abrir

**Resultado esperado:**
- [x] Modal "Editar Agendamento" aparece
- [x] Campo "Cliente" mostra nome e email (somente leitura)
- [x] Dropdown "Serviço" mostra serviço atual selecionado
- [x] Dropdown "Profissional" mostra profissional atual selecionado
- [x] Campo "Data" mostra data do agendamento
- [x] Mensagem "Carregando horários..." aparece por 1-2s
- [x] Grid de horários disponíveis carrega automaticamente
- [x] Horário atual do agendamento está destacado em AZUL

**Screenshot esperado:**
```
┌─────────────────────────────────────┐
│     Editar Agendamento         ✖    │
├─────────────────────────────────────┤
│                                     │
│ Cliente                             │
│ ┌─────────────────────────────────┐ │
│ │ João Silva                      │ │
│ │ joao@exemplo.com               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Serviço *                          │
│ [Corte de Cabelo - R$ 35.00 (30min)▼] │
│                                     │
│ Profissional *                     │
│ [Carlos Mendes                    ▼] │
│                                     │
│ Data *                             │
│ [2024-01-15]                       │
│                                     │
│ Horários Disponíveis *             │
│ ┌─────────────────────────────────┐ │
│ │ 08:00  08:30  09:00            │ │
│ │ 09:30  10:00  10:30            │ │
│ │ ■■■■■  14:30  15:00   ← 14:00 AZUL
│ │ 15:30  16:00  ╳╳╳╳╳   ← Ocupado
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancelar]  [Salvar Alterações]   │
└─────────────────────────────────────┘
```

### ✅ Teste 2: Loading de Horários

**Passo a passo:**
1. Clicar em "Editar" em um agendamento
2. Observar área de horários durante carregamento

**Resultado esperado:**
- [x] Aparece spinner giratório (ícone Sparkles)
- [x] Texto "Carregando horários..." visível
- [x] Loading dura 1-3 segundos
- [x] Grid de horários substitui loading automaticamente

**Visual do loading:**
```
Horários Disponíveis *
┌─────────────────────────────────┐
│                                 │
│      ✨ (girando)               │
│   Carregando horários...        │
│                                 │
└─────────────────────────────────┘
```

### ✅ Teste 3: Grid de Horários

**Passo a passo:**
1. Após grid carregar, observar botões de horário

**Resultado esperado:**
- [x] Horários disponíveis: fundo transparente (glass-card)
- [x] Horário atual: fundo AZUL com borda destacada
- [x] Horários ocupados: CINZA 50% opacidade, cursor not-allowed
- [x] Hover em disponível: fundo azul claro
- [x] Clicar em disponível: muda seleção para novo horário

**Estados visuais:**
```
┌─────────────────────────────────┐
│ [08:00]  [08:30]  [09:00]      │ ← Disponíveis (glass-card)
│                                 │
│ [▓14:00▓] [14:30]  [15:00]     │ ← 14:00 SELECIONADO (azul)
│                                 │
│ [░16:00░] [░16:30░]            │ ← Ocupados (cinza)
└─────────────────────────────────┘
```

### ✅ Teste 4: Mudança de Data

**Passo a passo:**
1. No modal de edição, clicar no campo "Data"
2. Selecionar uma data DIFERENTE (ex: próximo dia útil)
3. Aguardar grid recarregar

**Resultado esperado:**
- [x] Ao mudar data, grid limpa imediatamente
- [x] Loading "Carregando horários..." aparece novamente
- [x] Novos horários carregam para a nova data
- [x] Horários disponíveis/ocupados podem ser diferentes
- [x] Seleção de horário é mantida SE estiver disponível na nova data

**Exemplo:**
```
Data original: 15/01/2024 - Horário: 14:00
Mudar para: 16/01/2024
→ Grid recarrega
→ 14:00 pode estar disponível ou ocupado
→ Se disponível, continua selecionado
→ Se ocupado, fica cinza (não pode selecionar)
```

### ✅ Teste 5: Mudança de Profissional

**Passo a passo:**
1. No modal de edição, abrir dropdown "Profissional"
2. Selecionar OUTRO profissional
3. Aguardar grid recarregar

**Resultado esperado:**
- [x] Grid recarrega automaticamente
- [x] Horários mudam conforme expediente do novo profissional
- [x] Horário de almoço pode ser diferente
- [x] Dias de trabalho podem ser diferentes

**Exemplo:**
```
Profissional A: Trabalha 08:00-18:00, almoço 12:00-13:00
→ Slots: 08:00, 08:30, ..., 11:30, [almoço], 13:00, ...

Profissional B: Trabalha 09:00-17:00, sem almoço
→ Slots: 09:00, 09:30, ..., 16:30
```

### ✅ Teste 6: Mudança de Serviço

**Passo a passo:**
1. No modal de edição, abrir dropdown "Serviço"
2. Selecionar OUTRO serviço (com duração diferente)
3. Aguardar grid recarregar

**Resultado esperado:**
- [x] Grid recarrega automaticamente
- [x] Duração do serviço afeta horários disponíveis
- [x] Se novo serviço é mais longo, menos slots disponíveis

**Exemplo:**
```
Serviço A: Corte (30 min)
→ 14:00 disponível se não tem agendamento 14:00-14:30

Serviço B: Corte + Barba (60 min)
→ 14:00 disponível APENAS se 14:00-15:00 estiver livre
```

### ✅ Teste 7: Nenhum Horário Disponível

**Passo a passo:**
1. Editar agendamento
2. Selecionar data onde profissional NÃO trabalha (ex: domingo)
3. OU selecionar data onde todos os horários estão ocupados

**Resultado esperado:**
- [x] Card cinza aparece com ícone de relógio
- [x] Texto: "Nenhum horário disponível"
- [x] Sugestão: "Tente outra data ou profissional"
- [x] Botão "Salvar" continua desabilitado (sem horário selecionado)

**Visual:**
```
Horários Disponíveis *
┌─────────────────────────────────┐
│            🕐                   │
│   Nenhum horário disponível     │
│                                 │
│ O profissional pode não         │
│ trabalhar neste dia ou todos    │
│ os horários estão ocupados.     │
│ Tente outra data ou profissional│
└─────────────────────────────────┘
```

### ✅ Teste 8: Salvar Alterações

**Passo a passo:**
1. Editar agendamento
2. Alterar horário (clicar em slot diferente)
3. Clicar "Salvar Alterações"
4. Aguardar confirmação

**Resultado esperado:**
- [x] Botão muda para "Salvando..." com spinner
- [x] Modal fecha automaticamente após sucesso
- [x] Lista de agendamentos recarrega
- [x] Card do agendamento mostra NOVO horário
- [x] Badge de status continua o mesmo (PENDING/CONFIRMED/etc)

**Antes:**
```
João Silva
Corte de Cabelo - Carlos Mendes
15/01/2024 às 14:00
[Status: Confirmado]
```

**Depois de mudar para 15:00:**
```
João Silva
Corte de Cabelo - Carlos Mendes
15/01/2024 às 15:00  ← MUDOU
[Status: Confirmado]
```

### ✅ Teste 9: Cancelar Edição

**Passo a passo:**
1. Editar agendamento
2. Alterar qualquer campo (serviço, data, horário)
3. Clicar "Cancelar"

**Resultado esperado:**
- [x] Modal fecha imediatamente
- [x] Alterações NÃO são salvas
- [x] Lista de agendamentos permanece inalterada
- [x] Agendamento original continua com dados antigos

## Casos de Erro

### ❌ Erro 1: Tentar salvar sem selecionar horário

**Passo a passo:**
1. Editar agendamento
2. Mudar data para dia sem horários disponíveis
3. Tentar clicar "Salvar Alterações"

**Resultado esperado:**
- [x] Botão "Salvar" está DESABILITADO (opacity 50%)
- [x] Não é possível clicar

### ❌ Erro 2: Conflito de horário

**Passo a passo:**
1. Editar agendamento
2. Tentar selecionar horário JÁ OCUPADO (cinza)

**Resultado esperado:**
- [x] Botão de horário não responde ao clique
- [x] Cursor mostra "not-allowed"
- [x] Seleção não muda

## Checklist Final

Antes de considerar o teste completo, verificar:

- [ ] Modal abre com todos os dados pré-preenchidos
- [ ] Serviço e profissional aparecem nos dropdowns
- [ ] Grid de horários carrega automaticamente
- [ ] Horário atual está destacado em azul
- [ ] Horários ocupados estão em cinza
- [ ] Loading aparece ao mudar data/serviço/profissional
- [ ] Grid recarrega ao mudar qualquer filtro
- [ ] Salvar alterações funciona corretamente
- [ ] Lista atualiza após salvar
- [ ] Cancelar descarta alterações
- [ ] Validações impedem salvar com dados inválidos

## Problemas Conhecidos (Se Encontrar)

### Se horários não carregarem:
1. Verificar console do navegador (F12)
2. Procurar erro 404 ou 500 em /api/schedule/available-slots
3. Verificar se profissional tem horários configurados

### Se serviço/profissional não aparecerem:
1. Verificar se existem serviços/profissionais ativos
2. Verificar console por erros de API

### Se modal não abrir:
1. Verificar console por erros de JavaScript
2. Tentar recarregar a página (F5)

## Sucesso! ✅

Se todos os testes passarem, a funcionalidade está completa e funcionando como esperado.

---
**Última atualização:** Janeiro 2024  
**Tempo estimado de teste:** 15-20 minutos
