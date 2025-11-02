# 🧪 Guia de Teste Manual - Sistema de Slots Recorrentes

## ✅ Sistema Implementado com Sucesso!

O sistema agora permite configurar horários que se repetem semanalmente. Por exemplo:
- Configure "Segunda-feira: 09:00-09:30, 09:30-10:00"
- Esses horários aparecerão **toda segunda-feira** para os clientes

---

## 📋 Passo a Passo para Testar

### 1. **Iniciar o Servidor**
```bash
# Use Node.js 20
source ~/.nvm/nvm.sh
nvm use 20

# Inicie o servidor
npm run dev
```

O servidor estará em: **http://localhost:3001**

---

### 2. **Login como Admin**
1. Acesse: http://localhost:3001
2. Clique em "Entrar"
3. Use as credenciais:
   - **Email**: `admin@agendasalao.com.br`
   - **Senha**: `admin123`

---

### 3. **Cadastrar Slots Recorrentes**

#### 3.1 Para Segunda-feira:
1. No dashboard, clique em **"Profissionais"**
2. Encontre um profissional e clique em **"✅ Cadastrar Slots"** (botão verde)
3. Selecione **"Segunda-feira"** no dropdown de dia da semana
4. Adicione os seguintes horários:
   - **09:00** às **09:30** → Clique "Adicionar à Lista"
   - **09:30** às **10:00** → Clique "Adicionar à Lista"
   - **10:00** às **10:30** → Clique "Adicionar à Lista"
5. Clique em **"Salvar Todos (3)"**
6. ✅ Você verá: "3 horário(s) salvos para Segunda-feira!"

#### 3.2 Para Terça-feira:
1. Ainda na mesma página, selecione **"Terça-feira"**
2. Adicione os seguintes horários:
   - **14:00** às **14:30** → Clique "Adicionar à Lista"
   - **14:30** às **15:00** → Clique "Adicionar à Lista"
3. Clique em **"Salvar Todos (2)"**
4. ✅ Você verá: "2 horário(s) salvos para Terça-feira!"

#### 3.3 Visualizar Slots Cadastrados:
- Role a página para baixo
- Você verá os slots agrupados por dia:
  ```
  📅 Segunda-feira (3 horários)
     🕒 09:00 - 09:30  [🗑️]
     🕒 09:30 - 10:00  [🗑️]
     🕒 10:00 - 10:30  [🗑️]
  
  📅 Terça-feira (2 horários)
     🕒 14:00 - 14:30  [🗑️]
     🕒 14:30 - 15:00  [🗑️]
  ```

---

### 4. **Testar como Cliente**

#### 4.1 Logout e Login como Cliente:
1. Clique no seu nome (canto superior direito) → **"Sair"**
2. Faça login com:
   - **Email**: `pedro@exemplo.com`
   - **Senha**: `cliente123`

#### 4.2 Tentar Agendar em uma Segunda-feira:
1. No dashboard do cliente, clique em **"Agendar Serviço"**
2. Escolha qualquer **serviço**
3. Selecione o **profissional** que você configurou
4. Escolha uma **data que seja segunda-feira** (ex: 03/11/2025, 10/11/2025, 17/11/2025...)
5. ✅ **RESULTADO ESPERADO**: Você verá apenas os 3 horários:
   ```
   ⏰ 09:00
   ⏰ 09:30
   ⏰ 10:00
   ```

#### 4.3 Tentar Agendar em uma Terça-feira:
1. Volte e escolha uma **data que seja terça-feira** (ex: 04/11/2025, 11/11/2025...)
2. ✅ **RESULTADO ESPERADO**: Você verá apenas os 2 horários:
   ```
   ⏰ 14:00
   ⏰ 14:30
   ```

#### 4.4 Tentar Agendar em Quarta, Quinta, etc:
1. Escolha **qualquer outro dia da semana** que você NÃO configurou
2. ✅ **RESULTADO ESPERADO**: 
   ```
   Nenhum horário disponível para esta data
   ```

---

## ✅ Validações do Sistema

### O que o sistema está fazendo:
1. **Admin configura slots por dia da semana** (não por data específica)
2. **Slots se repetem semanalmente** (toda segunda, toda terça, etc.)
3. **Cliente vê apenas os slots do dia da semana selecionado**
4. **Slots já ocupados são automaticamente escondidos**

### Diferença do sistema antigo:
- ❌ **Antes**: Sistema gerava slots automaticamente das 09:00 às 18:00 (sem controle)
- ✅ **Agora**: Admin define exatamente quais horários estarão disponíveis

---

## 🎯 Casos de Teste

### ✅ Teste 1: Isolamento por Dia
- Configurar Segunda: 09:00, 09:30, 10:00
- Configurar Terça: 14:00, 14:30
- **Resultado**: Cliente vê apenas os horários corretos em cada dia

### ✅ Teste 2: Recorrência Semanal
- Configurar Segunda: 09:00
- Testar em **várias segundas-feiras diferentes** (03/11, 10/11, 17/11, 24/11)
- **Resultado**: Horário 09:00 aparece em TODAS as segundas-feiras

### ✅ Teste 3: Slots Ocupados
- Fazer um agendamento para Segunda 09:00
- Tentar agendar novamente na mesma segunda 09:00
- **Resultado**: Horário 09:00 não aparece mais (já ocupado)

### ✅ Teste 4: Sem Configuração
- Tentar agendar em Quarta-feira (sem slots configurados)
- **Resultado**: "Nenhum horário disponível"

---

## 🚀 Próximas Funcionalidades (Opcionais)

### 5. Copiar Slots entre Dias
Implementar botão: **"Copiar de outro dia"**
- Exemplo: Copiar todos os slots de Segunda → Terça
- Útil quando vários dias têm horários similares

---

## 📊 Arquitetura Técnica

### Banco de Dados (model Availability):
```prisma
model Availability {
  dayOfWeek  Int?      // 0=Dom, 1=Seg, 2=Ter, ..., 6=Sáb
  startTime  String    // "09:00"
  endTime    String    // "09:30"
  type       String    // "RECURRING"
  available  Boolean   // true
}
```

### Fluxo:
1. **Admin cria**: `dayOfWeek=1, startTime="09:00", type="RECURRING"`
2. **Cliente escolhe**: data = "2025-11-03" (segunda)
3. **API detecta**: `date.getDay() = 1` (segunda)
4. **API busca**: `WHERE dayOfWeek=1 AND type="RECURRING"`
5. **Retorna**: `["09:00", "09:30", "10:00"]`

---

## 🎉 Status do Projeto

- ✅ Schema atualizado com `dayOfWeek`
- ✅ Interface refatorada (select de dia da semana)
- ✅ API de criação (POST /api/availabilities)
- ✅ API de listagem (GET /api/availabilities)
- ✅ API de slots disponíveis (GET /api/available-slots)
- ✅ Agrupamento visual por dia da semana
- ✅ Ordenação por horário
- ✅ Validações completas

**Sistema 100% funcional e pronto para uso!** 🚀
