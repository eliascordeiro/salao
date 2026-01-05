"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Calendar, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = [
  { key: "0", value: "0", label: "Domingo" },
  { key: "1", value: "1", label: "Segunda-feira" },
  { key: "2", value: "2", label: "Terça-feira" },
  { key: "3", value: "3", label: "Quarta-feira" },
  { key: "4", value: "4", label: "Quinta-feira" },
  { key: "5", value: "5", label: "Sexta-feira" },
  { key: "6", value: "6", label: "Sábado" },
];

interface StaffData {
  id: string;
  name: string;
  workDays: string[];
  workStart: string | null;
  workEnd: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
}

export default function StaffHorariosPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [staffData, setStaffData] = useState<StaffData | null>(null);

  const [displayData, setDisplayData] = useState({
    workDays: [] as string[],
    workStart: "",
    workEnd: "",
    lunchStart: "",
    lunchEnd: "",
    hasLunch: false,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchStaffData();
    }
  }, [status]);

  const fetchStaffData = async () => {
    try {
      const response = await fetch("/api/staff/profile");
      if (!response.ok) throw new Error("Erro ao carregar dados");

      const data = await response.json();
      setStaffData(data);

      // Preencher apenas para exibição (somente leitura)
      setDisplayData({
        workDays: data.workDays || [],
        workStart: data.workStart || "",
        workEnd: data.workEnd || "",
        lunchStart: data.lunchStart || "",
        lunchEnd: data.lunchEnd || "",
        hasLunch: !!(data.lunchStart && data.lunchEnd),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (dayKey: string) => {
    const day = DAYS_OF_WEEK.find(d => d.key === dayKey);
    return day ? day.label : dayKey;
  };

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold">Meus Horários</h1>
        </div>
        <GlassCard className="p-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          Meus Horários
        </h1>
        <p className="text-sm sm:text-base text-foreground-muted">
          Configure seus dias e horários de trabalho
        </p>
      </div>

      {/* Alerta informativo */}
      <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
        <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">Apenas Visualização</p>
          <p className="text-xs text-muted-foreground">
            Seus horários são gerenciados pelo administrador do salão. Entre em contato caso precise de alterações.
          </p>
        </div>
      </div>

      {/* Alertas de erro */}
      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      <div className="space-y-4 sm:space-y-6">
        {/* Dias de Trabalho */}
        <GlassCard hover className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Dias de Trabalho
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const isActive = displayData.workDays.includes(day.key);
              return (
                <div
                  key={day.key}
                  className={`
                    p-2.5 sm:p-3 rounded-lg text-center font-medium transition-all min-h-[44px] text-sm sm:text-base flex items-center justify-center
                    ${
                      isActive
                        ? "bg-primary/20 text-primary border-2 border-primary"
                        : "bg-background-alt/30 text-muted-foreground border border-primary/10 opacity-50"
                    }
                  `}
                >
                  {day.label}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Horários de Expediente */}
        <GlassCard hover className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            Horário de Expediente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="workStart" className="text-sm sm:text-base">Início do Expediente</Label>
              <Input
                id="workStart"
                type="time"
                value={displayData.workStart}
                disabled
                className="min-h-[44px] bg-muted/50 cursor-not-allowed"
              />
            </div>
            <div>
              <Label htmlFor="workEnd" className="text-sm sm:text-base">Término do Expediente</Label>
              <Input
                id="workEnd"
                type="time"
                value={displayData.workEnd}
                disabled
                className="min-h-[44px] bg-muted/50 cursor-not-allowed"
              />
            </div>
          </div>
        </GlassCard>

        {/* Horário de Almoço */}
        <GlassCard hover className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Horário de Almoço
            </h3>
            <label className="flex items-center gap-2 cursor-not-allowed opacity-70">
              <input
                type="checkbox"
                checked={displayData.hasLunch}
                disabled
                className="w-4 h-4 sm:w-5 sm:h-5 rounded border-primary text-primary"
              />
              <span className="text-xs sm:text-sm text-muted-foreground">
                Intervalo de almoço
              </span>
            </label>
          </div>

          {displayData.hasLunch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="lunchStart" className="text-sm sm:text-base">Início do Almoço</Label>
                <Input
                  id="lunchStart"
                  type="time"
                  value={displayData.lunchStart}
                  disabled
                  className="min-h-[44px] bg-muted/50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="lunchEnd" className="text-sm sm:text-base">Término do Almoço</Label>
                <Input
                  id="lunchEnd"
                  type="time"
                  value={displayData.lunchEnd}
                  disabled
                  className="min-h-[44px] bg-muted/50 cursor-not-allowed"
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Resumo */}
        {displayData.workDays.length > 0 && displayData.workStart && displayData.workEnd && (
          <GlassCard hover glow="primary" className="p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Resumo</h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <p>
                <strong>Dias de trabalho:</strong>{" "}
                {displayData.workDays
                  .map((d) => getDayLabel(d))
                  .filter(Boolean)
                  .join(", ")}
              </p>
              <p>
                <strong>Expediente:</strong> {displayData.workStart} às{" "}
                {displayData.workEnd}
              </p>
              {displayData.hasLunch && displayData.lunchStart && displayData.lunchEnd && (
                <p>
                  <strong>Almoço:</strong> {displayData.lunchStart} às{" "}
                  {displayData.lunchEnd}
                </p>
              )}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

