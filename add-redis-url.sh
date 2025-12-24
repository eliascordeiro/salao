#!/bin/bash
echo "🔧 Adicionando REDIS_URL ao evolution-api..."
railway unlink
railway link
# Aguardar seleção manual: splendid-purpose → production → evolution-api
