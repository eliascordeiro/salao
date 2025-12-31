"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Navigation as NavigationIcon, Locate, X } from "lucide-react";
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

  const handleOpenExternalNav = () => {
    // Usar endereço se disponível, senão usar coordenadas
    const destination = salonAddress 
      ? encodeURIComponent(salonAddress)
      : `${destLat},${destLng}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, "_blank");
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <GlassCard className="p-6 max-w-md text-center space-y-4">
          <X className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Erro na Navegação</h2>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button onClick={() => router.back()} variant="outline" className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleOpenExternalNav} className="flex-1">
              Abrir no Google Maps
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Mapa */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Header com informações da rota */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10">
        <GlassCard className="p-4 space-y-3">
          {/* Botão Voltar */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternalNav}
              className="gap-2"
            >
              Google Maps
            </Button>
          </div>

          {/* Informações do destino */}
          <div>
            <h1 className="text-lg font-bold line-clamp-1">{salonName}</h1>
            {loading ? (
              <p className="text-sm text-muted-foreground">Calculando rota...</p>
            ) : (
              <div className="flex items-center gap-4 text-sm">
                <span className="font-semibold text-primary">{distance}</span>
                <span className="text-muted-foreground">•</span>
                <span className="font-semibold text-primary">{duration}</span>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Botão de recentralizar */}
      {!loading && userLocation && (
        <Button
          size="lg"
          onClick={handleRecenter}
          className="absolute bottom-24 right-4 z-10 h-14 w-14 p-0 rounded-full shadow-lg"
        >
          <Locate className="h-6 w-6" />
        </Button>
      )}

      {/* Botão de iniciar navegação */}
      {!loading && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Button
            size="lg"
            onClick={handleOpenExternalNav}
            className="w-full gap-2 h-14"
          >
            <NavigationIcon className="h-5 w-5" />
            Iniciar Navegação no Google Maps
          </Button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-20">
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
