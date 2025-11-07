"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { GradientButton } from "@/components/ui/gradient-button";
import { DashboardHeader } from "@/components/dashboard/header";
import { Settings, Calendar, CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  bookingType: string;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        setLoading(false);
      }
    }
  }, [status, session, router]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
        <GridBackground>
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <GlassCard glow="primary" className="p-8">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 animate-spin text-primary" />
                <p className="text-lg">Carregando configurações...</p>
              </div>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session?.user || { name: "", email: "", role: "ADMIN" }} />
      <GridBackground>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
              <Settings className="h-10 w-10 text-primary" />
              Configurações do Salão
            </h1>
            <p className="text-foreground-muted text-lg">
              Configure como seus clientes farão agendamentos
            </p>
          </div>

        {/* Main Card */}
        <GlassCard glow="primary" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Calendar className="h-8 w-8 text-accent" />
            <h2 className="text-2xl font-semibold">Tipo de Agendamento</h2>
          </div>

          <div className="space-y-6">
            {/* Opção: Pré-definido (Slots) - ÚNICA OPÇÃO */}
            <div className="block p-6 border-2 rounded-xl border-accent bg-accent/5 shadow-lg shadow-accent/20">
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="bookingType"
                  value="SLOT_BASED"
                  checked={true}
                  disabled
                  className="mt-1 h-5 w-5 text-accent"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    <h3 className="text-xl font-semibold">Horários Pré-definidos (Slots)</h3>
                  </div>
                  <p className="text-foreground-muted mb-3">
                    Você define horários fixos disponíveis. Clientes escolhem entre os
                    slots configurados. Ideal para controle total da agenda.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Horários fixos e organizados
                    </span>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Controle total do admin
                    </span>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Geração automática de slots
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informação adicional */}
            <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">
                  <strong>Como funciona:</strong> Configure os horários disponíveis para cada
                  profissional na seção "Profissionais → Horários". Os clientes verão apenas
                  os horários que você definir como disponíveis.
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Info Card */}
        <GlassCard glow="accent" className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Configurando Horários
          </h3>
          <ul className="space-y-2 text-foreground-muted">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">1.</span>
              <span>Acesse <strong>Profissionais</strong> no menu lateral</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">2.</span>
              <span>Clique em <strong>Horários</strong> no profissional desejado</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">3.</span>
              <span>Configure os dias e horários de trabalho</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">4.</span>
              <span>Gere os slots automaticamente ou crie manualmente</span>
            </li>
          </ul>
        </GlassCard>
      </div>
      </GridBackground>
    </div>
  );
}
