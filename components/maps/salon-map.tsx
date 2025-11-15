"use client";

import { useRef, useEffect, useState } from "react";
import { Map, Marker, NavigationControl, FullscreenControl } from "react-map-gl/mapbox";
import { MapPin } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";

interface SalonMapProps {
  latitude: number;
  longitude: number;
  salonName?: string;
  zoom?: number;
  height?: string | number;
  showMarker?: boolean;
  interactive?: boolean;
}

export function SalonMap({
  latitude,
  longitude,
  salonName = "Salão",
  zoom = 14,
  height = 300,
  showMarker = true,
  interactive = true,
}: SalonMapProps) {
  const mapRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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

  return (
    <div className="relative rounded-lg overflow-hidden" style={{ height }}>
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          longitude,
          latitude,
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        interactive={interactive}
        attributionControl={false}
      >
        {showMarker && (
          <Marker longitude={longitude} latitude={latitude} anchor="bottom">
            <div className="flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-300">
              <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
              {salonName && (
                <div className="bg-background/95 backdrop-blur-sm px-2 py-1 rounded-md shadow-md border border-border">
                  <p className="text-xs font-medium whitespace-nowrap">{salonName}</p>
                </div>
              )}
            </div>
          </Marker>
        )}

        {/* Controles de navegação */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
      </Map>

      {/* Attribution (obrigatório para Mapbox) */}
      <div className="absolute bottom-0 right-0 text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded-tl">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}
