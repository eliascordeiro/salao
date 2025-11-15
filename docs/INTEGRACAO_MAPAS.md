# Integração com Mapas - Análise de Custos

## 📊 Comparação de Serviços de Mapas

### 1. **Google Maps Platform** ⭐ Mais Popular

**Plano Gratuito:**
- $200 USD de crédito mensal (cobrem ~28.000 carregamentos de mapa)
- Até 40.000 requisições gratuitas de Geocoding por mês
- Cartão de crédito obrigatório (não cobra automático)

**Custos após limite gratuito:**
- Static Maps: $2 por 1.000 carregamentos
- Dynamic Maps: $7 por 1.000 carregamentos
- Geocoding: $5 por 1.000 requisições
- Directions API: $5 por 1.000 requisições

**Prós:**
- ✅ Mais preciso e atualizado
- ✅ Melhor cobertura global
- ✅ Documentação excelente
- ✅ $200/mês grátis é suficiente para MVP

**Contras:**
- ❌ Requer cartão de crédito
- ❌ Pode ficar caro com muito tráfego


---

### 2. **Mapbox** 🎨 Moderno

**Plano Gratuito:**
- 50.000 carregamentos de mapa/mês
- 100.000 requisições de Geocoding/mês
- Sem cartão de crédito obrigatório

**Custos após limite:**
- Maps: $5 por 1.000 carregamentos extras
- Geocoding: $0.50 por 1.000 requisições

**Prós:**
- ✅ Visual mais moderno e customizável
- ✅ Limite gratuito generoso
- ✅ Não exige cartão inicialmente
- ✅ Boa documentação

**Contras:**
- ❌ Menos familiar para usuários
- ❌ Cobertura pode ser inferior ao Google


---

### 3. **OpenStreetMap (Leaflet.js)** 🆓 Open Source

**Plano Gratuito:**
- 100% gratuito
- Nominatim (Geocoding) gratuito com limites de taxa
- Limite: 1 requisição/segundo

**Custos:**
- $0 (completamente gratuito)

**Prós:**
- ✅ Totalmente gratuito
- ✅ Sem necessidade de API key
- ✅ Open source e customizável
- ✅ Sem cartão de crédito

**Contras:**
- ❌ Dados podem estar desatualizados
- ❌ Geocoding limitado (1 req/s)
- ❌ Visual mais simples
- ❌ Responsabilidade de hospedar tiles


---

### 4. **Azure Maps** ☁️ Microsoft

**Plano Gratuito:**
- 1.000 transações gratuitas/mês
- Geocoding incluído

**Custos:**
- $4.50 por 1.000 transações extras

**Prós:**
- ✅ Integração com Azure
- ✅ Preço competitivo

**Contras:**
- ❌ Limite gratuito muito baixo
- ❌ Menos adotado


---

## 🎯 Recomendação para seu Projeto

### **Para MVP/Início: Mapbox** ⭐⭐⭐⭐⭐

**Por quê:**
1. **50.000 visualizações gratuitas/mês** - suficiente para começar
2. **Não exige cartão de crédito** - menos risco
3. **Visual moderno** - melhor experiência
4. **Fácil implementação** - biblioteca React pronta

### **Alternativa Zero Custo: OpenStreetMap + Leaflet** ⭐⭐⭐⭐

**Por quê:**
1. **100% gratuito sempre**
2. **Funciona bem no Brasil**
3. **Sem limites de API (exceto Geocoding)**
4. **Ideal para fase de testes**


---

## 💡 Funcionalidades que Podemos Adicionar

### Com Mapbox/Google Maps:

1. **Mapa interativo na página do salão** 📍
   - Mostrar localização exata
   - Botão "Como chegar"
   - Street View (Google)

2. **Lista de salões com mapa** 🗺️
   - Pins/marcadores para cada salão
   - Clicar no pin abre card do salão
   - Filtrar por área visível no mapa

3. **Autocomplete de endereço** 🔍
   - Ao cadastrar salão
   - Sugere endereços conforme digita
   - Preenche lat/lon automaticamente

4. **Geocoding automático** 📌
   - Converter endereço → coordenadas
   - Popular banco de dados automaticamente
   - Não depender de entrada manual

5. **Cálculo de rota** 🚗
   - "Como chegar" com direções
   - Tempo estimado de viagem
   - Opções de transporte

### Com OpenStreetMap (Leaflet):

1. **Mapa básico interativo** ✅
2. **Marcadores de salões** ✅
3. **Cálculo de distância** ✅ (já temos!)
4. **Geocoding limitado** ⚠️ (1 req/s)


---

## 🚀 Implementação Rápida (Mapbox - Gratuito)

### Passo 1: Criar conta
```bash
# 1. Acesse: https://account.mapbox.com/auth/signup/
# 2. Sem cartão de crédito necessário
# 3. Copie seu Access Token
```

### Passo 2: Instalar
```bash
npm install mapbox-gl react-map-gl @mapbox/mapbox-gl-geocoder
```

### Passo 3: Usar
```jsx
import Map from 'react-map-gl';

<Map
  mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
  initialViewState={{
    longitude: -49.2733,
    latitude: -25.4284,
    zoom: 12
  }}
  style={{width: '100%', height: 400}}
  mapStyle="mapbox://styles/mapbox/streets-v12"
/>
```

### Custo: **$0/mês** até 50.000 visualizações


---

## 📈 Estimativa de Uso

**Seu cenário (estimado):**
- 1.000 visitantes/mês
- 3 páginas com mapa por visita
- **Total: 3.000 carregamentos/mês**

**Resultado:**
- ✅ Mapbox: GRATUITO (dentro do limite de 50k)
- ✅ Google Maps: GRATUITO (dentro dos $200 de crédito)
- ✅ OpenStreetMap: GRATUITO (sempre)


---

## 🎯 Minha Recomendação Final

### **Use Mapbox para começar:**

**Vantagens:**
1. Não precisa cartão de crédito
2. 50k visualizações grátis/mês
3. Visual moderno e profissional
4. Biblioteca React oficial
5. Geocoding gratuito incluído
6. Fácil de implementar

**Quando migrar para Google Maps:**
- Quando passar de 50k visualizações/mês
- Se precisar de Street View
- Se precisar de Places API (reviews, horários)

---

## 💰 Resumo de Custos

| Serviço | Custo Mensal (MVP) | Limite Gratuito |
|---------|-------------------|-----------------|
| **Mapbox** | $0 | 50k visualizações |
| **Google Maps** | $0 | $200 crédito (~28k) |
| **OpenStreetMap** | $0 | Ilimitado (com restrições) |
| **Azure Maps** | $0 | 1k transações |

**Para um salão com 1.000-5.000 visitas/mês: TODOS SÃO GRATUITOS**

---

## ✨ Conclusão

**Não é custoso!** Para sua escala atual (2 salões, tráfego inicial), qualquer opção será **100% gratuita**.

Recomendo começar com **Mapbox** e adicionar:
1. Mapa na página de detalhes do salão
2. Autocomplete ao cadastrar endereço
3. Visualização em mapa na lista de salões

Quer que eu implemente a integração com Mapbox agora?
