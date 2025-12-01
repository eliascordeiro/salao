"use client";

import { useEffect, useState } from "react";

const FAVORITES_KEY = "salon-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar favoritos do localStorage na montagem
  useEffect(() => {
    // Garantir que estamos no cliente
    if (typeof window === "undefined") {
      setIsLoaded(true);
      return;
    }

    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error("Erro ao carregar favoritos:", error);
      setFavorites([]);
      setIsLoaded(true);
    }
  }, []);

  // Salvar favoritos no localStorage quando mudar
  useEffect(() => {
    // Garantir que estamos no cliente
    if (typeof window === "undefined") return;

    if (isLoaded) {
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error("Erro ao salvar favoritos:", error);
      }
    }
  }, [favorites, isLoaded]);

  const addFavorite = (salonId: string) => {
    setFavorites((prev) => {
      if (prev.includes(salonId)) return prev;
      return [...prev, salonId];
    });
  };

  const removeFavorite = (salonId: string) => {
    setFavorites((prev) => prev.filter((id) => id !== salonId));
  };

  const toggleFavorite = (salonId: string) => {
    if (favorites.includes(salonId)) {
      removeFavorite(salonId);
    } else {
      addFavorite(salonId);
    }
  };

  const isFavorite = (salonId: string) => {
    return favorites.includes(salonId);
  };

  const getFavorites = () => {
    return favorites;
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  return {
    favorites,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavorites,
    clearFavorites,
    count: favorites.length,
  };
}
