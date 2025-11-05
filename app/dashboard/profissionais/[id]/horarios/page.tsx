"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Clock, Calendar, Save } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";

interface Staff {
  id: string;
  name: string;
  workDays?: string;
  workStart?: string;
  workEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
}

const DAYS_OF_WEEK = [
  { value: "0", label: "Domingo" },
  { value: "1", label: "Segunda-feira" },
  { value: "2", label: "Terça-feira" },
  { value: "3", label: "Quarta-feira" },
  { value: "4", label: "Quinta-feira" },
  { value: "5", label: "Sexta-feira" },
  { value: "6", label: "Sábado" },
];

export default function StaffSchedulePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);

  const [formData, setFormData] = useState({
    workDays: ["1", "2", "3", "4", "5"], // Segunda a Sexta por padrão
    workStart: "09:00",
    workEnd: "18:00",
    lunchStart: "",
    lunchEnd: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados do profissional
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoadingData(true);
        const response = await fetch(`/api/staff/${params.id}`);

        if (!response.ok) {
          throw new Error("Profissional não encontrado");
        }

        const data: Staff = await response.json();
        setStaff(data);

        // Preencher formulário
        setFormData({
          workDays: data.workDays ? data.workDays.split(",") : ["1", "2", "3", "4", "5"],
          workStart: data.workStart || "09:00",
          workEnd: data.workEnd || "18:00",
          lunchStart: data.lunchStart || "",
          lunchEnd: data.lunchEnd || "",
        });
      } catch (error) {
        console.error("Erro ao carregar profissional:", error);
        alert("Erro ao carregar profissional. Redirecionando...");
        router.push("/dashboard/profissionais");
      } finally {
        setLoadingData(false);
      }
    };

    fetchStaff();
  }, [params.id, router]);

  const handleDayToggle = (day: string) => {
    const newDays = formData.workDays.includes(day)
      ? formData.workDays.filter((d) => d !== day)
      : [...formData.workDays, day].sort();
    
    setFormData({ ...formData, workDays: newDays });
  };

  const validateTime = (time: string): boolean => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: Record<string, string> = {};

    if (formData.workDays.length === 0) {
      newErrors.workDays = "Selecione pelo menos um dia de trabalho";
    }

    if (!validateTime(formData.workStart)) {
      newErrors.workStart = "Horário inválido (formato: HH:mm)";
    }

    if (!validateTime(formData.workEnd)) {
      newErrors.workEnd = "Horário inválido (formato: HH:mm)";
    }

    if (formData.workStart >= formData.workEnd) {
      newErrors.workEnd = "Horário de término deve ser após o início";
    }

    if (formData.lunchStart && !validateTime(formData.lunchStart)) {
      newErrors.lunchStart = "Horário inválido (formato: HH:mm)";
    }

    if (formData.lunchEnd && !validateTime(formData.lunchEnd)) {
      newErrors.lunchEnd = "Horário inválido (formato: HH:mm)";
    }

    if (formData.lunchStart && formData.lunchEnd) {
      if (formData.lunchStart >= formData.lunchEnd) {
        newErrors.lunchEnd = "Horário de término deve ser após o início";
      }

      if (formData.lunchStart < formData.workStart || formData.lunchEnd > formData.workEnd) {
        newErrors.lunchStart = "Horário de almoço deve estar dentro do expediente";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Enviar dados
    setLoading(true);
    
    const payload = {
      workDays: formData.workDays,
      workStart: formData.workStart,
      workEnd: formData.workEnd,
      lunchStart: formData.lunchStart || null,
      lunchEnd: formData.lunchEnd || null,
    };
    
    console.log("📤 Enviando payload:", payload);
    console.log("📤 WorkDays é array?", Array.isArray(payload.workDays));
    console.log("📤 WorkDays length:", payload.workDays.length);
    
    try {
      const response = await fetch(`/api/staff/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("❌ Erro da API:", data);
        throw new Error(data.error || "Erro ao atualizar horários");
      }

      const result = await response.json();
      console.log("✅ Horários atualizados:", result);
      
      alert("Horários atualizados com sucesso!");
      router.push("/dashboard/profissionais");
    } catch (error) {
      console.error("❌ Erro ao salvar horários:", error);
      console.error("📤 Dados enviados:", {
        workDays: formData.workDays,
        workStart: formData.workStart,
        workEnd: formData.workEnd,
        lunchStart: formData.lunchStart,
        lunchEnd: formData.lunchEnd,
      });
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar horários"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!session || session.user.role !== "ADMIN") {
    router.push("/dashboard");
    return null;
  }

  if (loadingData) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          user={session?.user || { name: "", email: "", role: "CLIENT" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Sparkles className="h-12 w-12 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <Link href="/dashboard/profissionais">
              <GradientButton variant="primary" className="mb-4 px-4 py-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </GradientButton>
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Clock className="h-8 w-8 text-accent" />
              Horários de Trabalho
            </h1>
            <p className="text-foreground-muted">
              Configure os horários de <strong className="text-accent">{staff?.name}</strong>
            </p>
          </div>

          {/* Formulário */}
          <GlassCard glow="accent" className="max-w-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="h-6 w-6 text-accent" />
                Configurar Horários
              </h2>
              <p className="text-foreground-muted mt-1">
                Defina os dias e horários de trabalho
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dias de Trabalho */}
              <div>
                <Label className="flex items-center gap-2 mb-3 text-foreground">
                  <Calendar className="h-4 w-4 text-accent" />
                  Dias de Trabalho <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        formData.workDays.includes(day.value)
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-primary/20 hover:bg-background-alt/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.workDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                        className="rounded accent-primary"
                      />
                      <span className="text-sm text-foreground">{day.label}</span>
                    </label>
                  ))}
                </div>
                {errors.workDays && (
                  <p className="text-sm text-destructive mt-2">{errors.workDays}</p>
                )}
              </div>

              {/* Horário de Trabalho */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStart" className="text-foreground">
                    Início do Expediente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={formData.workStart}
                    onChange={(e) =>
                      setFormData({ ...formData, workStart: e.target.value })
                    }
                    className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                      errors.workStart ? "border-destructive" : ""
                    }`}
                  />
                  {errors.workStart && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.workStart}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workEnd" className="text-foreground">
                    Fim do Expediente <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={formData.workEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, workEnd: e.target.value })
                    }
                    className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                      errors.workEnd ? "border-destructive" : ""
                    }`}
                  />
                  {errors.workEnd && (
                    <p className="text-sm text-destructive mt-1">{errors.workEnd}</p>
                  )}
                </div>
              </div>

              {/* Horário de Almoço (Opcional) */}
              <div>
                <Label className="mb-3 block text-foreground">
                  Horário de Almoço (Opcional)
                </Label>
                <p className="text-sm text-foreground-muted mb-3">
                  Configure um intervalo de almoço onde não haverá atendimentos
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart" className="text-foreground">
                      Início do Almoço
                    </Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={formData.lunchStart}
                      onChange={(e) =>
                        setFormData({ ...formData, lunchStart: e.target.value })
                      }
                      className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                        errors.lunchStart ? "border-destructive" : ""
                      }`}
                    />
                    {errors.lunchStart && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.lunchStart}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lunchEnd" className="text-foreground">
                      Fim do Almoço
                    </Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={formData.lunchEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, lunchEnd: e.target.value })
                      }
                      className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                        errors.lunchEnd ? "border-destructive" : ""
                      }`}
                    />
                    {errors.lunchEnd && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.lunchEnd}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <div className="glass-card bg-accent/5 border-accent/20 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  Resumo da Configuração
                </h3>
                <ul className="text-sm space-y-2 text-foreground-muted">
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">Dias:</span>
                    <span>
                      {formData.workDays.length > 0
                        ? formData.workDays
                            .map(
                              (d) =>
                                DAYS_OF_WEEK.find((day) => day.value === d)
                                  ?.label
                            )
                            .join(", ")
                        : "Nenhum dia selecionado"}
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-medium text-foreground">Expediente:</span>
                    <span>{formData.workStart} às {formData.workEnd}</span>
                  </li>
                  {formData.lunchStart && formData.lunchEnd && (
                    <li className="flex gap-2">
                      <span className="font-medium text-foreground">Almoço:</span>
                      <span>{formData.lunchStart} às {formData.lunchEnd}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Botões */}
              <div className="flex gap-4">
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={() => router.push("/dashboard/profissionais")}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancelar
                </GradientButton>
                <GradientButton
                  type="submit"
                  variant="accent"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Horários
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </GridBackground>
    </div>
  );
}
