"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, UserPlus, Save, Clock, Calendar, CalendarCheck, X, Plus, Trash2, Info } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";

interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  active: boolean;
  salonId: string;
  workDays?: string;
  workStart?: string;
  workEnd?: string;
  lunchStart?: string;
  lunchEnd?: string;
  slotInterval?: number;
  userId?: string;
  user?: {
    active: boolean;
  };
}

interface Block {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  recurring: boolean;
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [staffId, setStaffId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "schedule" | "permissions">("info");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    active: true,
  });

  const [permissionsData, setPermissionsData] = useState({
    loginEnabled: false,
    canConfirmBooking: false,
    canCancelBooking: false,
  });

  const [scheduleData, setScheduleData] = useState({
    workDays: [] as string[],
    workStart: "",
    workEnd: "",
    lunchStart: "",
    lunchEnd: "",
    slotInterval: 5,
    canEditSchedule: false,
    canManageBlocks: false,
  });

  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resolver params (suporte para Promise ou objeto direto)
  useEffect(() => {
    const resolveParams = async () => {
      if (params instanceof Promise) {
        const resolved = await params;
        setStaffId(resolved.id);
      } else {
        setStaffId(params.id);
      }
    };
    resolveParams();
  }, [params]);

  // Carregar dados do profissional
  useEffect(() => {
    if (!staffId) return;
    
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Buscar profissional
        const staffRes = await fetch(`/api/staff/${staffId}`);
        if (!staffRes.ok) {
          throw new Error("Profissional não encontrado");
        }
        const staff: Staff = await staffRes.json();

        // Preencher formulário
        setFormData({
          name: staff.name,
          email: staff.email,
          phone: staff.phone || "",
          specialty: staff.specialty || "",
          active: staff.active,
        });

        // Preencher permissões
        setPermissionsData({
          loginEnabled: staff.userId ? (staff.user?.active ?? false) : false,
          canConfirmBooking: (staff as any).canConfirmBooking || false,
          canCancelBooking: (staff as any).canCancelBooking || false,
        });

        // Preencher horários
        setScheduleData({
          workDays: staff.workDays ? staff.workDays.split(",") : [],
          workStart: staff.workStart || "",
          workEnd: staff.workEnd || '',
          lunchStart: staff.lunchStart || '',
          lunchEnd: staff.lunchEnd || '',
          slotInterval: staff.slotInterval || 15,
          canEditSchedule: (staff as any).canEditSchedule || false,
          canManageBlocks: (staff as any).canManageBlocks || false,
        });

        // Buscar bloqueios
        const blocksRes = await fetch(`/api/staff/${staffId}/blocks`);
        if (blocksRes.ok) {
          const blocksData = await blocksRes.json();
          setBlocks(blocksData);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar profissional. Redirecionando...");
        router.push("/dashboard/profissionais");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [staffId, router]);

  const toggleWorkDay = (day: string) => {
    setScheduleData(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
  };

  const handleScheduleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) throw new Error("Erro ao salvar horários");
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      alert("Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = async (field: 'canEditSchedule' | 'canManageBlocks' | 'canConfirmBooking' | 'canCancelBooking', value: boolean) => {
    try {
      // Determinar onde atualizar (scheduleData ou permissionsData)
      if (field === 'canConfirmBooking' || field === 'canCancelBooking') {
        setPermissionsData(prev => ({ ...prev, [field]: value }));
      } else {
        setScheduleData(prev => ({ ...prev, [field]: value }));
      }

      // Salvar no banco de dados
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar permissão");

      // Recarregar dados do profissional para garantir sincronização
      const staffRes = await fetch(`/api/staff/${staffId}`);
      if (staffRes.ok) {
        const staff: Staff = await staffRes.json();
        
        // Atualizar scheduleData com os dados completos do backend
        setScheduleData({
          workDays: staff.workDays ? staff.workDays.split(",") : [],
          workStart: staff.workStart || "",
          workEnd: staff.workEnd || '',
          lunchStart: staff.lunchStart || '',
          lunchEnd: staff.lunchEnd || '',
          slotInterval: staff.slotInterval || 15,
          canEditSchedule: (staff as any).canEditSchedule || false,
          canManageBlocks: (staff as any).canManageBlocks || false,
        });
        
        // Atualizar permissionsData
        setPermissionsData({
          loginEnabled: staff.userId ? (staff.user?.active ?? false) : false,
          canConfirmBooking: (staff as any).canConfirmBooking || false,
          canCancelBooking: (staff as any).canCancelBooking || false,
        });
      }
    } catch (error) {
      console.error("Erro ao salvar permissão:", error);
      // Reverter estado em caso de erro
      if (field === 'canConfirmBooking' || field === 'canCancelBooking') {
        setPermissionsData(prev => ({ ...prev, [field]: !value }));
      } else {
        setScheduleData(prev => ({ ...prev, [field]: !value }));
      }
      alert("Erro ao salvar permissão");
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/staff/${staffId}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blockForm),
      });

      if (!response.ok) throw new Error("Erro ao criar bloqueio");

      const newBlock = await response.json();
      setBlocks(prev => [...prev, newBlock]);
      setBlockForm({ date: "", startTime: "", endTime: "", reason: "", recurring: false });
      setShowBlockForm(false);
      alert("Bloqueio criado com sucesso!");
    } catch (error) {
      alert("Erro ao criar bloqueio");
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    if (!confirm("Deseja remover este bloqueio?")) return;

    try {
      const response = await fetch(`/api/staff/${staffId}/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar bloqueio");

      setBlocks(prev => prev.filter(b => b.id !== blockId));
      alert("Bloqueio removido!");
    } catch (error) {
      alert("Erro ao remover bloqueio");
    }
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

      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          specialty: formData.specialty || null,
          active: formData.active,
          loginEnabled: permissionsData.loginEnabled,
          // Preservar permissões existentes
          canEditSchedule: scheduleData.canEditSchedule,
          canManageBlocks: scheduleData.canManageBlocks,
          canConfirmBooking: permissionsData.canConfirmBooking,
          canCancelBooking: permissionsData.canCancelBooking,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar profissional");
      }

      router.push("/dashboard/profissionais");
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
      alert(
        error instanceof Error ? error.message : "Erro ao atualizar profissional"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData || !session) {
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
              <UserPlus className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              Editar Profissional
            </h1>
            <p className="text-sm sm:text-base text-foreground-muted mt-1 sm:mt-2">
              Atualize as informações do profissional
            </p>
          </div>

          {/* Abas de Navegação */}
          <div className="mb-6 overflow-x-auto">
            <div className="flex gap-2 p-1 glass-card bg-background-alt/30 rounded-lg inline-flex min-w-full sm:min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex-1 sm:flex-initial px-3 sm:px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "info"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Info className="h-4 w-4 inline mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Informações</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 sm:flex-initial px-3 sm:px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "schedule"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Horários</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("permissions")}
                className={`flex-1 sm:flex-initial px-3 sm:px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap min-h-[44px] ${
                  activeTab === "permissions"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-1 sm:mr-2" />
                <span className="text-sm sm:text-base">Permissões</span>
              </button>
              
            </div>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === "info" && (
            <GlassCard glow="accent" className="max-w-2xl p-4 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
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
                  onClick={() => router.push("/dashboard/profissionais")}
                  disabled={loading}
                  className="flex-1 py-3 min-h-[48px] order-2 sm:order-1"
                >
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Cancelar</span>
                </GradientButton>
                <GradientButton type="submit" variant="accent" disabled={loading} className="flex-1 py-3 min-h-[48px] order-1 sm:order-2">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin sm:mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 sm:mr-2" />
                      <span className="hidden xs:inline">Salvar Alterações</span>
                      <span className="xs:hidden">Salvar</span>
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
              {showSuccess && (
                <div className="mb-4 p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-300 text-sm sm:text-base">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Horários salvos com sucesso!</span>
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  Configuração de Horários
                </h2>
                <p className="text-foreground-muted mt-1 text-xs sm:text-sm md:text-base">
                  Configure os dias e horários de trabalho
                </p>
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
                    <Label htmlFor="lunchStart" className="text-foreground text-sm sm:text-base">Início do Almoço</Label>
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
                    <Label htmlFor="lunchEnd" className="text-foreground text-sm sm:text-base">Término do Almoço</Label>
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

                {/* Permissão de Edição */}
                <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scheduleData.canEditSchedule}
                      onChange={(e) => handlePermissionToggle('canEditSchedule', e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-primary text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <div className="flex-1">
                      <span className="text-foreground font-medium text-sm sm:text-base block mb-1">
                        Permitir que profissional edite horários
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Se marcado, o profissional poderá alterar seus próprios horários de trabalho no portal
                      </span>
                    </div>
                  </label>
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

                  {/* Permissão de Gerenciamento de Bloqueios */}
                  <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleData.canManageBlocks}
                        onChange={(e) => handlePermissionToggle('canManageBlocks', e.target.checked)}
                        className="mt-0.5 w-5 h-5 rounded border-primary text-primary focus:ring-primary focus:ring-offset-0"
                      />
                      <div className="flex-1">
                        <span className="text-foreground font-medium text-sm sm:text-base block mb-1">
                          Permitir que profissional gerencie bloqueios
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Se marcado, o profissional poderá criar e remover bloqueios de datas/horários indisponíveis pelo portal
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Botão Novo Bloqueio */}
                  {!showBlockForm && (
                    <GradientButton
                      type="button"
                      variant="accent"
                      onClick={() => setShowBlockForm(true)}
                      className="w-full py-3 min-h-[48px]"
                    >
                      <Plus className="h-4 w-4 sm:mr-2" />
                      Novo Bloqueio
                    </GradientButton>
                  )}

                  {/* Formulário de Bloqueio */}
                  {showBlockForm && (
                    <form onSubmit={handleBlockSubmit} className="p-4 sm:p-6 glass-card bg-background-alt/30 rounded-lg space-y-3 sm:space-y-4">
                      <div className="flex justify-between items-center mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-bold text-foreground">Novo Bloqueio</h3>
                        <button
                          type="button"
                          onClick={() => setShowBlockForm(false)}
                          className="text-foreground-muted hover:text-foreground p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label htmlFor="blockDate" className="text-foreground text-sm sm:text-base">Data</Label>
                          <Input
                            id="blockDate"
                            type="date"
                            value={blockForm.date}
                            onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                            required
                            className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="blockStartTime" className="text-foreground text-sm sm:text-base">Horário Início</Label>
                          <Input
                            id="blockStartTime"
                            type="time"
                            value={blockForm.startTime}
                            onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                            required
                            className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="blockEndTime" className="text-foreground text-sm sm:text-base">Horário Término</Label>
                          <Input
                            id="blockEndTime"
                            type="time"
                            value={blockForm.endTime}
                            onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                            required
                            className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                          />
                        </div>
                        <div>
                          <Label htmlFor="blockReason" className="text-foreground text-sm sm:text-base">Motivo (opcional)</Label>
                          <Input
                            id="blockReason"
                            value={blockForm.reason}
                            onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                            placeholder="Ex: Férias, Compromisso, etc"
                            className="glass-card bg-background-alt/50 border-primary/20 min-h-[44px] text-base"
                          />
                        </div>
                      </div>

                      <div className="glass-card bg-primary/5 border-primary/20 p-4 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={blockForm.recurring}
                            onChange={(e) => setBlockForm({ ...blockForm, recurring: e.target.checked })}
                            className="mt-0.5 w-5 h-5 rounded border-primary text-primary focus:ring-primary focus:ring-offset-0"
                          />
                          <div className="flex-1">
                            <span className="text-foreground font-medium text-sm sm:text-base block mb-1">
                              Bloqueio recorrente
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Este bloqueio se repetirá toda semana no mesmo dia e horário
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex gap-2 sm:gap-3">
                        <GradientButton
                          type="button"
                          variant="primary"
                          onClick={() => setShowBlockForm(false)}
                          className="flex-1 py-3 min-h-[48px]"
                        >
                          Cancelar
                        </GradientButton>
                        <GradientButton
                          type="submit"
                          variant="accent"
                          disabled={loading}
                          className="flex-1 py-3 min-h-[48px]"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                              Criando...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 sm:mr-2" />
                              Criar Bloqueio
                            </>
                          )}
                        </GradientButton>
                      </div>
                    </form>
                  )}

                  {/* Lista de Bloqueios */}
                  <div className="space-y-2">
                    <h4 className="text-sm sm:text-base font-semibold text-foreground mb-2">Bloqueios Ativos</h4>
                    {blocks.length === 0 ? (
                      <p className="text-xs sm:text-sm text-muted-foreground p-4 text-center glass-card bg-background-alt/30 rounded-lg">
                        Nenhum bloqueio cadastrado
                      </p>
                    ) : (
                      blocks.map((block) => (
                        <div key={block.id} className="flex items-center gap-3 p-3 sm:p-4 glass-card bg-background-alt/30 rounded-lg hover:bg-background-alt/50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1">
                              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent flex-shrink-0" />
                              <span className="font-medium text-foreground text-sm sm:text-base">{block.date}</span>
                              <span className="text-foreground-muted text-sm">•</span>
                              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                              <span className="text-foreground text-xs sm:text-sm">{block.startTime} - {block.endTime}</span>
                              {block.recurring && (
                                <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full whitespace-nowrap">
                                  Recorrente
                                </span>
                              )}
                            </div>
                            {block.reason && (
                              <p className="text-xs sm:text-sm text-foreground-muted sm:ml-6 truncate">{block.reason}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleBlockDelete(block.id)}
                            className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive self-end sm:self-auto min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Botão Salvar */}
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={handleScheduleSave}
                  disabled={loading}
                  className="w-full py-3 min-h-[48px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin sm:mr-2" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 sm:mr-2" />
                      Salvar Horários
                    </>
                  )}
                </GradientButton>
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
                      onClick={() => setPermissionsData(prev => ({ ...prev, loginEnabled: !prev.loginEnabled }))}
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
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Habilitar acesso ao portal para este profissional
                  </p>
                </div>

                {/* Permissão de Agendamentos - Confirmar */}
                <div className="p-4 rounded-lg glass-card bg-background-alt/30 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground text-sm sm:text-base font-medium cursor-pointer">
                      Confirmar agendamentos
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPermissionsData(prev => ({ ...prev, canConfirmBooking: !prev.canConfirmBooking }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permissionsData.canConfirmBooking ? "bg-success" : "bg-gray-400"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permissionsData.canConfirmBooking ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profissional poderá confirmar seus próprios agendamentos
                  </p>
                </div>

                {/* Permissão de Agendamentos - Cancelar */}
                <div className="p-4 rounded-lg glass-card bg-background-alt/30 border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-foreground text-sm sm:text-base font-medium cursor-pointer">
                      Cancelar agendamentos
                    </Label>
                    <button
                      type="button"
                      onClick={() => setPermissionsData(prev => ({ ...prev, canCancelBooking: !prev.canCancelBooking }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        permissionsData.canCancelBooking ? "bg-success" : "bg-gray-400"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          permissionsData.canCancelBooking ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profissional poderá cancelar seus próprios agendamentos
                  </p>
                </div>
              </div>
            </GlassCard>
          )}
        </main>
      </GridBackground>
    </div>
  );
}
