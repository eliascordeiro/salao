#!/bin/bash

echo "🔍 Analisando APIs que precisam de filtro de salonId..."
echo ""

# APIs que fazem findMany em bookings
APIS=(
  "app/api/analytics/bookings-over-time/route.ts"
  "app/api/analytics/revenue-by-period/route.ts"
  "app/api/analytics/export/route.ts"
  "app/api/cashier/daily-bookings/route.ts"
  "app/api/cashier/close-session/route.ts"
)

echo "📋 APIs identificadas que precisam de correção:"
echo ""

for api in "${APIS[@]}"; do
  if [ -f "$api" ]; then
    echo "  ❌ $api"
    # Verificar se já tem o import getUserSalon
    if grep -q "getUserSalon" "$api"; then
      echo "      ✅ Import getUserSalon já existe"
    else
      echo "      ⚠️  Precisa adicionar import getUserSalon"
    fi
    
    # Verificar se já tem filtro salonId
    if grep -q "salonId:" "$api" || grep -q "salonId :" "$api"; then
      echo "      ✅ Filtro salonId já existe"
    else
      echo "      ⚠️  CRÍTICO: Falta filtro salonId"
    fi
    echo ""
  fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔒 CORREÇÕES JÁ APLICADAS:"
echo "  ✅ app/api/bookings/route.ts"
echo "  ✅ app/api/analytics/stats/route.ts"
echo ""
echo "⚠️  PRÓXIMOS PASSOS:"
echo "  1. Corrigir APIs de analytics restantes"
echo "  2. Corrigir APIs de cashier"
echo "  3. Testar isolamento entre salões"
echo ""
