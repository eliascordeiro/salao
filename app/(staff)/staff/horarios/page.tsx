"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Calendar, Save, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS_OF_WEEK = [
  { key: "sunday", label: "Domingo" },
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staffData, setStaffData] = useState<StaffData | null>(null);

  const [formData, setFormData] = useState({
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

      // Preencher formulário com dados existentes
      setFormData({
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

  const toggleWorkDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter((d) => d !== day)
        : [...prev.workDays, day],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validações
    if (formData.workDays.length === 0) {
      setError("Selecione pelo menos um dia de trabalho");
      return;
    }

    if (!formData.workStart || !formData.workEnd) {
      setError("Horário de início e término são obrigatórios");
      return;
    }

    if (formData.workStart >= formData.workEnd) {
      setError("Horário de término deve ser posterior ao de início");
      return;
    }

    if (formData.hasLunch) {
      if (!formData.lunchStart || !formData.lunchEnd) {
        setError("Preencha o horário de almoço completo ou desmarque a opção");
        return;
      }

      if (formData.lunchStart >= formData.lunchEnd) {
        setError("Horário de término do almoço deve ser posterior ao de início");
        return;
      }

      if (
        formData.lunchStart < formData.workStart ||
        formData.lunchEnd > formData.workEnd
      ) {
        setError("Horário de almoço deve estar dentro do expediente");
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch("/api/staff/schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDays: formData.workDays,
          workStart: formData.workStart,
          workEnd: formData.workEnd,
          lunchStart: formData.hasLunch ? formData.lunchStart : null,
          lunchEnd: formData.hasLunch ? formData.lunchEnd : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar horários");
      }

      setSuccess("Horários atualizados com sucesso!");
      fetchStaffData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Clock className="h-8 w-8 text-primary" />
          Meus Horários
        </h1>
        <p className="text-foreground-muted">
          Configure seus dias e horários de trabalho
        </p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dias de Trabalho */}
        <GlassCard hover>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Dias de Trabalho
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleWorkDay(day.key)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.workDays.includes(day.key)
                    ? "bg-primary/20 border-primary text-primary font-semibold"
                    : "bg-background-alt/30 border-border hover:border-primary/50"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Horários de Expediente */}
        <GlassCard hover>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horário de Expediente
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="workStart">Início do Expediente</Label>
              <Input
                id="workStart"
                type="time"
                value={formData.workStart}
                onChange={(e) =>
                  setFormData({ ...formData, workStart: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="workEnd">Término do Expediente</Label>
              <Input
                id="workEnd"
                type="time"
                value={formData.workEnd}
                onChange={(e) =>
                  setFormData({ ...formData, workEnd: e.target.value })
                }
                required
              />
            </div>
          </div>
        </GlassCard>

        {/* Horário de Almoço */}
        <GlassCard hover>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Horário de Almoço
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasLunch}
                onChange={(e) =>
                  setFormData({ ...formData, hasLunch: e.target.checked })
                }
                className="w-4 h-4 rounded border-primary text-primary focus:ring-primary"
              />
              <span className="text-sm text-muted-foreground">
                Tenho intervalo de almoço
              </span>
            </label>
          </div>

          {formData.hasLunch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lunchStart">Início do Almoço</Label>
                <Input
                  id="lunchStart"
                  type="time"
                  value={formData.lunchStart}
                  onChange={(e) =>
                    setFormData({ ...formData, lunchStart: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="lunchEnd">Término do Almoço</Label>
                <Input
                  id="lunchEnd"
                  type="time"
                  value={formData.lunchEnd}
                  onChange={(e) =>
                    setFormData({ ...formData, lunchEnd: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Resumo */}
        {formData.workDays.length > 0 && formData.workStart && formData.workEnd && (
          <GlassCard hover glow="primary">
            <h3 className="text-lg font-semibold mb-3">Resumo</h3>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Dias de trabalho:</strong>{" "}
                {formData.workDays
                  .map((d) => DAYS_OF_WEEK.find((day) => day.key === d)?.label)
                  .join(", ")}
              </p>
              <p>
                <strong>Expediente:</strong> {formData.workStart} às{" "}
                {formData.workEnd}
              </p>
              {formData.hasLunch && formData.lunchStart && formData.lunchEnd && (
                <p>
                  <strong>Almoço:</strong> {formData.lunchStart} às{" "}
                  {formData.lunchEnd}
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Botão Salvar */}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? (
            "Salvando..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Horários
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

