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
      const response = await fetch("/api/salon/booking-type");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);

        if (data.bookingType === "DYNAMIC") {
          router.push("/agendar-dinamico");
        } else if (data.bookingType === "SLOT_BASED") {
          router.push("/agendar-slots");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar configuração:", error);
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
                Carregando opções de agendamento...
              </p>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    );
  }

  if (config?.bookingType === "BOTH") {
    return (
      <div className="min-h-screen bg-background">
        <GridBackground>
          <div className="container mx-auto px-4 py-12 max-w-6xl">
            <div className="text-center mb-12">
              <AnimatedText className="text-4xl font-bold mb-4">
                📅 Escolha seu Tipo de Agendamento
              </AnimatedText>
              <p className="text-foreground-muted text-lg">
                Selecione como prefere fazer seu agendamento em {config.salonName}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <GlassCard 
                glow="primary" 
                className="p-8 cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => router.push("/agendar-dinamico")}
              >
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-block p-4 bg-primary/10 rounded-full">
                      <Clock className="h-12 w-12 text-primary" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-4">Agendamento Dinâmico</h2>
                  
                  <p className="text-foreground-muted mb-6">
                    Veja todos os horários disponíveis em tempo real.
                  </p>

                  <div className="space-y-2 mb-6 text-left">
                    <div className="flex items-center gap-2 text-success">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="text-sm">Horários em tempo real</span>
                    </div>
                  </div>

                  <GradientButton variant="primary" className="w-full">
                    Escolher Dinâmico
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </GradientButton>
                </div>
              </GlassCard>

              <GlassCard 
                glow="accent" 
                className="p-8 cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => router.push("/agendar-slots")}
              >
                <div className="text-center">
                  <div className="mb-6">
                    <div className="inline-block p-4 bg-accent/10 rounded-full">
                      <Calendar className="h-12 w-12 text-accent" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-4">Horários Pré-definidos</h2>
                  
                  <p className="text-foreground-muted mb-6">
                    Escolha entre horários fixos já configurados pelo salão.
                  </p>

                  <div className="space-y-2 mb-6 text-left">
                    <div className="flex items-center gap-2 text-accent">
                      <div className="w-2 h-2 bg-accent rounded-full"></div>
                      <span className="text-sm">Horários fixos garantidos</span>
                    </div>
                  </div>

                  <GradientButton variant="accent" className="w-full">
                    Escolher Slots
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </GradientButton>
                </div>
              </GlassCard>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-foreground-muted">
                💡 Dica: Ambas as opções são seguras e garantem seu horário
              </p>
            </div>
          </div>
        </GridBackground>
      </div>
    );
  }

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
