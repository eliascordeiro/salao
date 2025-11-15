# 🚀 ATUALIZAÇÃO DO RAILWAY - INTEGRAÇÃO MAPBOX

## ✅ O que foi feito localmente:

1. **Integração completa com Mapbox** ✅
   - ✅ 3 novos componentes criados (SalonMap, SalonsMapView, DirectionsButton)
   - ✅ Mapa na página de detalhes do salão
   - ✅ Toggle Lista/Mapa na listagem de salões
   - ✅ Botão "Como Chegar" com roteamento inteligente
   - ✅ Commit realizado: `b2063ff`
   - ✅ Push para GitHub concluído

2. **Pacotes instalados**:
   - mapbox-gl (2.16.1)
   - react-map-gl (7.1.7)
   - @mapbox/mapbox-gl-geocoder (5.0.2)

## 📋 PASSOS PARA ATUALIZAR A RAILWAY:

### 1️⃣ Login no Railway
```bash
railway login
```
Isso abrirá o navegador para você fazer login.

### 2️⃣ Vincular ao Projeto
```bash
railway link
```
Selecione o projeto "SalaoBlza" ou "salao-production".

### 3️⃣ Verificar Status do Banco de Dados
```bash
railway run npx prisma migrate status
```

### 4️⃣ Aplicar Migrações (se necessário)
```bash
railway run npx prisma migrate deploy
```

### 5️⃣ Adicionar Variável de Ambiente MAPBOX
```bash
railway variables set NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw
```

**OU** via Dashboard da Railway:
1. Acesse: https://railway.app/dashboard
2. Entre no projeto
3. Clique em "Variables"
4. Adicione:
   - Nome: `NEXT_PUBLIC_MAPBOX_TOKEN`
   - Valor: `pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`

### 6️⃣ Verificar Deploy
O deploy deve iniciar automaticamente após o push do commit `b2063ff`.

Acesse os logs:
```bash
railway logs
```

Ou via Dashboard: https://railway.app/dashboard → Projeto → "Deployments" → Ver logs

### 7️⃣ Testar em Produção
Após deploy completo, acesse:
- Lista de salões: https://seu-app.up.railway.app/saloes
- Clique no botão "Mapa" ao lado de "Lista"
- Entre em um salão e veja o mapa na aba "Sobre"
- Teste o botão "Como Chegar"

## 🔍 COMPARAÇÃO DOS BANCOS:

### Banco Local (PostgreSQL):
- ✅ 7 migrações aplicadas
- ✅ Schema totalmente atualizado
- ✅ Dados de teste: 2 salões com coordenadas GPS

### Banco Railway (a verificar):
```bash
railway run npx prisma migrate status
```

Se mostrar migrações pendentes, aplique:
```bash
railway run npx prisma migrate deploy
```

## 📦 NOVAS DEPENDÊNCIAS NO package.json:

```json
"dependencies": {
  "mapbox-gl": "^2.16.1",
  "react-map-gl": "^7.1.7",
  "@mapbox/mapbox-gl-geocoder": "^5.0.2"
}
```

Essas já estão no package.json commitado, então a Railway instalará automaticamente.

## ⚠️ IMPORTANTE:

1. **Token Mapbox**: O token no commit é um token DEMO da Mapbox (público)
   - Para produção, crie sua própria conta: https://account.mapbox.com/
   - Free tier: 50.000 visualizações/mês
   - Substitua o token na variável de ambiente

2. **Coordenadas GPS**: Os salões precisam ter `latitude` e `longitude` preenchidos
   - Você pode adicionar via Dashboard → Meu Salão
   - Ou executar script de seed com coordenadas

3. **Build da Railway**: Deve completar sem erros
   - O mapbox-gl precisa de build com TypeScript
   - Já configurado no tsconfig.json

## 🎯 RESULTADO ESPERADO:

Após todas as etapas:
- ✅ App atualizado na Railway
- ✅ Mapbox funcionando
- ✅ Toggle Lista/Mapa visível
- ✅ Mapas carregando com salões
- ✅ Botão "Como Chegar" funcional

## 📞 SUPORTE:

Se houver erros:
1. Verifique os logs: `railway logs`
2. Verifique se todas as variáveis de ambiente estão configuradas
3. Confirme que as migrações foram aplicadas
4. Teste localmente primeiro: `npm run dev`

---

**Status do Commit**: `b2063ff` - Integração Mapbox
**Data**: 14/11/2025
**Branch**: main
