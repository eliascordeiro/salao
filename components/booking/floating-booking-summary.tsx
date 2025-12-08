"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronUp,
  ChevronDown,
  Calendar,
  Clock,
  DollarSign,
  User,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FloatingBookingSummaryProps {
  serviceName?: string;
  servicePrice?: number;
  serviceDuration?: number;
  staffName?: string;
  date?: Date | null;
  time?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  showContinueButton?: boolean;
}

export function FloatingBookingSummary({
  serviceName,
  servicePrice,
  serviceDuration,
  staffName,
  date,
  time,
  onContinue,
  continueLabel = "Continuar",
  continueDisabled = false,
  showContinueButton = true,
}: FloatingBookingSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevenir hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Não mostrar se não há nada selecionado
  const hasContent = serviceName || staffName || date || time;
  if (!hasContent) return null;

  // Calcular total de itens selecionados
  const selectedCount = [serviceName, staffName, date && time].filter(Boolean).length;

  return (
    <>
      {/* Backdrop quando expandido (mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Bottom Sheet - APENAS MOBILE */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out md:hidden",
          isExpanded ? "translate-y-0" : "translate-y-[calc(100%-80px)]"
        )}
      >
        <div className="container mx-auto px-4 pb-safe">
          <GlassCard className="overflow-hidden shadow-2xl border-primary/30">
            {/* Header - Sempre visível (MOBILE APENAS) */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-background-alt/50 transition-colors min-h-[80px] active:scale-[0.98] touch-manipulation"
              aria-label={isExpanded ? "Recolher resumo" : "Expandir resumo"}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Resumo do Agendamento</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount} {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-muted-foreground transition-transform animate-bounce" />
                )}
              </div>
            </button>

            {/* Content - Collapsible (MOBILE APENAS) */}
            <div
              className={cn(
                "px-4 pb-4 space-y-3 transition-all duration-300 border-t border-border/30",
                isExpanded ? "block pt-4" : "hidden"
              )}
            >
              {/* Serviço */}
              {serviceName && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="h-9 w-9 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Serviço</p>
                    <p className="font-semibold text-sm truncate text-foreground">{serviceName}</p>
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {serviceDuration && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          <Clock className="h-3 w-3 mr-1" />
                          {serviceDuration} min
                        </Badge>
                      )}
                      {servicePrice && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
                          <DollarSign className="h-3 w-3 mr-1" />
                          R$ {servicePrice.toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Profissional */}
              {staffName && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Profissional</p>
                    <p className="font-semibold text-sm truncate text-foreground">{staffName}</p>
                  </div>
                </div>
              )}

              {/* Data e Horário */}
              {(date || time) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                  <div className="h-9 w-9 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">Data e Horário</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {date && (
                        <p className="font-semibold text-sm text-foreground">
                          {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      )}
                      {time && (
                        <Badge variant="secondary" className="text-xs px-2 py-0.5 font-semibold">
                          <Clock className="h-3 w-3 mr-1" />
                          {time}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Valor Total */}
              {servicePrice && (
                <div className="pt-3 mt-3 border-t border-border/50">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                    <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Valor Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {servicePrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Continuar */}
            {showContinueButton && onContinue && (
              <div className="px-4 pb-4 pt-2">
                <Button
                  size="lg"
                  onClick={onContinue}
                  disabled={continueDisabled}
                  className="w-full min-h-[56px] text-base font-semibold shadow-lg hover:shadow-xl transition-all bg-gradient-primary hover:opacity-90"
                >
                  <span className="flex items-center justify-center gap-2">
                    {continueLabel}
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Spacer para não sobrepor conteúdo (apenas mobile) */}
      <div className="h-24" />
    </>
  );
}
