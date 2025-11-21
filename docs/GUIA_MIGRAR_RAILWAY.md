# 🚀 Guia Rápido: Executar Migração no Railway

## ⚡ Método Mais Simples (Via Navegador)

### 1️⃣ Verificar Status

Acesse (GET):
```
https://salao-production.up.railway.app/api/admin/migrate-addresses
```

Resposta esperada:
```json
{
  "needsMigration": 2,
  "alreadyMigrated": 1,
  "total": 3,
  "message": "2 salão(ões) precisam de migração"
}
```

### 2️⃣ Executar Migração

**Opção A: Via Postman/Insomnia**
- Método: **POST**
- URL: `https://salao-production.up.railway.app/api/admin/migrate-addresses`
- Headers: 
  ```
  Cookie: next-auth.session-token=SEU_TOKEN
  ```

**Opção B: Via cURL (Terminal)**
```bash
curl -X POST https://salao-production.up.railway.app/api/admin/migrate-addresses \
  -H "Cookie: next-auth.session-token=SEU_TOKEN"
```

**Opção C: Via Código JavaScript (Console do Navegador)**

1. Acesse o site em produção: https://salao-production.up.railway.app
2. Faça login como OWNER/ADMIN
3. Abra o Console (F12 → Console)
4. Cole e execute:

```javascript
fetch('/api/admin/migrate-addresses', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => {
  console.log('✅ Migração concluída!');
  console.log(data);
})
.catch(err => console.error('❌ Erro:', err));
```

### 3️⃣ Verificar Resultado

Resposta esperada:
```json
{
  "message": "Migração concluída",
  "total": 2,
  "updated": 2,
  "skipped": 0,
  "errors": 0,
  "details": [
    {
      "salonId": "abc123",
      "salonName": "Boca Aberta",
      "status": "success",
      "extracted": {
        "street": "Rua Augusto Gawleta",
        "number": "256",
        "neighborhood": "Estação",
        "city": "Araucária",
        "state": "PR"
      }
    }
  ]
}
```

### 4️⃣ Validar

1. Acesse: https://salao-production.up.railway.app/dashboard/meu-salao
2. Verifique se os campos aparecem preenchidos:
   - ✅ CEP
   - ✅ Logradouro
   - ✅ Número
   - ✅ Bairro
   - ✅ Cidade
   - ✅ Estado

---

## 🔧 Método Alternativo (Railway CLI)

Se preferir usar terminal:

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Conectar ao projeto
railway link

# 4. Executar script
railway run node scripts/fix-salon-addresses.js
```

---

## 📊 Fluxo Completo

```
┌─────────────────────────────────────────┐
│  1. Fazer login no site em produção    │
│     https://salao...railway.app         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  2. Abrir Console do Navegador (F12)   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  3. Colar e executar código JavaScript │
│     fetch('/api/admin/migrate-addres... │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  4. Aguardar resposta (2-5 segundos)   │
│     ✅ "Migração concluída"             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  5. Acessar /dashboard/meu-salao        │
│     Confirmar campos preenchidos        │
└─────────────────────────────────────────┘
```

---

## ⚠️ Segurança

A API tem proteções:
- ✅ Requer autenticação (session token)
- ✅ Apenas OWNER/ADMIN podem executar
- ✅ Não afeta salões já migrados
- ✅ Logs completos no servidor
- ✅ Rollback não necessário (apenas adiciona dados)

---

## 🐛 Troubleshooting

### Erro: "Não autorizado"
**Solução**: Faça login no site antes de executar

### Erro: "Todos os salões já foram migrados"
**Status**: ✅ Tudo OK! Nada para fazer

### Campos ainda vazios após migração
**Verificar**:
1. Logs da migração (detalhes de cada salão)
2. Se o endereço original tem formato parseável
3. Se o salão foi criado com `address` preenchido

### Como desfazer?
Não é necessário! A migração:
- Não apaga dados existentes
- Apenas preenche campos vazios
- Mantém `address` original intacto

---

## ✅ Checklist Final

- [ ] Login feito em produção
- [ ] Migração executada (POST /api/admin/migrate-addresses)
- [ ] Resposta confirmando sucesso
- [ ] Página "Meu Salão" testada
- [ ] Campos de endereço visíveis e corretos
- [ ] Edição de dados funciona normalmente

---

**Tempo estimado**: 2 minutos  
**Dificuldade**: ⭐ Fácil  
**Reversível**: ✅ Sim (não apaga dados)
