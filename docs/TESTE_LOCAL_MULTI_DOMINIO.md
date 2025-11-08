# Teste Local Multi-Domínio

Guia para testar o sistema de Route Groups multi-domínio localmente antes do deploy.

## 📋 Pré-requisitos

- Node.js rodando
- Permissões para editar `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows)

## 🔧 Configuração do Hosts File

### Linux/Mac

1. Abra o terminal com sudo:
```bash
sudo nano /etc/hosts
```

2. Adicione as seguintes linhas no final:
```
127.0.0.1 www.agendasalao.local
127.0.0.1 app.agendasalao.local
127.0.0.1 dashboard.agendasalao.local
```

3. Salve (Ctrl+O, Enter, Ctrl+X)

### Windows

1. Abra o Bloco de Notas como Administrador
2. Abra `C:\Windows\System32\drivers\etc\hosts`
3. Adicione:
```
127.0.0.1 www.agendasalao.local
127.0.0.1 app.agendasalao.local
127.0.0.1 dashboard.agendasalao.local
```
4. Salve

## 🚀 Executar Aplicação

```bash
npm run dev
```

O Next.js vai rodar em `http://localhost:3000`

## 🧪 Testes a Realizar

### 1. Portal Marketing (Landing Page)
**URL**: http://www.agendasalao.local:3000

✅ **Deve mostrar:**
- Landing page dual-audience
- Hero com CTAs "Buscar Salões" e "Cadastrar Salão"
- Seção "Como Funciona"
- Benefícios para Clientes e Proprietários
- Footer completo

✅ **Deve funcionar:**
- Login (http://www.agendasalao.local:3000/login)
- Registro (http://www.agendasalao.local:3000/register)
- Cadastro de Salão (http://www.agendasalao.local:3000/cadastro-salao)

❌ **Não deve permitir:**
- Acessar /dashboard → Redireciona para "/"
- Acessar /saloes → Redireciona para "/"

---

### 2. Portal Cliente (App)
**URL**: http://app.agendasalao.local:3000

✅ **Deve mostrar:**
- Listagem de salões (http://app.agendasalao.local:3000/saloes)
- Navbar com logo AgendaSalão
- Menu de usuário (se logado)

✅ **Rotas disponíveis:**
- `/saloes` - Listagem de salões
- `/salao/[id]` - Detalhes do salão
- `/salao/[id]/agendar` - Wizard de agendamento
- `/meus-agendamentos` - Histórico (requer login)

❌ **Não deve permitir:**
- Clientes acessarem /dashboard → Redireciona para /saloes

✅ **Proteção de autenticação:**
- Tentar acessar `/meus-agendamentos` sem login → Redireciona para /login

---

### 3. Portal Admin (Dashboard)
**URL**: http://dashboard.agendasalao.local:3000

✅ **Deve mostrar:**
- Dashboard com estatísticas
- Sidebar com menu completo
- DashboardHeader

✅ **Rotas disponíveis (ADMIN only):**
- `/dashboard` - Dashboard principal
- `/dashboard/servicos` - Gestão de serviços
- `/dashboard/profissionais` - Gestão de profissionais
- `/dashboard/agendamentos` - Gestão de agendamentos
- `/dashboard/relatorios` - Relatórios e analytics
- `/dashboard/pagamentos` - Gestão de pagamentos
- `/dashboard/meu-salao` - Editar dados do salão

❌ **Não deve permitir:**
- Clientes (role=CLIENT) acessarem → Redireciona para /saloes
- Usuários não autenticados → Redireciona para /login

---

## 🔐 Teste de Roles

### Logar como ADMIN
1. Ir para http://www.agendasalao.local:3000/login
2. Email: `admin@agendasalao.com.br`
3. Senha: `admin123`
4. Após login, ir para http://dashboard.agendasalao.local:3000
5. ✅ Deve mostrar o dashboard completo

### Logar como CLIENT
1. Ir para http://www.agendasalao.local:3000/login
2. Email: `pedro@exemplo.com`
3. Senha: `cliente123`
4. Tentar acessar http://dashboard.agendasalao.local:3000
5. ❌ Deve redirecionar para http://app.agendasalao.local:3000/saloes

---

## 🔍 Validações do Middleware

O middleware deve:

1. ✅ Detectar hostname corretamente
2. ✅ Proteger rotas /dashboard (apenas ADMIN)
3. ✅ Proteger rotas /meus-agendamentos (requer login)
4. ✅ Bloquear clientes de acessar dashboard
5. ✅ Bloquear acesso ao dashboard do portal app
6. ✅ Permitir rotas públicas no portal marketing
7. ✅ Redirecionar root "/" baseado no domínio
8. ✅ Proteger APIs /api/bookings e /api/staff (token obrigatório)

---

## 🐛 Debug

Se algo não funcionar:

1. **Verificar console do navegador** (F12)
2. **Verificar terminal Next.js** (erros de compilação)
3. **Verificar network tab** (redirecionamentos)
4. **Verificar cookies NextAuth** (Application > Cookies)

### Comando útil para limpar cache:
```bash
rm -rf .next
npm run dev
```

### Verificar se hosts file foi aplicado:
```bash
ping www.agendasalao.local
# Deve retornar 127.0.0.1
```

---

## ✅ Checklist Final

Antes de fazer deploy:

- [ ] Landing page carrega em www.agendasalao.local
- [ ] Portal cliente carrega em app.agendasalao.local
- [ ] Dashboard carrega em dashboard.agendasalao.local
- [ ] Login funciona em todos os domínios
- [ ] Redirecionamentos de role funcionam
- [ ] Middleware bloqueia acessos não autorizados
- [ ] APIs protegidas retornam 401 sem token
- [ ] Navbar contextual mostra opções corretas por role

---

## 🚀 Próximo Passo: Deploy Railway

Após validar localmente:

1. Fazer commit e push para GitHub
2. Configurar 3 custom domains no Railway
3. Apontar DNS:
   - www.agendasalao.com → CNAME para Railway
   - app.agendasalao.com → CNAME para Railway
   - dashboard.agendasalao.com → CNAME para Railway
4. Aguardar propagação DNS (5-60 min)
5. Testar em produção!

Ver `docs/ARQUITETURA_MULTI_DOMINIO.md` para detalhes.
