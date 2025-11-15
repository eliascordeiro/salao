"use client";

import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Users, Briefcase, CheckCircle, Crown, Sparkles, ArrowRight, Phone, Navigation, Share2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/distance";
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    coverPhoto?: string | null;
    rating: number;
    reviewsCount: number;
    featured: boolean;
    verified: boolean;
    specialties: string[];
    distance?: number; // Distância em km (calculada pela geolocalização)
    _count?: {
      services: number;
      staff: number;
    };
  };
}

export function SalonCard({ salon }: SalonCardProps) {
  // Função para compartilhar salão
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: salon.name,
      text: `Confira ${salon.name} - ${salon.city}, ${salon.state}`,
      url: `${window.location.origin}/salao/${salon.id}`,
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copiar link
        await navigator.clipboard.writeText(shareData.url);
        alert("Link copiado para a área de transferência!");
      }
    } catch (error) {
      console.error("Erro ao compartilhar:", error);
    }
  };
  
  // Função para abrir no mapa
  const handleOpenMap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const address = salon.address 
      ? `${salon.address}, ${salon.city}, ${salon.state}`
      : `${salon.name}, ${salon.city}, ${salon.state}`;
    
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank");
  };
  
  return (
    <Link href={`/salao/${salon.id}`} className="block h-full">
      <GlassCard className="group overflow-hidden h-full flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50 cursor-pointer relative">
        {/* Botão de Favorito - Canto superior esquerdo */}
        <div className="absolute top-3 left-3 z-20">
          <FavoriteButton salonId={salon.id} size="md" />
        </div>
        
        {/* Quick Actions - Aparece no hover em desktop, sempre visível em mobile */}
        <div className="absolute top-16 right-3 z-10 flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {salon.phone && (
            <Button
              size="sm"
              variant="outline"
              className="h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/20 hover:bg-primary hover:text-white shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `tel:${salon.phone}`;
              }}
              title="Ligar"
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/20 hover:bg-primary hover:text-white shadow-lg"
            onClick={handleOpenMap}
            title="Ver no mapa"
          >
            <Navigation className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            className="h-10 w-10 p-0 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/20 hover:bg-primary hover:text-white shadow-lg"
            onClick={handleShare}
            title="Compartilhar"
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
        {/* Cover Photo com Overlay */}
        <div className="relative h-56 w-full bg-gradient-to-br from-primary/10 to-purple-500/10 overflow-hidden">
          {salon.coverPhoto ? (
            <>
              <Image
                src={salon.coverPhoto}
                alt={salon.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Briefcase className="h-16 w-16 text-primary/40 mb-2" />
              <span className="text-xs text-muted-foreground">Sem foto</span>
            </div>
          )}
          
          {/* Badges Flutuantes */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {salon.distance !== undefined && (
              <Badge className="bg-primary/90 backdrop-blur-sm text-white border-0 shadow-lg">
                <Navigation className="h-3 w-3 mr-1" />
                {formatDistance(salon.distance)}
              </Badge>
            )}
            
            {salon.featured && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 shadow-lg animate-pulse">
                <Crown className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
            {salon.verified && (
              <Badge className="bg-blue-500/90 backdrop-blur-sm text-white border-0 shadow-lg">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
          </div>

          {/* Rating Badge no canto inferior esquerdo */}
          {salon.rating > 0 && (
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-sm text-white">
                  {salon.rating.toFixed(1)}
                </span>
                <span className="text-xs text-white/80">
                  ({salon.reviewsCount})
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Content Aprimorado */}
        <div className="p-5 space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">
              {salon.name}
            </h3>
            
            {/* Localização */}
            {salon.city && salon.state && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground group-hover:text-primary transition-colors">
                <MapPin className="h-4 w-4" />
                <span>{salon.city}, {salon.state}</span>
              </div>
            )}
          </div>
          
          {/* Descrição */}
          {salon.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {salon.description}
            </p>
          )}
          
          {/* Especialidades com visual melhorado */}
          {salon.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {salon.specialties.slice(0, 3).map((specialty) => (
                <Badge 
                  key={specialty} 
                  variant="outline" 
                  className="text-xs bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {specialty}
                </Badge>
              ))}
              {salon.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                  +{salon.specialties.length - 3} mais
                </Badge>
              )}
            </div>
          )}
          
          {/* Spacer para empurrar stats para baixo */}
          <div className="flex-1" />
          
          {/* Stats com visual melhorado */}
          <div className="flex items-center justify-between pt-3 border-t border-primary/10">
            {/* Contadores */}
            <div className="flex items-center gap-4 text-sm">
              {salon._count && (
                <>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{salon._count.services}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{salon._count.staff}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Botão Ver Mais */}
            <div className="flex items-center gap-1 text-primary text-sm font-medium group-hover:gap-2 transition-all">
              <span>Ver mais</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
