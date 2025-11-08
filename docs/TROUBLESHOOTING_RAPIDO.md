# 🔧 Guia Rápido: Resolver Slots Não Pintando

## ⚡ Solução em 5 Minutos

### **PASSO 1: PostgreSQL Rodando?**
```bash
sudo systemctl status postgresql
```

**Se não estiver rodando:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql  # Inicia automaticamente
```

---

### **PASSO 2: Dados Existem?**
```bash
cd /media/araudata/829AE33A9AE328FD1/UBUNTU/empresa_de_apps
npx tsx scripts/test-schedule-api.ts
```

**Esperado:**
```
✅ Profissional: João Estilista
📊 Agendamentos encontrados: 1
   1. 10:00 - 10:40 | Degradê (40min)

Grade de horários:
   10:00 🔴 Ocupado
   10:15 🔴 Ocupado
   10:30 🔴 Ocupado
```

**Se aparecer "Nenhum agendamento":**
```bash
npx prisma db seed
```

---

### **PASSO 3: Iniciar Servidor**
```bash
npm run dev
```

**Aguarde:**
```
✓ Ready in 2s
○ Local: http://localhost:3000
```

---

### **PASSO 4: Testar no Navegador**

#### **4.1 Abrir DevTools (F12)**
1. Acesse: `http://localhost:3000/agendar`
2. Pressione **F12** (abre Developer Tools)
3. Vá para a aba **"Console"**

#### **4.2 Realizar Agendamento**
1. Escolha: **"Agendamento Dinâmico"**
2. Selecione: **Serviço** (ex: Degradê - 40min)
3. Selecione: **Profissional** (ex: João Estilista)
4. Selecione: **Data** (escolha **amanhã: 08/11/2025**)

#### **4.3 Verificar Console**
Deve aparecer:
```
🔍 Buscando horários: /api/schedule/available?staffId=...&date=2025-11-08&duration=40
📊 Resposta da API: { available: true, timeOptions: [...], ... }
✅ Horários disponíveis: 25
❌ Horários ocupados: 11
📊 Estatísticas: { total: 36, available: 25, occupied: 11, bookings: 1 }
```

#### **4.4 Verificar Grade Visual**
Deve aparecer:
```
┌─────┬─────┬─────┬─────┐
│10:00│10:15│10:30│10:45│
│ 🔴  │ 🔴  │ 🔴  │ 🟢  │  ← SLOTS VERMELHOS!
└─────┴─────┴─────┴─────┘
```

---

## 🚨 Erros Comuns

### **Erro 1: "Failed to fetch"**
**Causa:** Servidor não está rodando  
**Solução:**
```bash
npm run dev
```

---

### **Erro 2: "Prisma Client: Can't reach database server"**
**Causa:** PostgreSQL parado  
**Solução:**
```bash
sudo systemctl start postgresql
```

**Verificar se conecta:**
```bash
psql -U postgres -d agendasalao -c "SELECT 1;"
```

---

### **Erro 3: "Nenhum profissional encontrado"**
**Causa:** Banco vazio  
**Solução:**
```bash
npx prisma db seed
```

---

### **Erro 4: Slots NÃO aparecem vermelhos (mas API retorna correto)**
**Causa:** Cache do navegador  
**Solução:**
```
Ctrl + Shift + R (ou Cmd + Shift + R no Mac)
```

Ou:
1. F12 → Network tab
2. ✅ Check "Disable cache"
3. Recarregar página

---

### **Erro 5: timeOptions está vazio**
**Causa:** Profissional não trabalha neste dia  
**Solução:**

Verificar `workDays` do profissional:
```bash
npx prisma studio
```

1. Abra tabela `Staff`
2. Verifique campo `workDays`
3. Deve conter: `"1,2,3,4,5"` (seg-sex) ou `"0,1,2,3,4,5,6"` (todos os dias)
4. Dia da semana: 0=domingo, 1=segunda, ..., 6=sábado

**Amanhã (08/11/2025) é uma Sexta-feira (dia 5)**

Se `workDays` não contém `5`, adicione:
```sql
UPDATE "Staff" SET "workDays" = '1,2,3,4,5' WHERE id = 'staff-id';
```

---

## 🎯 Checklist Rápido

- [ ] PostgreSQL rodando (`sudo systemctl status postgresql`)
- [ ] Dados no banco (`npx tsx scripts/test-schedule-api.ts`)
- [ ] Servidor rodando (`npm run dev`)
- [ ] Console do navegador aberto (F12)
- [ ] Cache limpo (Ctrl+Shift+R)
- [ ] Data selecionada é um dia de trabalho do profissional
- [ ] Há agendamentos para testar (ou rode `npx prisma db seed`)

---

## 📸 Compartilhe Screenshot

Se ainda não funcionar, tire um screenshot de:

1. **Terminal (servidor rodando):**
   ```
   npm run dev
   ```

2. **Console do navegador (F12 → Console):**
   - Deve mostrar logs: `🔍 Buscando horários...`
   - E resposta: `📊 Resposta da API: {...}`

3. **Network tab (F12 → Network):**
   - Filtrar por: `available`
   - Clicar na requisição
   - Mostrar **Response**

4. **Tela da grade de horários:**
   - Mostre os botões (se estão vermelhos ou verdes)

---

## ✅ Como Saber Se Está Funcionando

### **Backend (Terminal):**
```bash
npx tsx scripts/test-schedule-api.ts
```
```
✅ Profissional: João Estilista
📊 Agendamentos encontrados: 1

Grade de horários:
   10:00 🔴 Ocupado  ← CORRETO
   10:15 🔴 Ocupado  ← CORRETO
   10:30 🔴 Ocupado  ← CORRETO
   10:45 🟢 Disponível
```

### **Frontend (Console do Navegador - F12):**
```
🔍 Buscando horários: /api/schedule/available?staffId=...
📊 Resposta da API: { available: true, timeOptions: [...] }
✅ Horários disponíveis: 25
❌ Horários ocupados: 11
```

### **Visual (Tela):**
```
Estatísticas:
📅 1 agendamento hoje
✅ 25 disponíveis
❌ 11 ocupados

Grade:
┌─────┬─────┬─────┬─────┐
│10:00│10:15│10:30│10:45│
│ 🔴  │ 🔴  │ 🔴  │ 🟢  │  ← VERMELHO = OCUPADO ✅
└─────┴─────┴─────┴─────┘
```

---

## 🎉 Quando Estiver Funcionando

Você verá:
- ✅ Slots **10:00, 10:15, 10:30** em **VERMELHO** 🔴
- ✅ Ícone **🔴** no canto superior direito dos slots ocupados
- ✅ Cursor **"not-allowed"** ao passar o mouse
- ✅ Slots **desabilitados** (não clicáveis)
- ✅ Tooltip: **"❌ Já possui agendamento"**
- ✅ Estatísticas: **"❌ 11 ocupados"**

**O sistema ESTÁ correto! É só configurar o ambiente! 🚀**
