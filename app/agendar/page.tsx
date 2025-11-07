"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";

interface BookingTypeConfig {
  bookingType: string;
  salonName: string;
}

function BookingSelector() {
  const router = useRouter();
  const [config, setConfig] = useState<BookingTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingType();
  }, []);

  const fetchBookingType = async () => {
    try {
      // Sempre redireciona para slots (horários pré-definidos)
      router.push("/agendar-slots");
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
      // Em caso de erro, também redireciona para slots
      router.push("/agendar-slots");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GridBackground>
          <div className="container mx-auto px-4 py-20">
            <GlassCard className="max-w-md mx-auto text-center py-16">
              <div className="animate-pulseGlow inline-block mb-6">
                <Sparkles className="h-16 w-16 text-primary mx-auto" />
              </div>
              <p className="text-xl text-foreground-muted font-medium">
                Carregando agendamento...
              </p>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    );
  }

  // Sempre redireciona para slots, este return nunca será alcançado
  return null;
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <GridBackground>
          <div className="container mx-auto px-4 py-20">
            <GlassCard className="max-w-md mx-auto text-center py-16">
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-6" />
              <p className="text-xl text-foreground-muted font-medium">
                Preparando agendamento...
              </p>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    }>
      <BookingSelector />
    </Suspense>
  );
}
