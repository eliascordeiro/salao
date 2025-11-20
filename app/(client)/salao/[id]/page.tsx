"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReviewCard } from "@/components/salons/ReviewCard";
import { GridBackground } from "@/components/ui/grid-background";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedText } from "@/components/ui/animated-text";
import { GradientButton } from "@/components/ui/gradient-button";
import { SalonMap } from "@/components/maps/salon-map";
import { DirectionsButton } from "@/components/maps/directions-button";
import { AIChatWidget } from "@/components/chat/ai-chat-widget";
import {
  MapPin,
  Phone,
  Star,
  Briefcase,
  Users,
  CheckCircle,
  Calendar,
  ArrowLeft,
  Loader2,
  MessageCircle,
  Clock,
  Award,
  Sparkles,
  Heart,
  Share2,
  TrendingUp,
  Crown,
  Camera,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TabType = "servicos" | "profissionais" | "sobre" | "avaliacoes";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
  _count?: {
    staff: number;
  };
}

interface Staff {
  id: string;
  name: string;
  specialty?: string | null;
  _count?: {
    services: number;
  };
}

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: {
    name: string;
  };
  booking?: {
    scheduledDate: string;
    service: {
      name: string;
    };
  } | null;
}

interface Salon {
  id: string;
  name: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  coverPhoto?: string | null;
  photos: string[];
  rating: number;
  reviewsCount: number;
  featured: boolean;
  verified: boolean;
  specialties: string[];
  services: Service[];
  staff: Staff[];
  reviews: Review[];
  stats: {
    totalServices: number;
    totalStaff: number;
    totalReviews: number;
    averageRating: number;
  };
}

export default function SalaoPage() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;
  
  const [salon, setSalon] = useState<Salon | null>(null);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("servicos");
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  // Carregar dados do salão
  useEffect(() => {
    async function loadSalon() {
      try {
        const response = await fetch(`/api/public/salons/${salonId}`);
        const result = await response.json();
        
        if (result.success) {
          setSalon(result.data);
        } else {
          // Salão não encontrado
          router.push("/saloes");
        }
      } catch (error) {
        console.error("Erro ao carregar salão:", error);
        router.push("/saloes");
      } finally {
        setLoading(false);
      }
    }
    
    loadSalon();
  }, [salonId, router]);
  
  // Carregar todas as reviews quando aba é ativada
  useEffect(() => {
    if (activeTab === "avaliacoes" && salon && allReviews.length === 0) {
      loadAllReviews();
    }
  }, [activeTab, salon]);
  
  async function loadAllReviews() {
    if (!salon) return;
    
    setLoadingReviews(true);
    try {
      const response = await fetch(`/api/public/salons/${salon.id}/reviews?limit=50`);
      const result = await response.json();
      
      if (result.success) {
        setAllReviews(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    } finally {
      setLoadingReviews(false);
    }
  }
  
  if (loading) {
    return (
      <GridBackground>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GridBackground>
    );
  }
  
  if (!salon) {
    return null; // Router já redirecionou
  }
  
  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/saloes")}
            className="gap-2 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para salões
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFavorite(!isFavorite)}
              className={cn(
                "transition-all duration-300 h-9 w-9 p-0",
                isFavorite && "bg-red-500/10 border-red-500 text-red-500"
              )}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="h-9 w-9 p-0"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              {showShareMenu && (
                <div className="absolute right-0 top-12 bg-background/95 backdrop-blur-md border border-primary/20 rounded-lg shadow-xl p-3 space-y-2 z-50 min-w-[200px]">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 text-sm"
                  >
                    📋 Copiar link
                  </button>
                  <button
                    onClick={() => {
                      window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
                      setShowShareMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded hover:bg-primary/10 text-sm"
                  >
                    💬 WhatsApp
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Cover Image com Overlay Gradient */}
        <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 group">
          {salon.coverPhoto ? (
            <>
              <Image
                src={salon.coverPhoto}
                alt={salon.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="flex items-center justify-center h-full relative">
              <div className="text-center space-y-2">
                <Briefcase className="h-16 w-16 text-primary/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Espaço reservado para foto de capa</p>
              </div>
            </div>
          )}
          
          {/* Selo de Destaque */}
          {salon.featured && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-yellow-500/90 text-yellow-900 gap-1 px-3 py-1 backdrop-blur-sm">
                <Crown className="h-3 w-3" />
                Destaque
              </Badge>
            </div>
          )}
        </div>
        
        {/* Header Info Aprimorado */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  {salon.name}
                </h1>
                {salon.verified && (
                  <Badge className="bg-blue-500/90 text-white border-0 flex items-center gap-1 animate-pulse">
                    <CheckCircle className="h-3 w-3" />
                    Verificado
                  </Badge>
                )}
              </div>
              
              {/* Location */}
              
              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                <MapPin className="h-4 w-4 group-hover:animate-bounce flex-shrink-0" />
                <span className="text-sm">{salon.address}</span>
                {salon.city && salon.state && (
                  <span className="text-xs opacity-70">
                    • {salon.city}, {salon.state}
                  </span>
                )}
              </div>
              
              {/* Como Chegar Button */}
              {salon.latitude && salon.longitude && (
                <DirectionsButton
                  latitude={salon.latitude}
                  longitude={salon.longitude}
                  salonName={salon.name}
                  address={salon.address}
                  variant="outline"
                  size="sm"
                />
              )}
              
              {/* Phone com link clicável */}
              <a 
                href={`tel:${salon.phone}`}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors w-fit group"
              >
                <Phone className="h-4 w-4 group-hover:animate-pulse" />
                <span className="text-sm">{salon.phone}</span>
              </a>
            </div>
            
            {/* Stats Card Melhorado */}
            <GlassCard className="p-5 space-y-3 min-w-[220px]">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(salon.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-2xl font-bold">
                  {salon.rating > 0 ? salon.rating.toFixed(1) : "Novo"}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Award className="h-3 w-3" />
                {salon.reviewsCount} {salon.reviewsCount === 1 ? "avaliação" : "avaliações"}
              </p>
              
              <div className="flex items-center gap-4 pt-3 border-t border-primary/10 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <span>{salon.stats.totalServices} serviços</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>{salon.stats.totalStaff} profissionais</span>
                </div>
              </div>
            </GlassCard>
          </div>
          
          {/* Specialties com visual aprimorado */}
          {salon.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {salon.specialties.map((specialty) => (
                <Badge 
                  key={specialty} 
                  variant="outline"
                  className="px-3 py-1 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </GlassCard>
        
        {/* Tabs Melhorados */}
        <GlassCard className="p-2">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={activeTab === "servicos" ? "default" : "ghost"}
              onClick={() => setActiveTab("servicos")}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                activeTab === "servicos" && "bg-gradient-to-r from-primary to-purple-500"
              )}
            >
              <Briefcase className="h-4 w-4 mr-2" />
              <Briefcase className="h-4 w-4 mr-2" />
              Serviços ({salon.stats.totalServices})
            </Button>
            <Button
              variant={activeTab === "profissionais" ? "default" : "ghost"}
              onClick={() => setActiveTab("profissionais")}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                activeTab === "profissionais" && "bg-gradient-to-r from-primary to-purple-500"
              )}
            >
              <Users className="h-4 w-4 mr-2" />
              Profissionais ({salon.stats.totalStaff})
            </Button>
            <Button
              variant={activeTab === "sobre" ? "default" : "ghost"}
              onClick={() => setActiveTab("sobre")}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                activeTab === "sobre" && "bg-gradient-to-r from-primary to-purple-500"
              )}
            >
              Sobre
            </Button>
            <Button
              variant={activeTab === "avaliacoes" ? "default" : "ghost"}
              onClick={() => setActiveTab("avaliacoes")}
              className={cn(
                "flex-shrink-0 transition-all duration-300",
                activeTab === "avaliacoes" && "bg-gradient-to-r from-primary to-purple-500"
              )}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Avaliações ({salon.reviewsCount})
            </Button>
          </div>
        </GlassCard>
        
        {/* Tab Content */}
        <div className="space-y-4">
          {/* Serviços Melhorados */}
          {activeTab === "servicos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salon.services.map((service, index) => (
                <GlassCard 
                  key={service.id} 
                  className="p-5 space-y-3 hover:scale-105 hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors flex-1">
                      {service.name}
                    </h3>
                    <Badge variant="outline" className="bg-primary/10 flex-shrink-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {service.duration}min
                    </Badge>
                  </div>
                  
                  {service.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                    {service._count && service._count.staff > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-primary" />
                        <span>
                          {service._count.staff} {service._count.staff === 1 ? "profissional" : "profissionais"}
                        </span>
                      </div>
                    )}
                    <span className="font-bold text-xl text-primary ml-auto">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-2 bg-gradient-to-r from-primary to-purple-500 hover:shadow-lg transition-all hover:scale-105"
                    onClick={() => router.push(`/salao/${salon.id}/agendar?servico=${service.id}`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar este serviço
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}
          
          {/* Profissionais Melhorados */}
          {activeTab === "profissionais" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salon.staff.map((member, index) => (
                <GlassCard 
                  key={member.id} 
                  className="p-5 space-y-3 hover:scale-105 transition-transform duration-300 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      {member.specialty && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Award className="h-3 w-3" />
                          {member.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {member._count && member._count.services > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-primary/10">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <span>
                        Oferece {member._count.services} {member._count.services === 1 ? "serviço" : "serviços"}
                      </span>
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-2 hover:bg-primary/10 transition-all group-hover:border-primary"
                    onClick={() => router.push(`/salao/${salon.id}/agendar?profissional=${member.id}`)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Agendar com {member.name.split(' ')[0]}
                  </Button>
                </GlassCard>
              ))}
            </div>
          )}
          
          {/* Sobre Melhorado */}
          {activeTab === "sobre" && (
            <GlassCard className="p-6 space-y-6">
              {salon.description && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl flex items-center gap-2 text-primary">
                    <Sparkles className="h-5 w-5" />
                    Sobre o Salão
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-justify">
                    {salon.description}
                  </p>
                </div>
              )}
              
              {/* Photos Gallery Melhorada */}
              {salon.photos.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-xl flex items-center gap-2 text-primary">
                    <Camera className="h-5 w-5" />
                    Galeria de Fotos
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {salon.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative h-40 rounded-lg overflow-hidden bg-muted group cursor-pointer"
                      >
                        <Image
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact Info Aprimorado */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xl flex items-center gap-2 text-primary">
                  <Phone className="h-5 w-5" />
                  Informações de Contato
                </h3>
                <div className="space-y-3 text-muted-foreground">
                  <a 
                    href={`tel:${salon.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Telefone</p>
                      <p className="font-medium text-foreground">{salon.phone}</p>
                    </div>
                  </a>
                  
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors group">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs opacity-70">Endereço</p>
                      <p className="font-medium text-foreground">
                        {salon.address}
                        {salon.city && salon.state && `, ${salon.city} - ${salon.state}`}
                        {salon.zipCode && ` • CEP: ${salon.zipCode}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Mapa de Localização */}
              {salon.latitude && salon.longitude && (
                <GlassCard className="p-5 space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Localização
                  </h3>
                  <SalonMap
                    latitude={salon.latitude}
                    longitude={salon.longitude}
                    salonName={salon.name}
                    height={350}
                    zoom={15}
                  />
                  <DirectionsButton
                    latitude={salon.latitude}
                    longitude={salon.longitude}
                    salonName={salon.name}
                    address={salon.address}
                    variant="default"
                    size="default"
                    className="w-full"
                  />
                </GlassCard>
              )}
            </GlassCard>
          )}
          
          {/* Avaliações Melhoradas */}
          {activeTab === "avaliacoes" && (
            <div className="space-y-6">
              {/* Rating Overview */}
              {salon.reviewsCount > 0 && (
                <GlassCard className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-primary">
                          {salon.rating.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-4 w-4",
                                i < Math.floor(salon.rating)
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {salon.reviewsCount} {salon.reviewsCount === 1 ? "avaliação" : "avaliações"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Recomendado por clientes</span>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {/* Reviews List */}
              {loadingReviews ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : allReviews.length > 0 ? (
                <div className="space-y-3">
                  {allReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : salon.reviews.length > 0 ? (
                <div className="space-y-3">
                  {salon.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <GlassCard className="p-10 text-center space-y-3">
                  <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Nenhuma avaliação ainda</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Seja o primeiro a avaliar este salão e ajude outros clientes!
                  </p>
                </GlassCard>
              )}
            </div>
          )}
        </div>
        
        {/* AI Chat Widget */}
        <AIChatWidget salonId={salon.id} salonName={salon.name} />
      </div>
    </GridBackground>
  );
}
