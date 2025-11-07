"use client";

import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface ReviewCardProps {
  review: {
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
  };
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = review.user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  
  const date = new Date(review.createdAt);
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  
  return (
    <Card className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <p className="font-semibold">{review.user.name}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>
        
        {/* Rating Stars */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? "fill-amber-400 text-amber-400"
                  : "fill-gray-200 text-gray-200"
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Service (if available) */}
      {review.booking?.service && (
        <p className="text-sm text-muted-foreground">
          Serviço: <span className="font-medium text-foreground">{review.booking.service.name}</span>
        </p>
      )}
      
      {/* Comment */}
      {review.comment && (
        <p className="text-sm leading-relaxed">{review.comment}</p>
      )}
    </Card>
  );
}
