"use client";

import { Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

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
  const router = useRouter();

  const handleGetDirections = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Navegar para página interna de navegação com Mapbox
    const params = new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      name: salonName,
    });
    
    // Adicionar endereço se disponível
    if (address) {
      params.append('address', address);
    }
    
    router.push(`/navegacao?${params.toString()}`);
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
