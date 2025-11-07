"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { AnimatedText } from "@/components/ui/animated-text";
import { Settings, Calendar, Clock, CheckCircle2, Sparkles } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  bookingType: string;
}

export default function ConfiguracoesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [bookingType, setBookingType] = useState<string>("BOTH");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else {
        fetchSalonConfig();
      }
    }
  }, [status, session, router]);

  const fetchSalonConfig = async () => {
    try {
      const response = await fetch("/api/salon");
      if (response.ok) {
        const data = await response.json();
        setSalon(data);
        setBookingType(data.bookingType || "BOTH");
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/salon/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingType }),
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "Configurações salvas com sucesso! ✅",
        });
        fetchSalonConfig();
      } else {
        throw new Error("Erro ao salvar");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "Erro ao salvar configurações. Tente novamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <GridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <GlassCard glow="primary" className="p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 animate-spin text-primary" />
              <p className="text-lg">Carregando configurações...</p>
            </div>
          </GlassCard>
        </div>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <AnimatedText className="text-4xl font-bold mb-2">
            ⚙️ Configurações do Salão
          </AnimatedText>
          <p className="text-foreground-muted text-lg">
            Configure como seus clientes farão agendamentos
          </p>
        </div>

        {/* Main Card */}
        <GlassCard glow="primary" className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-semibold">Tipo de Agendamento</h2>
          </div>

          <div className="space-y-6">
            {/* Opção: Dinâmico */}
            <label
              className={`block p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                bookingType === "DYNAMIC"
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="bookingType"
                  value="DYNAMIC"
                  checked={bookingType === "DYNAMIC"}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="mt-1 h-5 w-5 text-primary"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold">Agendamento Dinâmico</h3>
                  </div>
                  <p className="text-foreground-muted mb-3">
                    O sistema calcula automaticamente os horários disponíveis com base
                    nos agendamentos existentes. Ideal para flexibilidade máxima.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full border border-success/20">
                      ✓ Sem configuração de slots
                    </span>
                    <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full border border-success/20">
                      ✓ Preenche lacunas automaticamente
                    </span>
                    <span className="px-3 py-1 bg-success/10 text-success text-sm rounded-full border border-success/20">
                      ✓ Valida duração do serviço
                    </span>
                  </div>
                </div>
              </div>
            </label>

            {/* Opção: Pré-definido (Slots) */}
            <label
              className={`block p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                bookingType === "SLOT_BASED"
                  ? "border-accent bg-accent/5 shadow-lg shadow-accent/20"
                  : "border-border hover:border-accent/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="bookingType"
                  value="SLOT_BASED"
                  checked={bookingType === "SLOT_BASED"}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="mt-1 h-5 w-5 text-accent"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    <h3 className="text-xl font-semibold">Horários Pré-definidos (Slots)</h3>
                  </div>
                  <p className="text-foreground-muted mb-3">
                    Você define horários fixos disponíveis. Clientes escolhem entre os
                    slots configurados. Ideal para controle total.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Horários fixos
                    </span>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Controle total do admin
                    </span>
                    <span className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full border border-accent/20">
                      ✓ Geração automática opcional
                    </span>
                  </div>
                </div>
              </div>
            </label>

            {/* Opção: Ambos */}
            <label
              className={`block p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                bookingType === "BOTH"
                  ? "border-purple-500 bg-purple-500/5 shadow-lg shadow-purple-500/20"
                  : "border-border hover:border-purple-500/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  name="bookingType"
                  value="BOTH"
                  checked={bookingType === "BOTH"}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="mt-1 h-5 w-5 text-purple-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    <h3 className="text-xl font-semibold">Ambos (Recomendado)</h3>
                  </div>
                  <p className="text-foreground-muted mb-3">
                    Cliente pode escolher entre agendamento dinâmico ou horários
                    pré-definidos. Máxima flexibilidade.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm rounded-full border border-purple-500/20">
                      ✓ Melhor dos dois mundos
                    </span>
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm rounded-full border border-purple-500/20">
                      ✓ Cliente escolhe preferência
                    </span>
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm rounded-full border border-purple-500/20">
                      ✓ Máxima flexibilidade
                    </span>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mt-6 p-4 rounded-lg border ${
                message.type === "success"
                  ? "bg-success/10 border-success/20 text-success"
                  : "bg-destructive/10 border-destructive/20 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex gap-4">
            <GradientButton
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Sparkles className="h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  Salvar Configurações
                </>
              )}
            </GradientButton>
          </div>
        </GlassCard>

        {/* Info Card */}
        <GlassCard glow="accent" className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            Como funciona?
          </h3>
          <ul className="space-y-2 text-foreground-muted">
            <li>• <strong>Dinâmico:</strong> O cliente vê apenas horários calculados em tempo real</li>
            <li>• <strong>Slots:</strong> O cliente vê apenas os horários pré-configurados</li>
            <li>• <strong>Ambos:</strong> O cliente escolhe qual método prefere usar</li>
          </ul>
        </GlassCard>
      </div>
    </GridBackground>
  );
}
