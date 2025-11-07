"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReviewCard } from "@/components/salons/ReviewCard";
import { GridBackground } from "@/components/ui/grid-background";
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
} from "lucide-react";
import Link from "next/link";

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
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/saloes")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para salões
        </Button>
        
        {/* Cover Image */}
        <div className="relative h-64 md:h-96 rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
          {salon.coverPhoto ? (
            <Image
              src={salon.coverPhoto}
              alt={salon.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Briefcase className="h-24 w-24 text-primary/30" />
            </div>
          )}
          
          {/* Floating Action Button */}
          <div className="absolute bottom-4 right-4">
            <Link href={`/salao/${salon.id}/agendar`}>
              <Button size="lg" className="shadow-lg">
                <Calendar className="h-5 w-5 mr-2" />
                Agendar Agora
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Header Info */}
        <div className="glass-card p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{salon.name}</h1>
                {salon.verified && (
                  <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verificado
                  </Badge>
                )}
                {salon.featured && (
                  <Badge className="bg-amber-500 text-white border-0">
                    ⭐ Destaque
                  </Badge>
                )}
              </div>
              
              {/* Location */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{salon.address}</span>
                {salon.city && salon.state && (
                  <span className="text-sm">
                    • {salon.city}, {salon.state}
                  </span>
                )}
              </div>
              
              {/* Phone */}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{salon.phone}</span>
              </div>
            </div>
            
            {/* Stats Card */}
            <Card className="p-4 space-y-2 min-w-[200px]">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-2xl font-bold">
                  {salon.rating > 0 ? salon.rating.toFixed(1) : "Novo"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {salon.reviewsCount} {salon.reviewsCount === 1 ? "avaliação" : "avaliações"}
              </p>
              <div className="flex items-center gap-4 pt-2 border-t text-sm">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{salon.stats.totalServices} serviços</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{salon.stats.totalStaff} profissionais</span>
                </div>
              </div>
            </Card>
          </div>
          
          {/* Specialties */}
          {salon.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {salon.specialties.map((specialty) => (
                <Badge key={specialty} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Tabs */}
        <div className="glass-card p-2">
          <div className="flex gap-2 overflow-x-auto">
            <Button
              variant={activeTab === "servicos" ? "default" : "ghost"}
              onClick={() => setActiveTab("servicos")}
              className="flex-shrink-0"
            >
              <Briefcase className="h-4 w-4 mr-2" />
              Serviços ({salon.stats.totalServices})
            </Button>
            <Button
              variant={activeTab === "profissionais" ? "default" : "ghost"}
              onClick={() => setActiveTab("profissionais")}
              className="flex-shrink-0"
            >
              <Users className="h-4 w-4 mr-2" />
              Profissionais ({salon.stats.totalStaff})
            </Button>
            <Button
              variant={activeTab === "sobre" ? "default" : "ghost"}
              onClick={() => setActiveTab("sobre")}
              className="flex-shrink-0"
            >
              Sobre
            </Button>
            <Button
              variant={activeTab === "avaliacoes" ? "default" : "ghost"}
              onClick={() => setActiveTab("avaliacoes")}
              className="flex-shrink-0"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Avaliações ({salon.reviewsCount})
            </Button>
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="space-y-4">
          {/* Serviços */}
          {activeTab === "servicos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salon.services.map((service) => (
                <Card key={service.id} className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                      {service.duration} min
                    </span>
                    <span className="font-semibold text-lg text-primary">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                  {service._count && service._count.staff > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {service._count.staff} {service._count.staff === 1 ? "profissional" : "profissionais"}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
          
          {/* Profissionais */}
          {activeTab === "profissionais" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {salon.staff.map((member) => (
                <Card key={member.id} className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  {member.specialty && (
                    <p className="text-sm text-muted-foreground">
                      {member.specialty}
                    </p>
                  )}
                  {member._count && member._count.services > 0 && (
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      Oferece {member._count.services} {member._count.services === 1 ? "serviço" : "serviços"}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
          
          {/* Sobre */}
          {activeTab === "sobre" && (
            <Card className="p-6 space-y-4">
              {salon.description && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Sobre o Salão</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {salon.description}
                  </p>
                </div>
              )}
              
              {/* Photos Gallery */}
              {salon.photos.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Galeria de Fotos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {salon.photos.map((photo, index) => (
                      <div
                        key={index}
                        className="relative h-40 rounded-lg overflow-hidden bg-muted"
                      >
                        <Image
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Informações de Contato</h3>
                <div className="space-y-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{salon.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {salon.address}
                      {salon.city && salon.state && `, ${salon.city} - ${salon.state}`}
                      {salon.zipCode && ` • CEP: ${salon.zipCode}`}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
          
          {/* Avaliações */}
          {activeTab === "avaliacoes" && (
            <div className="space-y-4">
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
                <Card className="p-10 text-center space-y-2">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <h3 className="font-semibold">Nenhuma avaliação ainda</h3>
                  <p className="text-sm text-muted-foreground">
                    Seja o primeiro a avaliar este salão!
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
        
        {/* Floating CTA Mobile */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <Link href={`/salao/${salon.id}/agendar`}>
            <Button size="lg" className="shadow-xl rounded-full">
              <Calendar className="h-5 w-5 mr-2" />
              Agendar
            </Button>
          </Link>
        </div>
      </div>
    </GridBackground>
  );
}
