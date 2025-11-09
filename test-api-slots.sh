#!/bin/bash

echo "🧪 Testando API de slots disponíveis"
echo ""
echo "📋 Parâmetros:"
echo "  Salão: cmhpdo1c40007of60yed697zp"
echo "  Profissional: cmhpfkxk10001ofyrulo7v169"
echo "  Serviço: cmhpevvl10001ofupilzqxhrf"
echo "  Data: 2025-11-11 (Segunda-feira)"
echo ""

echo "🌐 Fazendo requisição..."
echo ""

curl -v "http://localhost:3000/api/available-slots?staffId=cmhpfkxk10001ofyrulo7v169&date=2025-11-11&serviceId=cmhpevvl10001ofupilzqxhrf" 2>&1 | grep -A 100 "availableSlots\|error\|status"

echo ""
echo ""
echo "✅ Teste concluído!"
