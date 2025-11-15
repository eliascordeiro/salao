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

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          isExpanded ? "translate-y-0" : "translate-y-[calc(100%-80px)]",
          "md:translate-y-0 md:sticky md:bottom-4 md:left-4 md:right-4 md:mt-8"
        )}
      >
        <div className="container mx-auto px-4 pb-safe">
          <GlassCard className="overflow-hidden shadow-2xl border-primary/30">
            {/* Header - Sempre visível */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full px-4 py-4 flex items-center justify-between md:hidden"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Resumo do Agendamento</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount} {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {/* Desktop Header */}
            <div className="hidden md:block px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Resumo do Agendamento</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedCount} {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
                  </p>
                </div>
              </div>
            </div>

            {/* Content - Collapsible em mobile, sempre visível em desktop */}
            <div
              className={cn(
                "px-4 md:px-6 py-4 space-y-4 transition-all duration-300",
                isExpanded ? "block" : "hidden md:block"
              )}
            >
              {/* Serviço */}
              {serviceName && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Serviço</p>
                    <p className="font-medium text-sm truncate">{serviceName}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {serviceDuration && (
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {serviceDuration} min
                        </Badge>
                      )}
                      {servicePrice && (
                        <Badge variant="secondary" className="text-xs">
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
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Profissional</p>
                    <p className="font-medium text-sm truncate">{staffName}</p>
                  </div>
                </div>
              )}

              {/* Data e Horário */}
              {(date || time) && (
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Data e Horário</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {date && (
                        <p className="font-medium text-sm">
                          {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      )}
                      {time && (
                        <Badge variant="secondary" className="text-xs">
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
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Valor Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {servicePrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Botão Continuar */}
            {showContinueButton && onContinue && (
              <div className="px-4 md:px-6 pb-4">
                <Button
                  size="lg"
                  onClick={onContinue}
                  disabled={continueDisabled}
                  className="w-full gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  {continueLabel}
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Spacer para não sobrepor conteúdo (apenas mobile) */}
      <div className="h-24 md:hidden" />
    </>
  );
}
