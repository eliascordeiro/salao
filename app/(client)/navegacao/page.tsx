"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation as NavigationIcon, Locate, X, ChevronDown, ChevronUp } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

// Configurar token do Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function NavegacaoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string>("");
  const [duration, setDuration] = useState<string>("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  
  // Parâmetros da URL
  const destLat = parseFloat(searchParams.get("lat") || "0");
  const destLng = parseFloat(searchParams.get("lng") || "0");
  const salonName = searchParams.get("name") || "Destino";
  const salonAddress = searchParams.get("address") || null;

  useEffect(() => {
    console.log("🗺️ NavegacaoContent montado");
    console.log("📍 Destino:", { lat: destLat, lng: destLng, name: salonName });
    console.log("🔑 Mapbox Token:", mapboxgl.accessToken ? "Configurado" : "AUSENTE!");
    
    if (!mapContainer.current) {
      console.log("❌ mapContainer não disponível");
      return;
    }
    
    if (!destLat || !destLng) {
      console.log("❌ Coordenadas inválidas");
      setError("Coordenadas do destino inválidas");
      setLoading(false);
      return;
    }

    if (!mapboxgl.accessToken) {
      console.log("❌ Token Mapbox ausente");
      setError("Token do Mapbox não configurado. Verifique NEXT_PUBLIC_MAPBOX_TOKEN.");
      setLoading(false);
      return;
    }

    // Obter localização do usuário
    console.log("📱 Solicitando localização do usuário...");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords: [number, number] = [
            position.coords.longitude,
            position.coords.latitude,
          ];
          console.log("✅ Localização obtida:", userCoords);
          setUserLocation(userCoords);
          initializeMap(userCoords);
        },
        (err) => {
          console.error("❌ Erro ao obter localização:", err);
          setError(`Não foi possível obter sua localização: ${err.message}. Verifique as permissões.`);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.log("❌ Geolocalização não suportada");
      setError("Geolocalização não suportada pelo navegador");
      setLoading(false);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [destLat, destLng]);

  const initializeMap = (userCoords: [number, number]) => {
    if (!mapContainer.current) {
      console.log("❌ initializeMap: mapContainer não disponível");
      return;
    }

    console.log("🗺️ Inicializando mapa com coordenadas:", userCoords);

    try {
      // Criar mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: userCoords,
        zoom: 13,
      });

      console.log("✅ Mapa criado, aguardando evento 'load'...");

      map.current.on("load", () => {
        console.log("✅ Mapa carregado");
        if (!map.current) return;

        // Adicionar marcador de origem (usuário)
        new mapboxgl.Marker({ color: "#3b82f6" })
          .setLngLat(userCoords)
          .setPopup(new mapboxgl.Popup().setHTML("<strong>Você está aqui</strong>"))
          .addTo(map.current);
        console.log("✅ Marcador de origem adicionado");

        // Adicionar marcador de destino (salão)
        new mapboxgl.Marker({ color: "#8b5cf6" })
          .setLngLat([destLng, destLat])
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>${salonName}</strong>`))
          .addTo(map.current);
        console.log("✅ Marcador de destino adicionado");

        // Obter rota
        console.log("📍 Calculando rota...");
        getRoute(userCoords, [destLng, destLat]);
      });

      map.current.on("error", (e) => {
        console.error("❌ Erro no mapa:", e);
        setError("Erro ao carregar o mapa. Verifique o token do Mapbox.");
        setLoading(false);
      });
    } catch (err) {
      console.error("❌ Erro ao criar mapa:", err);
      setError("Erro ao inicializar o mapa.");
      setLoading(false);
    }
  };

  const getRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`;
      console.log("🚗 URL da API Directions:", url);
      
      const query = await fetch(url, { method: "GET" });
      console.log("📡 Status da resposta:", query.status);

      const json = await query.json();
      console.log("📦 Resposta da API:", json);

      if (json.code === "InvalidToken") {
        throw new Error("Token do Mapbox inválido ou expirado");
      }

      if (!json.routes || json.routes.length === 0) {
        throw new Error("Nenhuma rota encontrada");
      }

      const data = json.routes[0];
      const route = data.geometry.coordinates;

      // Adicionar rota ao mapa
      if (map.current) {
        const geojson: any = {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: route,
          },
        };

        // Remover camada anterior se existir
        if (map.current.getSource("route")) {
          map.current.removeLayer("route");
          map.current.removeSource("route");
        }

        map.current.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: geojson,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#8b5cf6",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });

        // Ajustar visualização para mostrar toda a rota
        const bounds = new mapboxgl.LngLatBounds();
        route.forEach((coord: [number, number]) => bounds.extend(coord));
        map.current.fitBounds(bounds, { padding: 80 });
      }

      // Calcular distância e tempo
      const distanceKm = (data.distance / 1000).toFixed(1);
      const durationMin = Math.round(data.duration / 60);

      console.log(`✅ Rota calculada: ${distanceKm} km, ${durationMin} min`);
      setDistance(`${distanceKm} km`);
      setDuration(`${durationMin} min`);
      setLoading(false);
    } catch (err) {
      console.error("❌ Erro ao obter rota:", err);
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Erro ao calcular rota: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleRecenter = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: userLocation,
        zoom: 15,
        duration: 1000,
      });
    }
  };

  const handleOpenGoogleMaps = () => {
    // Usar endereço se disponível, senão usar coordenadas
    const destination = salonAddress 
      ? encodeURIComponent(salonAddress)
      : `${destLat},${destLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, "_blank");
  };

  const handleOpenWaze = () => {
    // Waze usa coordenadas no formato: waze://?ll=lat,lng&navigate=yes
    const url = `https://waze.com/ul?ll=${destLat},${destLng}&navigate=yes`;
    window.open(url, "_blank");
  };

  const handleOpenNavApp = () => {
    // Tentar detectar e abrir o app preferido do usuário
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      // No iOS, tentar abrir Apple Maps
      const destination = salonAddress || `${destLat},${destLng}`;
      window.location.href = `maps://?daddr=${encodeURIComponent(destination)}`;
    } else if (isAndroid) {
      // No Android, usar intent para Google Maps
      const destination = salonAddress 
        ? encodeURIComponent(salonAddress)
        : `${destLat},${destLng}`;
      window.location.href = `google.navigation:q=${destination}`;
    } else {
      // Fallback para Google Maps web
      handleOpenGoogleMaps();
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <GlassCard className="p-6 max-w-md text-center space-y-4">
          <X className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Erro na Navegação</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.back()} variant="outline" className="flex-1 h-10 sm:h-11">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleOpenGoogleMaps} className="flex-1 h-10 sm:h-11">
              Abrir Navegação
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Mapa */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Header compacto - apenas botão voltar */}
      <div className="fixed top-3 left-3 z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 h-9 sm:h-10 bg-background/95 backdrop-blur-md shadow-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      {/* Card de informações do salão - expansível em mobile */}
      <div className="fixed top-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-80 z-10 mt-12 sm:mt-0">
        <GlassCard className="overflow-hidden">
          {/* Header do card - sempre visível */}
          <button
            onClick={() => setIsInfoExpanded(!isInfoExpanded)}
            className="w-full p-3 text-left hover:bg-background-alt/20 transition-colors sm:cursor-default sm:hover:bg-transparent"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold line-clamp-1">{salonName}</h2>
                {!loading && (
                  <p className="text-xs text-muted-foreground">
                    {distance} • {duration}
                  </p>
                )}
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform sm:hidden ${isInfoExpanded ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {/* Conteúdo expansível - Apps de navegação */}
          <div className={`
            overflow-hidden transition-all duration-300
            ${isInfoExpanded ? 'max-h-40' : 'max-h-0 sm:max-h-40'}
          `}>
            <div className="p-3 pt-0 space-y-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Abrir em:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenGoogleMaps}
                  className="flex-1 gap-1.5 h-9"
                >
                  <NavigationIcon className="h-4 w-4" />
                  <span className="text-xs">Google</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenWaze}
                  className="flex-1 gap-1.5 h-9 border-[#33CCFF]/30 text-[#33CCFF] hover:bg-[#33CCFF]/10"
                >
                  <NavigationIcon className="h-4 w-4" />
                  <span className="text-xs">Waze</span>
                </Button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Botão de recentralizar */}
      {!loading && userLocation && (
        <Button
          size="lg"
          onClick={handleRecenter}
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-10 h-12 w-12 sm:h-14 sm:w-14 p-0 rounded-full shadow-lg"
          title="Centralizar no mapa"
        >
          <Locate className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      )}

      {/* Botões de iniciar navegação */}
      {!loading && (
        <div className="fixed bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-10">
          <div className="flex gap-2 sm:gap-3">
            <Button
              size="lg"
              onClick={handleOpenGoogleMaps}
              className="flex-1 gap-2 h-12 sm:h-14"
            >
              <NavigationIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Google Maps</span>
            </Button>
            <Button
              size="lg"
              onClick={handleOpenWaze}
              className="flex-1 gap-2 h-12 sm:h-14 bg-[#33CCFF] hover:bg-[#2BB8E6]"
            >
              <NavigationIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Waze</span>
            </Button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
          <GlassCard className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Calculando melhor rota...</p>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

export default function NavegacaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    >
      <NavegacaoContent />
    </Suspense>
  );
}
