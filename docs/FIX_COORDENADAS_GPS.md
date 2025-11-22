# 🌍 Fix: Coordenadas GPS - Busca de Salões Próximos

## 🐛 Problema Identificado

Ao buscar "salões próximos" com geolocalização, nenhum salão era encontrado mesmo existindo salões cadastrados.

**Causa**: Salões sem coordenadas GPS (`latitude` e `longitude`).

## ✅ Correções Implementadas

### 1. Frontend (`/dashboard/meu-salao`)

**Antes**: ❌ Não buscava nem salvava coordenadas ao editar

**Depois**: ✅ 
- Busca coordenadas via Nominatim ao pesquisar CEP
- Adiciona `latitude` e `longitude` no estado (`formData`)
- Envia coordenadas no PUT para API

```typescript
// Ao buscar CEP, também busca coordenadas
const geoResponse = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${addressString}`,
  { headers: { 'User-Agent': 'SalaoApp/1.0' } }
);
const geoData = await geoResponse.json();

if (geoData && geoData[0]) {
  setFormData(prev => ({
    ...prev,
    latitude: parseFloat(geoData[0].lat),
    longitude: parseFloat(geoData[0].lon),
  }));
}
```

### 2. Backend (`/api/salon/my-salon`)

**Antes**: ❌ Ignorava `latitude` e `longitude` no PUT

**Depois**: ✅ Aceita e salva coordenadas

```typescript
const { latitude, longitude, ...rest } = data;

await prisma.salon.update({
  where: { id: salon.id },
  data: {
    ...rest,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  }
});
```

### 3. Script de Migração

**Arquivo**: `scripts/add-missing-coordinates.js`

- Busca todos os salões sem coordenadas
- Consulta Nominatim (OpenStreetMap) com endereço completo
- Valida coordenadas (devem estar dentro do Brasil)
- Atualiza banco de dados
- Respeita rate limit (1 segundo entre requisições)

## 🚀 Como Executar no Railway

### Opção 1: Via Railway CLI

```bash
# 1. Conectar ao Railway
railway link

# 2. Executar script
railway run node scripts/add-missing-coordinates.js
```

### Opção 2: Via API Route (Mais Simples)

Crie uma rota temporária:

```typescript
// app/api/admin/fix-coordinates/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const salons = await prisma.salon.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }]
    }
  });

  let updated = 0;

  for (const salon of salons) {
    if (!salon.city || !salon.state) continue;

    const address = salon.street || salon.address;
    if (!address) continue;

    try {
      const query = `${address}, ${salon.city}, ${salon.state}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'SalaoApp/1.0' }
      });
      
      const data = await response.json();
      
      if (data && data[0]) {
        await prisma.salon.update({
          where: { id: salon.id },
          data: {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          }
        });
        updated++;
      }

      // Rate limit
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Erro ao processar ${salon.name}:`, error);
    }
  }

  return NextResponse.json({
    message: "Coordenadas adicionadas",
    total: salons.length,
    updated
  });
}
```

Depois execute via Console do navegador:

```javascript
fetch('/api/admin/fix-coordinates', {
  method: 'POST',
  credentials: 'include'
})
.then(res => res.json())
.then(data => console.log('✅', data))
.catch(err => console.error('❌', err));
```

### Opção 3: Manual (Página "Meu Salão")

1. Acesse: `/dashboard/meu-salao`
2. Edite o CEP (digite novamente)
3. Aguarde buscar endereço
4. Clique em "Salvar"
5. ✅ Coordenadas serão adicionadas automaticamente

## 📊 Validação

### Verificar Coordenadas no Banco

```sql
SELECT 
  id, 
  name, 
  latitude, 
  longitude,
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN '✅'
    ELSE '❌'
  END as status
FROM "Salon"
ORDER BY status, name;
```

### Testar Busca por Proximidade

1. Acesse: `/saloes`
2. Ative "Usar minha localização"
3. Ajuste distância máxima (ex: 50km)
4. Veja salões ordenados por distância

## 🎯 Resultados Esperados

**Antes**:
```json
{
  "salons": []  // Nenhum salão encontrado
}
```

**Depois**:
```json
{
  "salons": [
    {
      "name": "Boca Aberta",
      "latitude": -25.551552,
      "longitude": -49.386864,
      "distance": 2.5  // km
    }
  ]
}
```

## 🔧 Troubleshooting

### "Coordenadas não encontradas"

**Possíveis causas**:
- Endereço incompleto ou incorreto
- Cidade/Estado ausentes
- Formato de endereço inválido

**Solução**: 
1. Verifique se o salão tem city, state e address/street preenchidos
2. Teste manualmente: https://nominatim.openstreetmap.org/search?q=SEU_ENDERECO
3. Corrija endereço via "Meu Salão" e salve novamente

### "fetch failed" no script

Se estiver rodando localmente sem Node 18+, use a versão corrigida que usa `https` nativo.

### Rate limit Nominatim

Nominatim tem limite de 1 request/segundo. O script já respeita isso, mas se tiver muitos salões (>100), pode demorar alguns minutos.

## 📝 Checklist

- [ ] Deploy no Railway concluído
- [ ] Script executado (via CLI ou API)
- [ ] Verificar banco: `SELECT COUNT(*) FROM "Salon" WHERE latitude IS NOT NULL`
- [ ] Testar busca em `/saloes` com geolocalização
- [ ] Confirmar salões aparecem ordenados por distância
- [ ] Editar salão existente e confirmar coordenadas mantidas

## 🎉 Benefícios

- ✅ Busca por proximidade funcional
- ✅ Ordenação por distância
- ✅ Filtro por raio (5km, 10km, 25km, 50km)
- ✅ Mapas exibindo localização correta
- ✅ Botão "Como Chegar" funcionando
- ✅ Futuros cadastros já terão coordenadas automáticas

---

**Criado em**: 21/11/2025  
**Status**: ✅ Pronto para executar
