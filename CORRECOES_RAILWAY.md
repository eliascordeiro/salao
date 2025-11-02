# 🔧 Correções para Deploy no Railway

## ❌ Problemas Encontrados

### 1. Conflito de Dependências - nodemailer
**Erro:** `ERESOLVE could not resolve`
- **Causa:** `next-auth@4.24.5` requer `nodemailer@^6.6.5`
- **Encontrado:** `nodemailer@^7.0.10` (versão incompatível)

### 2. Railway Ignorando railway.json
**Problema:** Railway usava `npm ci` (estrito) ao invés do comando customizado
- **Causa:** Nixpacks detecta automaticamente e ignora `railway.json`
- **Sintoma:** Build falhava mesmo com `--legacy-peer-deps` no railway.json

### 3. Node.js 18 ao invés de Node.js 20
**Problema:** Nixpacks detectava Node.js 18 automaticamente
- **Causa:** Falta de arquivo `.nvmrc` ou configuração explícita

---

## ✅ Soluções Aplicadas

### 1. Downgrade do nodemailer
```json
// package.json
"nodemailer": "^6.10.1"  // era ^7.0.10
```

### 2. Arquivo .nvmrc
```
20
```
- Garante uso do Node.js 20

### 3. Arquivo nixpacks.toml (PRINCIPAL)
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'npm-10_x', 'openssl']

[phases.install]
cmds = ['npm install --legacy-peer-deps']

[phases.build]
cmds = ['npx prisma generate', 'npm run build']

[start]
cmd = 'npx prisma migrate deploy && npm start'
```

**Por que funciona:**
- ✅ Força Node.js 20 e npm 10
- ✅ Usa `npm install --legacy-peer-deps` ao invés de `npm ci`
- ✅ Sobrescreve detecção automática do Nixpacks
- ✅ Railway prioriza `nixpacks.toml` sobre auto-detecção

---

## 📋 Commits Feitos

1. **aea42b6** - Downgrade nodemailer para v6.9.15
2. **2aca287** - Configura Node.js 20 e legacy-peer-deps (.nvmrc + railway.json)
3. **3fea4db** - Adiciona nixpacks.toml (SOLUÇÃO DEFINITIVA)

---

## 🚀 Resultado Esperado

Agora o Railway deve:
1. ✅ Detectar `nixpacks.toml`
2. ✅ Usar Node.js 20 + npm 10
3. ✅ Instalar dependências com `--legacy-peer-deps`
4. ✅ Gerar Prisma Client
5. ✅ Fazer build do Next.js
6. ✅ Rodar migrations no deploy
7. ✅ Iniciar servidor

**Tempo estimado:** 3-5 minutos

---

## 🔍 Como Verificar

No Railway, em **Deployments** → **Build Logs**, você deve ver:

```
============== Using Nixpacks ==============
Setup    | nodejs_20, npm-10_x, openssl
Install  | npm install --legacy-peer-deps
Build    | npx prisma generate && npm run build
Start    | npx prisma migrate deploy && npm start
```

---

## 📝 Notas Técnicas

### Por que npm ci falhou?
- `npm ci` usa `package-lock.json` estritamente
- Não aceita conflitos de peer dependencies
- Requer `--legacy-peer-deps` ou `--force`

### Por que railway.json não funcionou?
- Railway usa Nixpacks para auto-detecção
- `railway.json` é apenas sugestão, não mandatório
- `nixpacks.toml` tem prioridade sobre auto-detecção

### Alternativas Tentadas
1. ❌ `railway.json` com buildCommand - Ignorado
2. ❌ `.nvmrc` apenas - Não suficiente
3. ✅ `nixpacks.toml` - FUNCIONOU!

---

## 🎯 Próximos Passos

Após build bem-sucedido:

1. **Configurar Variáveis de Ambiente** no Railway
2. **Adicionar PostgreSQL** (+ New → Database → PostgreSQL)
3. **Popular banco** com `railway run npm run db:seed`
4. **Acessar aplicação** na URL fornecida

---

**Status:** ✅ CORREÇÕES APLICADAS - AGUARDANDO REBUILD
**Última atualização:** 2 de novembro de 2025
