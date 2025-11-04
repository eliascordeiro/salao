# 🛠️ Guia: Instalar PostgreSQL no Ubuntu

## Por Que Instalar PostgreSQL Local?

✅ **Mesma tecnologia da produção** (Railway usa PostgreSQL)  
✅ **Evita problemas de compatibilidade** (SQLite tem limitações)  
✅ **Desenvolvimento mais próximo da realidade**  
✅ **Não precisa estar online** para desenvolver  

---

## 📦 Instalação Rápida (Ubuntu/Debian)

### 1. Instalar PostgreSQL

```bash
# Atualizar repositórios
sudo apt update

# Instalar PostgreSQL (versão 14 ou superior)
sudo apt install postgresql postgresql-contrib -y

# Verificar status
sudo systemctl status postgresql
```

### 2. Configurar Senha do Usuário postgres

```bash
# Entrar no PostgreSQL
sudo -u postgres psql

# Dentro do psql, executar:
ALTER USER postgres PASSWORD 'postgres';

# Sair
\q
```

### 3. Criar Banco de Dados

```bash
# Criar banco 'agendasalao'
sudo -u postgres createdb agendasalao

# Verificar se foi criado
sudo -u postgres psql -c "\l" | grep agendasalao
```

### 4. Aplicar Migrations

```bash
# Voltar para pasta do projeto
cd /media/araudata/829AE33A9AE328FD1/UBUNTU/empresa_de_apps

# Gerar Prisma Client
npx prisma generate

# Aplicar migrations
npx prisma migrate deploy

# OU resetar e aplicar tudo (cuidado: apaga dados)
npx prisma migrate reset --force
```

### 5. Popular com Dados de Teste

```bash
# Executar seed local
npm run db:seed:local

# OU executar seed de produção
npm run db:seed:prod
```

### 6. Iniciar Aplicação

```bash
npm run dev
```

### 7. Testar Login

- URL: http://localhost:3000
- Email: `admin@agendasalao.com.br`
- Senha: `admin123`

---

## 🔍 Verificação Pós-Instalação

```bash
# Ver versão
psql --version

# Verificar se está rodando
sudo systemctl status postgresql

# Ver bancos de dados
sudo -u postgres psql -c "\l"

# Ver tabelas do banco agendasalao
sudo -u postgres psql -d agendasalao -c "\dt"

# Ver usuários cadastrados
sudo -u postgres psql -d agendasalao -c "SELECT email, role FROM \"User\";"
```

---

## 🆘 Solução de Problemas

### PostgreSQL não inicia

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql
```

### Erro de conexão (peer authentication)

Edite `/etc/postgresql/*/main/pg_hba.conf`:

```bash
# Encontrar arquivo
sudo find /etc/postgresql -name pg_hba.conf

# Editar (substitua XX pela versão)
sudo nano /etc/postgresql/XX/main/pg_hba.conf

# Mudar esta linha:
# local   all   postgres   peer
# PARA:
local   all   postgres   md5

# Reiniciar
sudo systemctl restart postgresql
```

### Porta já em uso

```bash
# Ver o que está na porta 5432
sudo lsof -i :5432

# Matar processo (se necessário)
sudo kill -9 PID
```

### Esqueci senha do postgres

```bash
# Resetar senha
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nova-senha';
\q

# Atualizar .env com nova senha
```

---

## 🎯 Comandos Úteis PostgreSQL

```bash
# Entrar no psql
sudo -u postgres psql

# Listar bancos
\l

# Conectar a um banco
\c agendasalao

# Listar tabelas
\dt

# Ver estrutura de uma tabela
\d "User"

# Executar query
SELECT * FROM "User";

# Sair
\q
```

---

## 📊 Comparação: PostgreSQL vs SQLite

| Aspecto | PostgreSQL | SQLite |
|---------|-----------|--------|
| **Compatibilidade produção** | ✅ Idêntico | ⚠️ Diferente |
| **Instalação** | ⚠️ Requer instalação | ✅ Arquivo local |
| **Performance** | ✅ Alta | ⚠️ Limitada |
| **Tipos de dados** | ✅ Completo | ⚠️ Limitado |
| **Relacionamentos** | ✅ Robusto | ⚠️ Básico |
| **Migrations** | ✅ Sem problemas | ⚠️ Pode dar erro |

---

## ✅ Checklist de Instalação

- [ ] PostgreSQL instalado (`psql --version`)
- [ ] PostgreSQL rodando (`systemctl status postgresql`)
- [ ] Senha configurada (postgres/postgres)
- [ ] Banco 'agendasalao' criado
- [ ] .env configurado com DATABASE_URL correto
- [ ] Migrations aplicadas (`npx prisma migrate deploy`)
- [ ] Seed executado (`npm run db:seed:local`)
- [ ] Login funcionando (admin@agendasalao.com.br)

---

## 🚀 Depois de Instalar

1. ✅ PostgreSQL rodando
2. ✅ Banco criado e populado
3. ✅ Aplicação conecta sem erros
4. ✅ Login funciona perfeitamente
5. ✅ Pronto para desenvolver!

---

**Tempo estimado**: 10-15 minutos  
**Dificuldade**: Fácil  
**Recomendação**: ⭐⭐⭐⭐⭐ Instale! Vale a pena!
