"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, UserPlus, Save, Clock, Calendar, CalendarCheck, X, Plus, Info } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";

export default function NewStaffPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "schedule" | "permissions">("info");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    active: true,
  });

  const [scheduleData, setScheduleData] = useState({
    workDays: [] as string[],
    workStart: "09:00",
    workEnd: "18:00",
    lunchStart: "12:00",
    lunchEnd: "13:00",
    slotInterval: 15,
    canEditSchedule: false,
    canManageBlocks: false,
  });

  const [permissionsData, setPermissionsData] = useState({
    loginEnabled: true,
    canConfirmBooking: false,
    canCancelBooking: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleWorkDay = (day: string) => {
    setScheduleData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      // Criar profissional com horários
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          specialty: formData.specialty || null,
          active: formData.active,
          // Permissões
          loginEnabled: permissionsData.loginEnabled,
          canConfirmBooking: permissionsData.canConfirmBooking,
          canCancelBooking: permissionsData.canCancelBooking,
          // Incluir dados de horário
          workDays: scheduleData.workDays.join(","),
          workStart: scheduleData.workStart,
          workEnd: scheduleData.workEnd,
          lunchStart: scheduleData.lunchStart || null,
          lunchEnd: scheduleData.lunchEnd || null,
          slotInterval: scheduleData.slotInterval,
          canEditSchedule: scheduleData.canEditSchedule,
          canManageBlocks: scheduleData.canManageBlocks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar profissional");
      }

      alert("Profissional cadastrado com sucesso!");
      router.push("/dashboard/profissionais");
      router.refresh();
    } catch (error) {
      console.error("Erro ao criar profissional:", error);
      alert(error instanceof Error ? error.message : "Erro ao criar profissional");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          {/* Header */}
          <div className="mb-6 sm:mb-8 animate-fadeInUp">
            <Link href="/dashboard/profissionais">
              <GradientButton variant="primary" className="mb-4 px-3 sm:px-4 py-2 min-h-[44px] w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden xs:inline">Voltar para Profissionais</span>
                <span className="xs:hidden">Voltar</span>
              </GradientButton>
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2 md:gap-3">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              Novo Profissional
            </h1>
            <p className="text-foreground-muted mt-2 text-sm sm:text-base">
              Adicione um novo profissional à sua equipe
            </p>
          </div>

          {/* Abas de Navegação */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 p-1 glass-card bg-background-alt/30 rounded-lg inline-flex min-w-full sm:min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "info"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <UserPlus className="h-4 w-4 inline sm:mr-2" />
                <span className="hidden xs:inline ml-1 sm:ml-0">Informações</span>
                <span className="xs:hidden ml-1">Info</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "schedule"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Clock className="h-4 w-4 inline sm:mr-2" />
                <span className="hidden xs:inline ml-1 sm:ml-0">Horários</span>
                <span className="xs:hidden ml-1">Hor.</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "permissions"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Calendar className="h-4 w-4 inline sm:mr-2" />
                <span className="hidden xs:inline ml-1 sm:ml-0">Permissões</span>
                <span className="xs:hidden ml-1">Perm.</span>
              </button>
            </div>
          </div>

          {/* Aba Informações */}
          {activeTab === "info" && (
          <GlassCard glow="success" className="max-w-2xl p-4 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
                Informações do Profissional
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-foreground text-sm sm:text-base">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground min-h-[44px] text-base ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-foreground text-sm sm:text-base">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="joao@exemplo.com"
                  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground min-h-[44px] text-base ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone" className="text-foreground text-sm sm:text-base">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground min-h-[44px] text-base"
                />
              </div>

              {/* Especialidade */}
              <div>
                <Label htmlFor="specialty" className="text-foreground text-sm sm:text-base">Especialidade</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="Ex: Barbeiro, Cabeleireiro, Manicure"
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground min-h-[44px] text-base"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2 min-h-[44px]">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="h-5 w-5 sm:h-4 sm:w-4 text-primary focus:ring-primary border-primary/30 rounded flex-shrink-0"
                />
                <Label htmlFor="active" className="cursor-pointer text-foreground text-sm sm:text-base">
                  Profissional ativo (disponível para agendamentos)
                </Label>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={() => setActiveTab("schedule")}
                  disabled={loading}
                  className="flex-1 py-3 min-h-[48px] order-2 sm:order-1"
                >
                  <Clock className="h-4 w-4 sm:mr-2" />
                  <span className="hidden xs:inline">Próximo: Horários</span>
                  <span className="xs:hidden">Próximo</span>
                </GradientButton>
                <GradientButton type="submit" variant="success" disabled={loading} className="flex-1 py-3 min-h-[48px] order-1 sm:order-2">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin sm:mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 sm:mr-2" />
                      <span className="hidden xs:inline">Cadastrar Agora</span>
                      <span className="xs:hidden">Cadastrar</span>
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </GlassCard>
          )}

          {/* Aba Horários */}
          {activeTab === "schedule" && (
            <GlassCard glow="primary" className="max-w-4xl p-4 sm:p-6 md:p-8">
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                      Configuração de Horários
                    </h2>
                    <p className="text-foreground-muted mt-1 text-xs sm:text-sm md:text-base">
                      Configure os dias e horários de trabalho
                    </p>
                  </div>
                  <div className="glass-card bg-blue-500/10 border-blue-500/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg self-start sm:self-auto">
                    <div className="flex items-center gap-2 text-blue-400">
                      <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm">Opcional</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Dias de Trabalho */}
                <div>
                  <Label className="text-foreground text-sm sm:text-base font-semibold mb-2 sm:mb-3 block">Dias de Trabalho</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                    {[
                      { value: "0", label: "Dom" },
                      { value: "1", label: "Seg" },
                      { value: "2", label: "Ter" },
                      { value: "3", label: "Qua" },
                      { value: "4", label: "Qui" },
                      { value: "5", label: "Sex" },
                      { value: "6", label: "Sáb" },
                    ].map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWorkDay(day.value)}
                        className={`p-2.5 sm:p-3 rounded-lg font-medium transition-all text-sm sm:text-base min-h-[44px] ${
                          scheduleData.workDays.includes(day.value)
                            ? "bg-gradient-primary text-white shadow-lg"
                            : "glass-card bg-background-alt/30 text-foreground-muted hover:bg-background-alt/50"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horário de Trabalho */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="workStart" className="text-foreground text-sm sm:text-base">Início do Expediente</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={scheduleData.workStart}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, workStart: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workEnd" className="text-foreground text-sm sm:text-base">Término do Expediente</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={scheduleData.workEnd}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, workEnd: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                    />
                  </div>
                </div>

                {/* Horário de Almoço */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="lunchStart" className="text-foreground text-sm sm:text-base">Início do Almoço (opcional)</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={scheduleData.lunchStart}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, lunchStart: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunchEnd" className="text-foreground text-sm sm:text-base">Término do Almoço (opcional)</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={scheduleData.lunchEnd}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, lunchEnd: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                    />
                  </div>
                </div>

                {/* Intervalo de Slots */}
                <div>
                  <Label htmlFor="slotInterval" className="text-foreground text-sm sm:text-base">Intervalo entre Slots</Label>
                  <select
                    id="slotInterval"
                    value={scheduleData.slotInterval}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, slotInterval: parseInt(e.target.value) })
                    }
                    className="w-full glass-card bg-background-alt/50 border-primary/20 text-foreground px-3 py-2 rounded-lg min-h-[44px] text-base"
                  >
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>

                {/* Divisor */}
                <div className="border-t border-primary/10 my-6"></div>

                {/* Gestão de Bloqueios */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      Gestão de Bloqueios
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Configure bloqueios de horários indisponíveis
                    </p>
                  </div>

                  <div className="p-6 rounded-lg glass-card bg-background-alt/30 border border-primary/10 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-accent opacity-50" />
                    <p className="text-foreground font-medium mb-2">
                      Bloqueios disponíveis após cadastro
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Após criar o profissional, você poderá gerenciar bloqueios de horários na página de edição
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                  <GradientButton
                    type="button"
                    variant="primary"
                    onClick={() => setActiveTab("info")}
                    className="flex-1 py-3 min-h-[48px] order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                  </GradientButton>
                  <GradientButton
                    type="button"
                    variant="accent"
                    onClick={() => setActiveTab("permissions")}
                    className="flex-1 py-3 min-h-[48px] order-1 sm:order-2"
                  >
                    <span className="hidden sm:inline">Próximo</span>
                    <span className="sm:hidden">Avançar</span>
                    <ArrowLeft className="h-4 w-4 sm:ml-2 rotate-180" />
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Aba Permissões */}
          {activeTab === "permissions" && (
            <GlassCard glow="accent" className="max-w-2xl p-4 sm:p-6 md:p-8">
              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-accent" />
                  Permissões do Profissional
                </h2>
                <p className="text-foreground-muted mt-1 text-xs sm:text-sm md:text-base">
                  Configure as permissões de acesso ao portal
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Login no Portal */}
                <div className="p-4 rounded-lg glass-card bg-background-alt/30 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground text-sm sm:text-base font-medium cursor-pointer">
                      Login no Portal
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPermissionsData({ ...permissionsData, loginEnabled: !permissionsData.loginEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permissionsData.loginEnabled ? "bg-success" : "bg-gray-400"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permissionsData.loginEnabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {permissionsData.loginEnabled 
                      ? "✓ Profissional poderá acessar o portal usando 'Esqueci minha senha' para criar credenciais" 
                      : "⚠ Profissional não terá acesso ao portal"}
                  </p>
                </div>

                {/* Permissão de Edição de Horários */}
                <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.canEditSchedule}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, canEditSchedule: e.target.checked })
                      }
                      className="mt-0.5 w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-foreground font-medium text-sm sm:text-base block">
                        Editar horários
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Profissional poderá alterar seus próprios horários de trabalho
                      </span>
                    </div>
                  </label>
                </div>

                {/* Permissão de Bloqueios */}
                <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.canManageBlocks}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, canManageBlocks: e.target.checked })
                      }
                      className="mt-0.5 w-5 h-5 rounded border-primary text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-foreground font-medium text-sm sm:text-base block">
                        Gerenciar bloqueios
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Profissional poderá criar e remover bloqueios de datas/horários indisponíveis
                      </span>
                    </div>
                  </label>
                </div>

                {/* Título: Gestão de Agendamentos */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-accent" />
                    Gestão de Agendamentos
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Configure as permissões de gerenciamento de agendamentos
                  </p>
                </div>

                {/* Confirmar Agendamentos */}
                <div className="glass-card bg-success/5 border-success/20 p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionsData.canConfirmBooking}
                      onChange={(e) =>
                        setPermissionsData({ ...permissionsData, canConfirmBooking: e.target.checked })
                      }
                      className="mt-0.5 w-5 h-5 rounded border-success text-success focus:ring-success"
                    />
                    <div>
                      <span className="text-foreground font-medium text-sm sm:text-base block">
                        Confirmar agendamentos
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Profissional poderá confirmar seus próprios agendamentos
                      </span>
                    </div>
                  </label>
                </div>

                {/* Cancelar Agendamentos */}
                <div className="glass-card bg-destructive/5 border-destructive/20 p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissionsData.canCancelBooking}
                      onChange={(e) =>
                        setPermissionsData({ ...permissionsData, canCancelBooking: e.target.checked })
                      }
                      className="mt-0.5 w-5 h-5 rounded border-destructive text-destructive focus:ring-destructive"
                    />
                    <div>
                      <span className="text-foreground font-medium text-sm sm:text-base block">
                        Cancelar agendamentos
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        Profissional poderá cancelar seus próprios agendamentos
                      </span>
                    </div>
                  </label>
                </div>

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6">
                  <GradientButton
                    type="button"
                    variant="primary"
                    onClick={() => setActiveTab("schedule")}
                    className="flex-1 py-3 min-h-[48px] order-2 sm:order-1"
                  >
                    <ArrowLeft className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Voltar</span>
                  </GradientButton>
                  <GradientButton
                    type="button"
                    variant="success"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-3 min-h-[48px] order-1 sm:order-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 sm:mr-2" />
                        <span className="hidden xs:inline">Cadastrar Profissional</span>
                        <span className="xs:hidden">Cadastrar</span>
                      </>
                    )}
                  </GradientButton>
                </div>
              </div>
            </GlassCard>
          )}


        </main>
      </GridBackground>
    </div>
  );
}
