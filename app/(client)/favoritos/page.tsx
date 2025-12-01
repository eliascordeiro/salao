"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useFavorites } from "@/hooks/use-favorites";
import { Button } from "@/components/ui/button";
import { SalonListSkeleton } from "@/components/ui/salon-skeleton";
import { Heart, Trash2, RefreshCw } from "lucide-react";
import Link from "next/link";

// Importar componentes que podem ter problemas SSR de forma dinâmica
const SalonCard = dynamic(
  () => import("@/components/salons/SalonCard").then((mod) => mod.SalonCard),
  { ssr: false, loading: () => <SalonListSkeleton /> }
);

const GridBackground = dynamic(
  () => import("@/components/ui/grid-background").then((mod) => mod.GridBackground),
  { ssr: false }
);

interface Salon {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude: number | null;
  longitude: number | null;
  coverPhoto?: string | null;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  verified: boolean;
  specialties: string[];
  _count?: {
    services: number;
    staff: number;
  };
}

export default function FavoritosPage() {
  const { favorites, isLoaded, clearFavorites } = useFavorites();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Garantir que está montado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Carregar dados dos salões favoritos
  useEffect(() => {
    // Não executar no servidor ou antes de montar
    if (!mounted || typeof window === "undefined") {
      return;
    }
    async function loadFavoriteSalons() {
      if (!isLoaded || favorites.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Buscar dados de cada salão favorito
        const salonPromises = favorites.map(async (salonId) => {
          try {
            const response = await fetch(`/api/public/salons/${salonId}`);
            if (response.ok) {
              const data = await response.json();
              return data.salon;
            }
            return null;
          } catch (error) {
            console.error(`Erro ao carregar salão ${salonId}:`, error);
            return null;
          }
        });

        const results = await Promise.all(salonPromises);
        const validSalons = results.filter((salon): salon is Salon => salon !== null);
        
        setSalons(validSalons);
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
      } finally {
        setLoading(false);
      }
    }

    loadFavoriteSalons();
  }, [favorites, isLoaded, mounted]);

  const handleClearAll = () => {
    if (typeof window === "undefined") return;
    if (confirm("Tem certeza que deseja remover todos os favoritos?")) {
      clearFavorites();
      setSalons([]);
    }
  };

  // Não renderizar até montar no cliente
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SalonListSkeleton />
      </div>
    );
  }

  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center">
                <Heart className="h-6 w-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
                  Meus Favoritos
                </h1>
                <p className="text-muted-foreground">
                  {isLoaded ? `${favorites.length} ${favorites.length === 1 ? "salão salvo" : "salões salvos"}` : "Carregando..."}
                </p>
              </div>
            </div>

            {favorites.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Limpar tudo
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground max-w-2xl">
            Salve seus salões preferidos para acessá-los rapidamente. Seus favoritos são salvos localmente no seu dispositivo.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <SalonListSkeleton />
        ) : favorites.length === 0 ? (
          // Estado vazio
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-red-500/10 to-pink-500/10 flex items-center justify-center mb-6">
              <Heart className="h-12 w-12 text-red-500/50" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-center">
              Nenhum favorito ainda
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              Explore nossos salões e toque no ❤️ para adicionar aos favoritos. Você poderá acessá-los rapidamente aqui.
            </p>
            <Button asChild size="lg" className="gap-2">
              <Link href="/saloes">
                <RefreshCw className="h-5 w-5" />
                Explorar Salões
              </Link>
            </Button>
          </div>
        ) : (
          // Grid de salões favoritos
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {salons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        )}

        {/* Mensagem de aviso sobre favoritos removidos */}
        {isLoaded && favorites.length > 0 && salons.length < favorites.length && (
          <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              ⚠️ Alguns salões favoritos não puderam ser carregados (podem ter sido removidos).
            </p>
          </div>
        )}
      </div>
    </GridBackground>
  );
}
