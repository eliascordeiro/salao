# 🗺️ Adicionar Token Mapbox no Railway

## Problema Identificado
O botão "Como Chegar" fica travado em "Calculando melhor rota..." porque o token do Mapbox não está configurado no Railway.

## Solução

### Opção 1: Via CLI (Rápido)
```bash
railway variables set NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

### Opção 2: Via Dashboard (Visual)

1. Acesse: https://railway.app/project/seu-projeto
2. Clique na aba **"Variables"**
3. Clique em **"+ New Variable"**
4. Adicione:
   - **Name:** `NEXT_PUBLIC_MAPBOX_TOKEN`
   - **Value:** `pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`
5. Clique em **"Add"**
6. **IMPORTANTE:** Clique em **"Deploy"** para aplicar

## ⚠️ Sobre Este Token

Este é um **token público de demonstração do Mapbox**. Ele funciona, mas tem limitações:

- ✅ Bom para testes e desenvolvimento
- ⚠️ Pode ter rate limit baixo
- ⚠️ Pode parar de funcionar sem aviso

### Recomendação: Criar Seu Próprio Token (GRÁTIS)

1. Acesse: https://account.mapbox.com/
2. Faça login ou crie conta gratuita
3. Vá em: https://account.mapbox.com/access-tokens/
4. Clique em **"Create a token"**
5. Configure:
   - **Name:** salon-booking-production
   - **Scopes:** Deixe todos marcados (padrão)
6. Copie o token que começa com `pk.`
7. Substitua no Railway

### Plano Gratuito do Mapbox
- ✅ 50.000 visualizações de mapa/mês
- ✅ 50.000 requisições de rotas/mês
- ✅ Sem cartão de crédito necessário
- ✅ Suficiente para produção pequena/média

## Depois de Adicionar

O Railway vai fazer **redeploy automático**. Aguarde 2-3 minutos e teste:

1. Acesse: https://salon-booking.com.br
2. Abra qualquer salão
3. Clique no botão **"Como Chegar"** (ícone de navegação)
4. Permita acesso à localização no navegador
5. Deve carregar o mapa com rota em segundos

## Logs de Debug Adicionados

Agora a página mostra logs detalhados no console (F12):
- 🗺️ Mapa inicializado
- 📍 Coordenadas detectadas
- 🔑 Token configurado ou ausente
- 📱 Geolocalização solicitada
- ✅ Rota calculada com distância/tempo
- ❌ Erros específicos (token inválido, sem permissão, etc)

## Verificar no Railway

Após adicionar, verifique:
```bash
railway variables
```

Deve aparecer:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

## Testando Localmente

Para testar agora localmente:
```bash
# Reinicie o servidor Next.js
npm run dev
```

O token já foi adicionado no `.env` local, então deve funcionar imediatamente.
