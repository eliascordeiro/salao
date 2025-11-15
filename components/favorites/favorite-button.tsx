"use client";

import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  salonId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const iconSizes = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function FavoriteButton({
  salonId,
  size = "md",
  className,
  showLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, isLoaded } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevenir hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoaded) {
    return (
      <button
        className={cn(
          "flex items-center justify-center rounded-full",
          "bg-white/90 backdrop-blur-sm border border-gray-200",
          "transition-all duration-200",
          sizeClasses[size],
          className
        )}
        disabled
      >
        <Heart size={iconSizes[size]} className="text-gray-400" />
      </button>
    );
  }

  const favorite = isFavorite(salonId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    toggleFavorite(salonId);

    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full",
        "bg-white/90 backdrop-blur-sm border border-gray-200",
        "hover:bg-white hover:scale-110 hover:shadow-lg",
        "active:scale-95",
        "transition-all duration-200",
        "group",
        sizeClasses[size],
        isAnimating && "animate-bounce",
        className
      )}
      title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
    >
      <Heart
        size={iconSizes[size]}
        className={cn(
          "transition-all duration-200",
          favorite
            ? "fill-red-500 text-red-500"
            : "text-gray-600 group-hover:text-red-500"
        )}
      />
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {favorite ? "Favoritado" : "Favoritar"}
        </span>
      )}
    </button>
  );
}
