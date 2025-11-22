"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Map, Marker, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import "mapbox-gl/dist/mapbox-gl.css";

interface Salon {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  city?: string | null;
  state?: string | null;
  distance?: number;
}

interface SalonsMapViewProps {
  salons: Salon[];
  userLocation?: { latitude: number; longitude: number };
  onSalonClick?: (salonId: string) => void;
  height?: string | number;
}

export function SalonsMapView({
  salons,
  userLocation,
  onSalonClick,
  height = 500,
}: SalonsMapViewProps) {
  const mapRef = useRef<any>(null);
  const [selectedSalon, setSelectedSalon] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // Filtrar apenas salões com coordenadas válidas
  const validSalons = salons.filter(
    (s) => s.latitude !== null && s.longitude !== null
  );

  if (!mounted) {
    return (
      <div 
        className="flex items-center justify-center bg-muted rounded-lg animate-pulse"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          Carregando mapa...
        </p>
      </div>
    );
  }

  // Calcular centro do mapa baseado nos salões ou localização do usuário
  const calculateCenter = useCallback(() => {
    if (userLocation) {
      return {
        longitude: userLocation.longitude,
        latitude: userLocation.latitude,
        zoom: 12,
      };
    }

    if (validSalons.length === 0) {
      return {
        longitude: -49.2733, // Curitiba padrão
        latitude: -25.4284,
        zoom: 10,
      };
    }

    // Calcular centro baseado nos salões
    const avgLat =
      validSalons.reduce((sum, s) => sum + s.latitude!, 0) / validSalons.length;
    const avgLon =
      validSalons.reduce((sum, s) => sum + s.longitude!, 0) / validSalons.length;

    return {
      longitude: avgLon,
      latitude: avgLat,
      zoom: 11,
    };
  }, [validSalons, userLocation]);

  const handleMarkerClick = (salonId: string) => {
    setSelectedSalon(salonId);
    if (onSalonClick) {
      onSalonClick(salonId);
    }
  };

  if (!mapboxToken) {
    return (
      <div
        className="flex items-center justify-center bg-muted rounded-lg"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">
          Mapbox token não configurado
        </p>
      </div>
    );
  }

  if (validSalons.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-muted rounded-lg gap-3"
        style={{ height }}
      >
        <MapPin className="h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Nenhum salão com localização disponível
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={calculateCenter()}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        attributionControl={false}
      >
        {/* Marcador do usuário */}
        {userLocation && (
          <Marker
            longitude={userLocation.longitude}
            latitude={userLocation.latitude}
            anchor="center"
          >
            <div className="relative animate-in fade-in zoom-in duration-300">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
              <div className="relative bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                <Navigation className="h-4 w-4" />
              </div>
            </div>
          </Marker>
        )}

        {/* Marcadores dos salões */}
        {validSalons.map((salon) => (
          <Marker
            key={salon.id}
            longitude={salon.longitude!}
            latitude={salon.latitude!}
            anchor="bottom"
          >
            <button
              onClick={() => handleMarkerClick(salon.id)}
              className={`flex flex-col items-center gap-1 transition-all hover:scale-110 ${
                selectedSalon === salon.id ? "scale-110" : ""
              }`}
            >
              <div
                className={`p-2 rounded-full shadow-lg transition-colors ${
                  selectedSalon === salon.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground border-2 border-primary"
                }`}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <div
                className={`bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border transition-colors ${
                  selectedSalon === salon.id
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                <p className="text-xs font-medium whitespace-nowrap">
                  {salon.name}
                </p>
                {salon.distance !== undefined && (
                  <p className="text-[10px] text-muted-foreground">
                    {salon.distance < 1
                      ? `${Math.round(salon.distance * 1000)} m`
                      : `${salon.distance.toFixed(1)} km`}
                  </p>
                )}
              </div>
            </button>
          </Marker>
        ))}

        {/* Controles */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
      </Map>

      {/* Attribution */}
      <div className="absolute bottom-0 right-0 text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-tl">
        © Mapbox © OpenStreetMap
      </div>

      {/* Info Badge */}
      <div className="absolute top-3 left-3 bg-background/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-border">
        <p className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {validSalons.length} {validSalons.length === 1 ? "salão" : "salões"}
        </p>
      </div>
    </div>
  );
}
