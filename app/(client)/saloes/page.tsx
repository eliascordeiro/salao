"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SalonCard } from "@/components/salons/SalonCard";
import { SalonListSkeleton } from "@/components/ui/salon-skeleton";
import { Search, MapPin, Filter, Loader2, SlidersHorizontal, X, Navigation } from "lucide-react";
import { GridBackground } from "@/components/ui/grid-background";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import { calculateDistance, formatDistance } from "@/lib/utils/distance";

interface Salon {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coverPhoto?: string | null;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  verified: boolean;
  specialties: string[];
  distance?: number; // Adicionado para cálculo de distância
  _count?: {
    services: number;
    staff: number;
  };
}

interface LocationsData {
  states: string[];
  cities: string[];
  byState: Record<string, string[]>;
}

export default function SaloesPage() {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [locations, setLocations] = useState<LocationsData>({
    states: [],
    cities: [],
    byState: {},
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState("rating");
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 12;
  
  // Geolocalização
  const geolocation = useGeolocation();
  const [useLocation, setUseLocation] = useState(false);
  const [maxDistance, setMaxDistance] = useState(50); // Raio máximo em km (padrão: 50km)
  
  // Carregar localizações disponíveis
  useEffect(() => {
    async function loadLocations() {
      try {
        const response = await fetch("/api/public/locations");
        const result = await response.json();
        
        if (result.success) {
          setLocations(result.data);
        }
      } catch (error) {
        console.error("Erro ao carregar localizações:", error);
      }
    }
    
    loadLocations();
  }, []);
  
  // Carregar salões com filtros
  useEffect(() => {
    async function loadSalons() {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      
      try {
        // Construir query params
        const params = new URLSearchParams();
        if (selectedCity && selectedCity !== "ALL") params.set("city", selectedCity);
        if (selectedState && selectedState !== "ALL") params.set("state", selectedState);
        if (showFeaturedOnly) params.set("featured", "true");
        params.set("sort", sortBy);
        params.set("limit", LIMIT.toString());
        params.set("page", "1");
        
        const response = await fetch(`/api/public/salons?${params.toString()}`);
        const result = await response.json();
        
        if (result.success) {
          setSalons(result.data);
          setHasMore(result.data.length === LIMIT);
        }
      } catch (error) {
        console.error("Erro ao carregar salões:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSalons();
  }, [selectedCity, selectedState, sortBy, showFeaturedOnly]);
  
  // Carregar mais salões (infinite scroll)
  const loadMoreSalons = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    
    try {
      const params = new URLSearchParams();
      if (selectedCity && selectedCity !== "ALL") params.set("city", selectedCity);
      if (selectedState && selectedState !== "ALL") params.set("state", selectedState);
      if (showFeaturedOnly) params.set("featured", "true");
      params.set("sort", sortBy);
      params.set("limit", LIMIT.toString());
      params.set("page", nextPage.toString());
      
      const response = await fetch(`/api/public/salons?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setSalons(prev => [...prev, ...result.data]);
        setPage(nextPage);
        setHasMore(result.data.length === LIMIT);
      }
    } catch (error) {
      console.error("Erro ao carregar mais salões:", error);
    } finally {
      setLoadingMore(false);
    }
  };
  
  // Infinite scroll trigger
  const setTriggerRef = useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMoreSalons,
  });
  
  // Filtrar por busca local (nome)
  const filteredSalons = useMemo(() => {
    let result = salons.filter((salon) => {
      const matchesSearch = salon.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesState = !selectedState || selectedState === "ALL" || salon.state === selectedState;
      const matchesCity = !selectedCity || selectedCity === "ALL" || salon.city === selectedCity;
      
      return matchesSearch && matchesState && matchesCity;
    });
    
    // Calcular distância se geolocalização estiver ativa
    if (useLocation && geolocation.latitude && geolocation.longitude) {
      result = result.map(salon => {
        // Se o salão tem coordenadas, calcular distância real
        if (salon.latitude && salon.longitude) {
          const distance = calculateDistance(
            geolocation.latitude!,
            geolocation.longitude!,
            salon.latitude,
            salon.longitude
          );
          return { ...salon, distance };
        }
        // Se não tem coordenadas, deixar sem distância
        return { ...salon, distance: undefined };
      });
      
      // Filtrar por distância máxima
      result = result.filter(salon => {
        if (salon.distance === undefined) return false; // Remover salões sem coordenadas
        return salon.distance <= maxDistance;
      });
      
      // Ordenar por distância quando geolocalização está ativa
      result.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }
    
    return result;
  }, [salons, searchTerm, selectedState, selectedCity, useLocation, geolocation.latitude, geolocation.longitude, maxDistance]);
  
  // Limpar cidade ao mudar estado
  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedCity("ALL"); // Reset city when state changes
  };
  
  // Cidades disponíveis para o estado selecionado
  const availableCities = selectedState
    ? locations.byState[selectedState] || []
    : locations.cities;
  
  // Contar filtros ativos
  const activeFiltersCount = [
    selectedState && selectedState !== "ALL",
    selectedCity && selectedCity !== "ALL",
    showFeaturedOnly,
  ].filter(Boolean).length;
  
  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 space-y-8 overflow-visible">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">
            Encontre o Salão Perfeito
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Descubra os melhores salões e barbearias da sua região. Agende seu
            horário de forma rápida e prática!
          </p>
        </div>
        
        {/* Barra de Busca Sticky + Botão de Filtros */}
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border pb-4 -mx-4 px-4">
          <div className="flex items-center gap-2">
            {/* Busca por nome */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar salão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-11 text-base"
              />
            </div>
            
            {/* Botão de Geolocalização */}
            <Button
              variant={useLocation ? "default" : "outline"}
              size="lg"
              onClick={() => {
                if (!useLocation) {
                  geolocation.getLocation();
                  setUseLocation(true);
                } else {
                  geolocation.clearLocation();
                  setUseLocation(false);
                }
              }}
              disabled={geolocation.loading}
              className="h-11 px-3 sm:px-4 gap-2 whitespace-nowrap"
              title="Salões próximos a mim"
            >
              {geolocation.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {useLocation ? "Próximos" : "Perto de mim"}
              </span>
            </Button>
            
            {/* Botão de Filtros */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => setFiltersOpen(true)}
              className="relative h-11 px-4 gap-2 whitespace-nowrap"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
          
          {/* Alerta de Erro de Geolocalização */}
          {geolocation.error && (
            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {geolocation.error}
              </p>
            </div>
          )}
          
          {/* Badge de Localização Ativa */}
          {useLocation && geolocation.hasLocation && (
            <div className="mt-3 space-y-2">
              <div className="p-2 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Mostrando salões em um raio de {maxDistance}km
                </p>
              </div>
              
              {/* Controle de Raio de Busca */}
              <div className="p-3 glass-card rounded-lg space-y-2">
                <label className="text-xs text-foreground-muted font-medium flex items-center justify-between">
                  <span>Raio de busca: {maxDistance}km</span>
                  <button
                    onClick={() => setMaxDistance(50)}
                    className="text-xs text-primary hover:underline"
                  >
                    Resetar
                  </button>
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  className="w-full h-2 bg-background-alt/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-foreground-muted">
                  <span>5km</span>
                  <span>200km</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Chips de Filtros Ativos */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground">Filtros ativos:</span>
              
              {selectedState && selectedState !== "ALL" && (
                <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5">
                  {selectedState}
                  <button
                    onClick={() => setSelectedState("ALL")}
                    className="hover:bg-background/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {selectedCity && selectedCity !== "ALL" && (
                <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5">
                  {selectedCity}
                  <button
                    onClick={() => setSelectedCity("ALL")}
                    className="hover:bg-background/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              {showFeaturedOnly && (
                <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5">
                  ⭐ Destaques
                  <button
                    onClick={() => setShowFeaturedOnly(false)}
                    className="hover:bg-background/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedState("ALL");
                  setSelectedCity("ALL");
                  setShowFeaturedOnly(false);
                }}
                className="h-6 text-xs"
              >
                Limpar todos
              </Button>
            </div>
          )}
        </div>
        
        {/* Resultados */}
        <div>
          {/* Counter */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-muted-foreground">
              {loading ? (
                "Carregando..."
              ) : (
                <>
                  <span className="font-semibold text-foreground">
                    {filteredSalons.length}
                  </span>{" "}
                  {filteredSalons.length === 1 ? "salão encontrado" : "salões encontrados"}
                </>
              )}
            </p>
          </div>
          
          {/* Grid */}
          {loading ? (
            <SalonListSkeleton count={12} />
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <MapPin className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Nenhum salão encontrado
                </h3>
                <p className="text-muted-foreground">
                  {useLocation && geolocation.hasLocation 
                    ? `Nenhum salão encontrado em um raio de ${maxDistance}km. Tente aumentar o raio de busca.`
                    : "Tente ajustar os filtros para ver mais resultados"}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Contador de Resultados */}
              {useLocation && geolocation.hasLocation && (
                <div className="mb-4 p-3 glass-card rounded-lg">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary" />
                    <span className="font-medium">{filteredSalons.length}</span> 
                    {filteredSalons.length === 1 ? "salão encontrado" : "salões encontrados"} em um raio de <span className="font-medium">{maxDistance}km</span>
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredSalons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>
              
              {/* Infinite Scroll Trigger */}
              {hasMore && (
                <div ref={setTriggerRef} className="py-8">
                  {loadingMore && (
                    <div className="flex justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              )}
              
              {/* End Message */}
              {!hasMore && filteredSalons.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    ✨ Você viu todos os salões disponíveis
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Bottom Sheet de Filtros */}
      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title="Filtros de Busca"
        description="Refine sua busca por localização e preferências"
      >
        <div className="space-y-6">
          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os estados</SelectItem>
                {locations.states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Cidade */}
          <div className="space-y-2">
            <Label>Cidade</Label>
            <Select
              value={selectedCity}
              onValueChange={setSelectedCity}
              disabled={!selectedState || selectedState === "ALL"}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Todas as cidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as cidades</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Ordenação */}
          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Melhor avaliados</SelectItem>
                <SelectItem value="newest">Mais recentes</SelectItem>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Toggle Featured */}
          <div className="space-y-2">
            <Label>Preferências</Label>
            <Button
              variant={showFeaturedOnly ? "default" : "outline"}
              size="lg"
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="w-full justify-start gap-2"
            >
              ⭐ {showFeaturedOnly ? "Mostrando apenas destaques" : "Mostrar apenas destaques"}
            </Button>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setSelectedState("ALL");
                setSelectedCity("ALL");
                setSortBy("rating");
                setShowFeaturedOnly(false);
              }}
              className="flex-1"
            >
              Limpar tudo
            </Button>
            <Button
              size="lg"
              onClick={() => setFiltersOpen(false)}
              className="flex-1"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </BottomSheet>
    </GridBackground>
  );
}
