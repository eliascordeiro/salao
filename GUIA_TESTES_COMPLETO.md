# 🧪 GUIA DE TESTES COMPLETO

## 🚀 INICIAR O SISTEMA

```bash
# 1. Certifique-se que está no diretório do projeto
cd /media/araudata/829AE33A9AE328FD1/UBUNTU/empresa_de_apps

# 2. Iniciar o servidor de desenvolvimento
npm run dev

# 3. Aguardar a mensagem:
# ✓ Ready in XXXms
# ○ Local: http://localhost:3000
```

---

## 📋 CHECKLIST DE TESTES

### ✅ **1. LANDING PAGE**

**URL:** `http://localhost:3000`

**Testes:**
- [ ] Página carrega sem erros
- [ ] Hero section visível
- [ ] Features aparecem
- [ ] Estatísticas aparecem
- [ ] Botões "Começar Agora" funcionam
- [ ] Footer completo
- [ ] Responsivo (testar mobile/tablet)

---

### ✅ **2. AUTENTICAÇÃO**

#### Login
**URL:** `http://localhost:3000/login`

**Credenciais de Teste:**
```
Admin:
Email: admin@agendasalao.com.br
Senha: admin123

Cliente:
Email: pedro@exemplo.com
Senha: cliente123
```

**Testes:**
- [ ] Fazer login como admin → redireciona para /dashboard
- [ ] Fazer login como cliente → redireciona para /dashboard
- [ ] Tentar login com senha errada → mostra erro
- [ ] Ver credenciais de teste na página
- [ ] Link "Criar conta" funciona

#### Registro
**URL:** `http://localhost:3000/register`

**Testes:**
- [ ] Criar nova conta com dados válidos
- [ ] Ver erro com email já existente
- [ ] Ver erro com campos vazios
- [ ] Ver erro com senha fraca
- [ ] Redireciona após criar conta
- [ ] Link "Já tem conta?" funciona

#### Logout
**Testes:**
- [ ] Fazer logout → redireciona para /
- [ ] Tentar acessar /dashboard após logout → redireciona para /login

---

### ✅ **3. DASHBOARD PRINCIPAL**

**URL:** `http://localhost:3000/dashboard`

**Pré-requisito:** Login como admin

**Testes:**
- [ ] Ver estatísticas:
  - [ ] Total de agendamentos
  - [ ] Agendamentos hoje
  - [ ] Próximos agendamentos
  - [ ] Serviços ativos
- [ ] Ver próximos agendamentos (cards)
- [ ] Ver dados do usuário no header
- [ ] Menu de navegação funciona
- [ ] Botão de logout funciona

---

### ✅ **4. GESTÃO DE SERVIÇOS**

#### Listar Serviços
**URL:** `http://localhost:3000/dashboard/servicos`

**Testes:**
- [ ] Ver 5 serviços pré-cadastrados:
  - [ ] Corte de Cabelo Masculino
  - [ ] Corte de Cabelo Feminino
  - [ ] Barba Completa
  - [ ] Design de Sobrancelhas
  - [ ] Hidratação Capilar
- [ ] Ver informações de cada serviço:
  - [ ] Nome e descrição
  - [ ] Preço formatado (R$)
  - [ ] Duração (minutos)
  - [ ] Categoria
  - [ ] Status (ativo/inativo)
  - [ ] Profissionais associados
  - [ ] Total de agendamentos
- [ ] Botão "Novo Serviço" aparece
- [ ] Botão "Editar" aparece em cada card
- [ ] Botão "Deletar" aparece em cada card

#### Criar Serviço
**URL:** `http://localhost:3000/dashboard/servicos/novo`

**Dados de Teste:**
```
Nome: Tratamento de Pele
Descrição: Limpeza profunda e hidratação facial
Duração: 90
Preço: 150.00
Categoria: Estética
Salão: (selecionar o único disponível)
Profissionais: (selecionar Maria e/ou João)
```

**Testes:**
- [ ] Preencher formulário completo
- [ ] Clicar "Salvar Serviço"
- [ ] Ver redirecionamento para listagem
- [ ] Ver novo serviço na lista
- [ ] Tentar criar sem nome → ver erro
- [ ] Tentar criar sem duração → ver erro
- [ ] Tentar criar sem preço → ver erro
- [ ] Tentar criar sem salão → ver erro
- [ ] Botão "Cancelar" funciona

#### Editar Serviço
**URL:** `http://localhost:3000/dashboard/servicos/[id]/editar`

**Testes:**
- [ ] Clicar em "Editar" em um serviço
- [ ] Ver formulário pré-preenchido
- [ ] Alterar nome
- [ ] Alterar preço
- [ ] Adicionar/remover profissionais
- [ ] Mudar status (ativo/inativo)
- [ ] Clicar "Salvar Alterações"
- [ ] Ver mudanças refletidas na listagem

#### Deletar Serviço
**Testes:**
- [ ] Clicar no ícone de lixeira
- [ ] Ver confirmação "Tem certeza?"
- [ ] Confirmar exclusão
- [ ] Ver serviço removido da lista
- [ ] Cancelar exclusão → serviço permanece

---

### ✅ **5. GESTÃO DE PROFISSIONAIS**

#### Listar Profissionais
**URL:** `http://localhost:3000/dashboard/profissionais`

**Testes:**
- [ ] Ver 2 profissionais pré-cadastrados:
  - [ ] Maria Silva (Cabeleireira)
  - [ ] João Santos (Barbeiro)
- [ ] Ver informações de cada profissional:
  - [ ] Nome e especialidade
  - [ ] Email e telefone
  - [ ] Salão
  - [ ] Status (ativo/inativo)
  - [ ] Serviços prestados (badges)
  - [ ] Total de agendamentos
- [ ] Botão "Novo Profissional" aparece
- [ ] Botão "Editar" aparece em cada card
- [ ] Botão "Deletar" aparece em cada card

#### Criar Profissional
**URL:** `http://localhost:3000/dashboard/profissionais/novo`

**Dados de Teste:**
```
Nome: Ana Costa
Email: ana@exemplo.com
Telefone: (11) 98765-4321
Especialidade: Manicure
Salão: (selecionar o único disponível)
Status: Ativo ✓
```

**Testes:**
- [ ] Preencher formulário completo
- [ ] Clicar "Salvar Profissional"
- [ ] Ver redirecionamento para listagem
- [ ] Ver novo profissional na lista
- [ ] Tentar criar sem nome → ver erro
- [ ] Tentar criar sem email → ver erro
- [ ] Tentar criar com email inválido → ver erro
- [ ] Tentar criar sem salão → ver erro
- [ ] Botão "Cancelar" funciona

#### Editar Profissional
**URL:** `http://localhost:3000/dashboard/profissionais/[id]/editar`

**Testes:**
- [ ] Clicar em "Editar" em um profissional
- [ ] Ver formulário pré-preenchido
- [ ] Alterar nome
- [ ] Alterar telefone
- [ ] Alterar especialidade
- [ ] Mudar status (ativo/inativo)
- [ ] Clicar "Salvar Alterações"
- [ ] Ver mudanças refletidas na listagem

#### Deletar Profissional
**Testes:**
- [ ] Clicar no ícone de lixeira
- [ ] Ver confirmação "Tem certeza?"
- [ ] Confirmar exclusão
- [ ] Ver profissional removido da lista
- [ ] Cancelar exclusão → profissional permanece

---

### ✅ **6. GESTÃO DE AGENDAMENTOS**

#### Listar Agendamentos
**URL:** `http://localhost:3000/dashboard/agendamentos`

**Testes:**
- [ ] Ver 2 agendamentos pré-cadastrados
- [ ] Ver estatísticas:
  - [ ] Total
  - [ ] Pendentes (amarelo)
  - [ ] Confirmados (azul)
  - [ ] Concluídos (verde)
  - [ ] Cancelados (vermelho)
- [ ] Ver informações de cada agendamento:
  - [ ] Nome do serviço
  - [ ] Profissional
  - [ ] Status com badge colorido
  - [ ] Data formatada
  - [ ] Hora e duração
  - [ ] Cliente (nome, email, telefone)
  - [ ] Valor
  - [ ] Observações (se houver)

#### Filtros
**Testes:**
- [ ] Clicar "Mostrar Filtros"
- [ ] Ver 4 filtros:
  - [ ] Status
  - [ ] Profissional
  - [ ] Data Início
  - [ ] Data Fim
- [ ] Filtrar por status "Pendente"
- [ ] Ver apenas pendentes
- [ ] Filtrar por profissional
- [ ] Ver apenas do profissional selecionado
- [ ] Filtrar por data
- [ ] Ver apenas da data selecionada
- [ ] Limpar filtros (selecionar "Todos")
- [ ] Ver todos os agendamentos novamente

#### Busca
**Testes:**
- [ ] Digitar nome do cliente na busca
- [ ] Ver filtro em tempo real
- [ ] Buscar por email do cliente
- [ ] Ver resultado correto
- [ ] Buscar por nome do serviço
- [ ] Ver resultado correto
- [ ] Buscar por nome do profissional
- [ ] Ver resultado correto
- [ ] Limpar busca → ver todos novamente

#### Mudança de Status

**Agendamento PENDENTE:**
- [ ] Ver botão "Confirmar" (azul)
- [ ] Ver botão "Cancelar" (vermelho)
- [ ] Clicar "Confirmar"
- [ ] Ver status mudar para CONFIRMED (azul)
- [ ] Ver estatísticas atualizarem
- [ ] Voltar e clicar "Cancelar" em outro
- [ ] Ver status mudar para CANCELLED (vermelho)

**Agendamento CONFIRMADO:**
- [ ] Ver botão "Marcar Concluído" (verde)
- [ ] Ver botão "Não Compareceu" (cinza)
- [ ] Clicar "Marcar Concluído"
- [ ] Ver status mudar para COMPLETED (verde)
- [ ] Ver estatísticas atualizarem
- [ ] Voltar e clicar "Não Compareceu" em outro
- [ ] Ver status mudar para NO_SHOW (cinza)

**Agendamento FINALIZADO:**
- [ ] Ver mensagem "Agendamento finalizado"
- [ ] Não ver botões de ação
- [ ] Status não pode ser alterado

---

### ✅ **7. NAVEGAÇÃO**

#### Header do Dashboard
**Testes:**
- [ ] Clicar no logo → volta para /dashboard
- [ ] Clicar "Dashboard" → vai para /dashboard
- [ ] Clicar "Agendamentos" → vai para /dashboard/agendamentos
- [ ] Clicar "Serviços" → vai para /dashboard/servicos
- [ ] Clicar "Profissionais" → vai para /dashboard/profissionais
- [ ] Ver nome do usuário
- [ ] Ver email do usuário
- [ ] Botão de logout funciona

#### Breadcrumbs
**Testes:**
- [ ] Em "Novo Serviço" → ver link "Voltar para Serviços"
- [ ] Em "Editar Serviço" → ver link "Voltar para Serviços"
- [ ] Em "Novo Profissional" → ver link "Voltar para Profissionais"
- [ ] Em "Editar Profissional" → ver link "Voltar para Profissionais"
- [ ] Clicar nos links → funcionam corretamente

---

### ✅ **8. RESPONSIVIDADE**

#### Mobile (< 768px)
**Testes:**
- [ ] Abrir em celular ou reduzir janela
- [ ] Menu do header funciona
- [ ] Cards em coluna única
- [ ] Formulários legíveis
- [ ] Botões acessíveis
- [ ] Tabelas scrollam horizontalmente

#### Tablet (768px - 1024px)
**Testes:**
- [ ] Cards em 2 colunas
- [ ] Layout bem distribuído
- [ ] Sem sobreposição de elementos

#### Desktop (> 1024px)
**Testes:**
- [ ] Cards em 3 colunas
- [ ] Sidebar fixa (se houver)
- [ ] Layout otimizado para telas grandes

---

### ✅ **9. VALIDAÇÕES**

#### Formulário de Serviços
**Testes:**
- [ ] Nome vazio → erro "Nome é obrigatório"
- [ ] Duração 0 → erro "Duração deve ser maior que 0"
- [ ] Preço 0 → erro "Preço deve ser maior que 0"
- [ ] Salão não selecionado → erro "Salão é obrigatório"

#### Formulário de Profissionais
**Testes:**
- [ ] Nome vazio → erro "Nome é obrigatório"
- [ ] Email vazio → erro "Email é obrigatório"
- [ ] Email inválido → erro "Email inválido"
- [ ] Salão não selecionado → erro "Salão é obrigatório"

#### Autenticação
**Testes:**
- [ ] Email vazio → erro
- [ ] Senha vazia → erro
- [ ] Credenciais inválidas → erro "Credenciais inválidas"

---

### ✅ **10. BANCO DE DADOS**

#### Prisma Studio
**Comando:** `npm run db:studio`

**URL:** `http://localhost:5555`

**Testes:**
- [ ] Abrir Prisma Studio
- [ ] Ver tabelas:
  - [ ] User (2 registros)
  - [ ] Salon (1 registro)
  - [ ] Staff (2 registros)
  - [ ] Service (5 registros)
  - [ ] Booking (2 registros)
  - [ ] ServiceStaff (relações)
- [ ] Ver dados consistentes
- [ ] Ver relações funcionando

---

### ✅ **11. APIS REST**

#### Testar com curl (opcional)

**Listar Serviços:**
```bash
curl http://localhost:3000/api/services
```

**Listar Profissionais:**
```bash
curl http://localhost:3000/api/staff
```

**Listar Agendamentos:**
```bash
curl http://localhost:3000/api/bookings
```

**Listar Salões:**
```bash
curl http://localhost:3000/api/salons
```

**Testes:**
- [ ] Todas as APIs retornam JSON
- [ ] Status 200 para sucesso
- [ ] Status 401 sem autenticação
- [ ] Status 403 sem permissão

---

## 🐛 TROUBLESHOOTING

### Problema: Não consigo fazer login
**Solução:**
```bash
# Repovoar o banco de dados
npm run db:seed

# Tentar novamente com:
# admin@agendasalao.com.br / admin123
```

### Problema: Página não carrega
**Solução:**
```bash
# Verificar se o servidor está rodando
# Deve mostrar: ✓ Ready in XXXms

# Se não estiver, reiniciar:
npm run dev
```

### Problema: Dados não aparecem
**Solução:**
```bash
# Verificar o banco de dados
npm run db:studio

# Se estiver vazio, popular:
npm run db:seed
```

### Problema: Erro de compilação TypeScript
**Solução:**
```bash
# Instalar types do bcrypt
npm i --save-dev @types/bcryptjs

# Ou ignorar (não afeta funcionamento)
```

### Problema: Redirecionamento não funciona
**Solução:**
- Fazer logout
- Limpar cookies do navegador
- Fazer login novamente

---

## ✅ CHECKLIST FINAL

Antes de considerar completo, verifique:

- [ ] ✅ Landing page carrega
- [ ] ✅ Login funciona (admin e cliente)
- [ ] ✅ Dashboard mostra estatísticas
- [ ] ✅ Serviços: listar, criar, editar, deletar
- [ ] ✅ Profissionais: listar, criar, editar, deletar
- [ ] ✅ Agendamentos: listar, filtrar, mudar status
- [ ] ✅ Navegação funciona
- [ ] ✅ Logout funciona
- [ ] ✅ Responsivo em mobile
- [ ] ✅ Validações funcionam
- [ ] ✅ Banco de dados populado

---

## 🎉 CONCLUSÃO

Se todos os testes passaram:

```
██████████████████████████████████████ 100%

✅ TODOS OS TESTES PASSARAM!
✅ SISTEMA 100% FUNCIONAL!
✅ PRONTO PARA PRODUÇÃO!
```

**Parabéns!** 🎊

Seu sistema de gestão para salões está completamente funcional e testado!

---

## 📞 SUPORTE

Problemas? Verifique:
1. Console do navegador (F12)
2. Terminal do servidor (npm run dev)
3. Prisma Studio (npm run db:studio)
4. Documentação nos arquivos .md

**Tempo estimado de testes: 30-45 minutos**
