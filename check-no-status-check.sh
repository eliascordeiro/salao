#!/bin/bash

echo "🔍 Verificação: Código envia 'Status check'?"
echo ""

echo "1️⃣ Buscando 'Status check' no código principal..."
MAIN_CHECK=$(grep -r "Status check" lib/whatsapp/whatsgw-client.ts 2>/dev/null || echo "")

if [ -z "$MAIN_CHECK" ]; then
  echo "✅ CORRETO: Nenhum 'Status check' em whatsgw-client.ts"
else
  echo "❌ PROBLEMA: Encontrado em whatsgw-client.ts:"
  echo "$MAIN_CHECK"
fi

echo ""
echo "2️⃣ Verificando método getStatus() atual..."
grep -A 15 "async getStatus()" lib/whatsapp/whatsgw-client.ts | head -20

echo ""
echo "3️⃣ Confirmando: NÃO deve ter fetch() dentro de getStatus()..."
FETCH_IN_STATUS=$(grep -A 20 "async getStatus()" lib/whatsapp/whatsgw-client.ts | grep "fetch" || echo "")

if [ -z "$FETCH_IN_STATUS" ]; then
  echo "✅ CORRETO: getStatus() NÃO faz fetch (não envia mensagem)"
else
  echo "❌ PROBLEMA: getStatus() faz fetch:"
  echo "$FETCH_IN_STATUS"
fi

echo ""
echo "4️⃣ Limpando cache Next.js..."
rm -rf .next
echo "✅ Cache limpo (.next removido)"

echo ""
echo "📋 RESUMO:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -z "$MAIN_CHECK" ] && [ -z "$FETCH_IN_STATUS" ]; then
  echo "✅ TUDO CERTO! Código NÃO envia 'Status check'"
  echo ""
  echo "⚡ Próximos passos:"
  echo "   1. Reinicie o dev server: npm run dev"
  echo "   2. Hard refresh no browser: Ctrl+Shift+R"
  echo "   3. Verifique seu WhatsApp - não deve receber mais mensagens"
else
  echo "⚠️  ATENÇÃO: Código ainda tem referências"
  echo "   Verifique os detalhes acima"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
