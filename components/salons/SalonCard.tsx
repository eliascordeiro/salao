"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Star, Users, Briefcase, CheckCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface SalonCardProps {
  salon: {
    id: string;
    name: string;
    description?: string | null;
    city?: string | null;
    state?: string | null;
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
  };
}

export function SalonCard({ salon }: SalonCardProps) {
  return (
    <Link href={`/salao/${salon.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        {/* Cover Photo */}
        <div className="relative h-48 w-full bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
          {salon.coverPhoto ? (
            <Image
              src={salon.coverPhoto}
              alt={salon.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Briefcase className="h-16 w-16 text-primary/30" />
            </div>
          )}
          
          {/* Badges de destaque */}
          <div className="absolute top-3 left-3 flex gap-2">
            {salon.featured && (
              <Badge className="bg-amber-500 text-white border-0">
                ⭐ Destaque
              </Badge>
            )}
            {salon.verified && (
              <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verificado
              </Badge>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Nome */}
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {salon.name}
            </h3>
            
            {/* Localização */}
            {salon.city && salon.state && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{salon.city}, {salon.state}</span>
              </div>
            )}
          </div>
          
          {/* Descrição */}
          {salon.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {salon.description}
            </p>
          )}
          
          {/* Especialidades */}
          {salon.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {salon.specialties.slice(0, 3).map((specialty) => (
                <Badge key={specialty} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
              {salon.specialties.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{salon.specialties.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium text-sm">
                {salon.rating > 0 ? salon.rating.toFixed(1) : "Novo"}
              </span>
              {salon.reviewsCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({salon.reviewsCount})
                </span>
              )}
            </div>
            
            {/* Counters */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {salon._count && (
                <>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{salon._count.services}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    <span>{salon._count.staff}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
