#!/bin/bash

echo "🧹 Limpando cache do Next.js..."
echo ""

# 1. Remover pasta .next
if [ -d ".next" ]; then
  echo "📁 Removendo pasta .next/"
  rm -rf .next
  echo "   ✅ .next/ removido"
else
  echo "   ℹ️ .next/ não encontrado"
fi

# 2. Limpar cache do Next.js
echo ""
echo "🗑️ Limpando cache..."
npm run clean 2>/dev/null || echo "   ℹ️ Script 'clean' não encontrado (normal)"

echo ""
echo "✅ Cache limpo!"
echo ""
echo "🚀 Para iniciar o servidor:"
echo "   npm run dev"
echo ""
