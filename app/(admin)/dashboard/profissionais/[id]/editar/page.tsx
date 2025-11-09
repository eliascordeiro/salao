"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, UserPlus, Save, Clock, Calendar, X, Plus, Trash2, Info } from "lucide-react";
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
}

interface Block {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  recurring: boolean;
}

export default function EditStaffPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "schedule" | "blocks">("info");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    active: true,
  });

  const [scheduleData, setScheduleData] = useState({
    workDays: [] as string[],
    workStart: "",
    workEnd: "",
    lunchStart: "",
    lunchEnd: "",
    slotInterval: 5,
  });

  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados do profissional
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Buscar profissional
        const staffRes = await fetch(`/api/staff/${params.id}`);
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

        // Preencher horários
        setScheduleData({
          workDays: staff.workDays ? staff.workDays.split(",") : [],
          workStart: staff.workStart || "",
          workEnd: staff.workEnd || "",
          lunchStart: staff.lunchStart || "",
          lunchEnd: staff.lunchEnd || "",
          slotInterval: staff.slotInterval || 5,
        });

        // Buscar bloqueios
        const blocksRes = await fetch(`/api/staff/${params.id}/blocks`);
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
  }, [params.id, router]);

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
      const response = await fetch(`/api/staff/${params.id}`, {
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

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/staff/${params.id}/blocks`, {
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
      const response = await fetch(`/api/staff/${params.id}/blocks/${blockId}`, {
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

      const response = await fetch(`/api/staff/${params.id}`, {
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <Link href="/dashboard/profissionais">
              <GradientButton variant="primary" className="mb-4 px-4 py-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Profissionais
              </GradientButton>
            </Link>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Editar Profissional
            </h1>
            <p className="text-foreground-muted mt-2">
            Atualize as informações do profissional
          </p>
          </div>

          {/* Abas de Navegação */}
          <div className="mb-6">
            <div className="flex gap-2 p-1 glass-card bg-background-alt/30 rounded-lg inline-flex">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "info"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Informações
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("schedule")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "schedule"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Clock className="h-4 w-4 inline mr-2" />
                Horários
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("blocks")}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === "blocks"
                    ? "bg-gradient-primary text-white shadow-lg"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Bloqueios
              </button>
            </div>
          </div>

          {/* Conteúdo das Abas */}
          {activeTab === "info" && (
            <GlassCard glow="accent" className="max-w-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-accent" />
                Informações do Profissional
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: João Silva"
                  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-foreground">
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
                  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${errors.email ? "border-destructive" : ""}`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>

              {/* Telefone */}
              <div>
                <Label htmlFor="phone" className="text-foreground">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              {/* Especialidade */}
              <div>
                <Label htmlFor="specialty" className="text-foreground">Especialidade</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) =>
                    setFormData({ ...formData, specialty: e.target.value })
                  }
                  placeholder="Ex: Barbeiro, Cabeleireiro, Manicure"
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                />
                <Label htmlFor="active" className="cursor-pointer text-foreground">
                  Profissional ativo (disponível para agendamentos)
                </Label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-6">
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={() => router.push("/dashboard/profissionais")}
                  disabled={loading}
                  className="flex-1 py-3"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Cancelar
                </GradientButton>
                <GradientButton type="submit" variant="accent" disabled={loading} className="flex-1 py-3">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </GlassCard>
          )}

          {/* Aba Horários */}
          {activeTab === "schedule" && (
            <GlassCard glow="primary" className="max-w-4xl p-8">
              {showSuccess && (
                <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-2 text-green-300">
                  <Sparkles className="h-5 w-5" />
                  <span>Horários salvos com sucesso!</span>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  Configuração de Horários
                </h2>
                <p className="text-foreground-muted mt-1">
                  Configure os dias e horários de trabalho
                </p>
              </div>

              <div className="space-y-6">
                {/* Dias de Trabalho */}
                <div>
                  <Label className="text-foreground mb-3 block">Dias de Trabalho</Label>
                  <div className="grid grid-cols-7 gap-2">
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
                        className={`p-3 rounded-lg font-medium transition-all ${
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workStart" className="text-foreground">Início do Expediente</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={scheduleData.workStart}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, workStart: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="workEnd" className="text-foreground">Término do Expediente</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={scheduleData.workEnd}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, workEnd: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20"
                    />
                  </div>
                </div>

                {/* Horário de Almoço */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart" className="text-foreground">Início do Almoço</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={scheduleData.lunchStart}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, lunchStart: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lunchEnd" className="text-foreground">Término do Almoço</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={scheduleData.lunchEnd}
                      onChange={(e) =>
                        setScheduleData({ ...scheduleData, lunchEnd: e.target.value })
                      }
                      className="glass-card bg-background-alt/50 border-primary/20"
                    />
                  </div>
                </div>

                {/* Intervalo de Slots */}
                <div>
                  <Label htmlFor="slotInterval" className="text-foreground">Intervalo entre Slots</Label>
                  <select
                    id="slotInterval"
                    value={scheduleData.slotInterval}
                    onChange={(e) =>
                      setScheduleData({ ...scheduleData, slotInterval: parseInt(e.target.value) })
                    }
                    className="w-full glass-card bg-background-alt/50 border-primary/20 text-foreground px-3 py-2 rounded-lg"
                  >
                    <option value={5}>5 minutos</option>
                    <option value={10}>10 minutos</option>
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={60}>60 minutos</option>
                  </select>
                </div>

                {/* Botão Salvar */}
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={handleScheduleSave}
                  disabled={loading}
                  className="w-full py-3"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
            </GlassCard>
          )}

          {/* Aba Bloqueios */}
          {activeTab === "blocks" && (
            <GlassCard glow="accent" className="max-w-4xl p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-accent" />
                  Gestão de Bloqueios
                </h2>
                <p className="text-foreground-muted mt-1">
                  Crie bloqueios para datas/horários indisponíveis
                </p>
              </div>

              {/* Botão Novo Bloqueio */}
              {!showBlockForm && (
                <GradientButton
                  type="button"
                  variant="accent"
                  onClick={() => setShowBlockForm(true)}
                  className="mb-6 w-full py-3"
                >
                  <Plus className="h-4 w-4" />
                  Novo Bloqueio
                </GradientButton>
              )}

              {/* Formulário de Bloqueio */}
              {showBlockForm && (
                <form onSubmit={handleBlockSubmit} className="mb-6 p-6 glass-card bg-background-alt/30 rounded-lg space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-foreground">Novo Bloqueio</h3>
                    <button
                      type="button"
                      onClick={() => setShowBlockForm(false)}
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="blockDate" className="text-foreground">Data</Label>
                      <Input
                        id="blockDate"
                        type="date"
                        value={blockForm.date}
                        onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                        required
                        className="glass-card bg-background-alt/50 border-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blockStartTime" className="text-foreground">Horário Início</Label>
                      <Input
                        id="blockStartTime"
                        type="time"
                        value={blockForm.startTime}
                        onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                        required
                        className="glass-card bg-background-alt/50 border-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blockEndTime" className="text-foreground">Horário Término</Label>
                      <Input
                        id="blockEndTime"
                        type="time"
                        value={blockForm.endTime}
                        onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                        required
                        className="glass-card bg-background-alt/50 border-primary/20"
                      />
                    </div>
                    <div>
                      <Label htmlFor="blockReason" className="text-foreground">Motivo</Label>
                      <Input
                        id="blockReason"
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                        placeholder="Reunião, compromisso..."
                        className="glass-card bg-background-alt/50 border-primary/20"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={blockForm.recurring}
                      onChange={(e) => setBlockForm({ ...blockForm, recurring: e.target.checked })}
                      className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                    />
                    <Label htmlFor="recurring" className="cursor-pointer text-foreground">
                      Repetir semanalmente
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <GradientButton type="button" variant="primary" onClick={() => setShowBlockForm(false)} className="flex-1 py-2">
                      Cancelar
                    </GradientButton>
                    <GradientButton type="submit" variant="accent" className="flex-1 py-2">
                      <Plus className="h-4 w-4" />
                      Criar Bloqueio
                    </GradientButton>
                  </div>
                </form>
              )}

              {/* Lista de Bloqueios */}
              <div className="space-y-3">
                {blocks.length === 0 ? (
                  <div className="text-center py-12 text-foreground-muted">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum bloqueio configurado</p>
                  </div>
                ) : (
                  blocks.map((block) => (
                    <div key={block.id} className="glass-card bg-background-alt/30 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-accent" />
                          <span className="font-medium text-foreground">{block.date}</span>
                          <span className="text-foreground-muted">•</span>
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="text-foreground">{block.startTime} - {block.endTime}</span>
                          {block.recurring && (
                            <span className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded-full">
                              Recorrente
                            </span>
                          )}
                        </div>
                        {block.reason && (
                          <p className="text-sm text-foreground-muted ml-6">{block.reason}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleBlockDelete(block.id)}
                        className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>
          )}
        </main>
      </GridBackground>
    </div>
  );
}
