"use client";

import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DirectionsButtonProps {
  latitude: number;
  longitude: number;
  salonName: string;
  address?: string;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg";
  className?: string;
  iconOnly?: boolean; // Nova prop para mostrar apenas o ícone
}

export function DirectionsButton({
  latitude,
  longitude,
  salonName,
  address,
  variant = "outline",
  size = "default",
  className = "",
  iconOnly = false,
}: DirectionsButtonProps) {
  const handleGetDirections = () => {
    // Detectar se é mobile e qual app de mapa está disponível
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // Criar query string com nome ou endereço
    const query = address || salonName;

    if (isMobile) {
      if (isIOS) {
        // iOS: Tentar abrir Apple Maps, fallback para Google Maps
        const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(
          query
        )}`;
        window.location.href = appleMapsUrl;

        // Fallback para Google Maps depois de 1 segundo
        setTimeout(() => {
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(
            query
          )}`;
          window.open(googleMapsUrl, "_blank");
        }, 1000);
      } else {
        // Android: Tentar abrir Google Maps app, fallback para web
        const googleMapsApp = `google.navigation:q=${latitude},${longitude}`;
        window.location.href = googleMapsApp;

        // Fallback para Google Maps web depois de 1 segundo
        setTimeout(() => {
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
          window.open(googleMapsUrl, "_blank");
        }, 1000);
      }
    } else {
      // Desktop: Abrir Google Maps na web
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(
        query
      )}`;
      window.open(googleMapsUrl, "_blank");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleGetDirections}
      className={`gap-2 ${className}`}
      title={iconOnly ? "Como Chegar" : undefined}
    >
      <Navigation className="h-4 w-4" />
      {!iconOnly && (
        <>
          <span className="hidden sm:inline">Como Chegar</span>
          <span className="sm:hidden">Rotas</span>
        </>
      )}
    </Button>
  );
}
