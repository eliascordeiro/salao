"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar, Save, Plus, Trash2, AlertCircle, Check } from "lucide-react";
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

const DAYS_OF_WEEK = [
  { value: "0", label: "Dom", full: "Domingo" },
  { value: "1", label: "Seg", full: "Segunda" },
  { value: "2", label: "Ter", full: "Terça" },
  { value: "3", label: "Qua", full: "Quarta" },
  { value: "4", label: "Qui", full: "Quinta" },
  { value: "5", label: "Sex", full: "Sexta" },
  { value: "6", label: "Sáb", full: "Sábado" },
];

export default function StaffSchedulePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [savedMessage, setSavedMessage] = useState(false);

  const [formData, setFormData] = useState({
    workDays: ["1", "2", "3", "4", "5"],
    workStart: "09:00",
    workEnd: "18:00",
    lunchStart: "",
    lunchEnd: "",
    slotInterval: "5",
  });

  const [blockForm, setBlockForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBlockForm, setShowBlockForm] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/staff/${params.id}`);
      if (!response.ok) throw new Error("Profissional não encontrado");

      const data: Staff = await response.json();
      setStaff(data);

      setFormData({
        workDays: data.workDays ? data.workDays.split(",") : ["1", "2", "3", "4", "5"],
        workStart: data.workStart || "09:00",
        workEnd: data.workEnd || "18:00",
        lunchStart: data.lunchStart || "",
        lunchEnd: data.lunchEnd || "",
        slotInterval: String(data.slotInterval || 5),
      });

      await fetchBlocks();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao carregar profissional");
      router.push("/dashboard/profissionais");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchBlocks = async () => {
    try {
      const response = await fetch(`/api/staff/${params.id}/blocks`);
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error("Erro ao carregar bloqueios:", error);
    }
  };

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

    const newErrors: Record<string, string> = {};

    // Validação de dias de trabalho
    if (formData.workDays.length === 0) {
      newErrors.workDays = "⚠️ Selecione pelo menos um dia de trabalho";
      alert("Por favor, selecione pelo menos um dia da semana em que o profissional trabalha.");
    }

    // Validação de horário de início
    if (!formData.workStart) {
      newErrors.workStart = "Campo obrigatório";
    } else if (!validateTime(formData.workStart)) {
      newErrors.workStart = "Horário inválido (formato: HH:mm)";
    }

    // Validação de horário de término
    if (!formData.workEnd) {
      newErrors.workEnd = "Campo obrigatório";
    } else if (!validateTime(formData.workEnd)) {
      newErrors.workEnd = "Horário inválido (formato: HH:mm)";
    }

    if (formData.workStart && formData.workEnd && formData.workStart >= formData.workEnd) {
      newErrors.workEnd = "Horário de término deve ser após o início";
    }

    if (formData.lunchStart && !validateTime(formData.lunchStart)) {
      newErrors.lunchStart = "Horário inválido";
    }

    if (formData.lunchEnd && !validateTime(formData.lunchEnd)) {
      newErrors.lunchEnd = "Horário inválido";
    }

    if (formData.lunchStart && formData.lunchEnd) {
      if (formData.lunchStart >= formData.lunchEnd) {
        newErrors.lunchEnd = "Horário de término deve ser após o início";
      }
      if (formData.lunchStart < formData.workStart || formData.lunchEnd > formData.workEnd) {
        newErrors.lunchStart = "Horário de almoço deve estar dentro do expediente";
      }
    }

    const interval = parseInt(formData.slotInterval);
    if (isNaN(interval) || interval < 5 || interval > 60) {
      newErrors.slotInterval = "Intervalo deve ser entre 5 e 60 minutos";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      
      // Mensagem mais detalhada para o usuário
      const errorMessages = [];
      if (newErrors.workDays) errorMessages.push("- Dias da semana");
      if (newErrors.workStart) errorMessages.push("- Horário de início");
      if (newErrors.workEnd) errorMessages.push("- Horário de término");
      if (newErrors.lunchStart || newErrors.lunchEnd) errorMessages.push("- Horário de almoço");
      if (newErrors.slotInterval) errorMessages.push("- Intervalo entre slots");
      
      if (errorMessages.length > 0 && !newErrors.workDays) {
        alert(`Por favor, corrija os seguintes campos:\n\n${errorMessages.join("\n")}`);
      }
      
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(`/api/staff/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDays: formData.workDays,
          workStart: formData.workStart,
          workEnd: formData.workEnd,
          lunchStart: formData.lunchStart || null,
          lunchEnd: formData.lunchEnd || null,
          slotInterval: parseInt(formData.slotInterval),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao atualizar horários");
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao atualizar horários");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!blockForm.date) {
      newErrors.blockDate = "Data obrigatória";
    }

    if (!validateTime(blockForm.startTime)) {
      newErrors.blockStartTime = "Horário inválido";
    }

    if (!validateTime(blockForm.endTime)) {
      newErrors.blockEndTime = "Horário inválido";
    }

    if (blockForm.startTime >= blockForm.endTime) {
      newErrors.blockEndTime = "Horário de término deve ser após o início";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await fetch(`/api/staff/${params.id}/blocks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(blockForm.date + 'T00:00:00'),
          startTime: blockForm.startTime,
          endTime: blockForm.endTime,
          reason: blockForm.reason || null,
          recurring: blockForm.recurring,
        }),
      });

      if (!response.ok) throw new Error("Erro ao criar bloqueio");

      setBlockForm({
        date: "",
        startTime: "",
        endTime: "",
        reason: "",
        recurring: false,
      });
      setShowBlockForm(false);
      await fetchBlocks();
      alert("Bloqueio criado com sucesso!");
    } catch (error) {
      alert("Erro ao criar bloqueio");
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm("Deseja realmente excluir este bloqueio?")) return;

    try {
      const response = await fetch(`/api/staff/${params.id}/blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erro ao deletar bloqueio");

      await fetchBlocks();
      alert("Bloqueio removido com sucesso!");
    } catch (error) {
      alert("Erro ao remover bloqueio");
    }
  };

  if (loadingData) {
    return (
      <GridBackground>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </GridBackground>
    );
  }

  return (
    <GridBackground>
      <div className="min-h-screen">
        <DashboardHeader />
        
        <main className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/dashboard/profissionais"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para Profissionais
            </Link>
            
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm border border-primary/30">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text">Horários e Bloqueios</h1>
                <p className="text-muted-foreground">{staff?.name}</p>
              </div>
            </div>
          </div>

          {/* Mensagem de Sucesso */}
          {savedMessage && (
            <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-500 font-medium">Horários salvos com sucesso!</p>
            </div>
          )}

          {/* Alerta de Erros */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive mb-2">Por favor, corrija os seguintes campos:</p>
                  <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                    {errors.workDays && <li>{errors.workDays}</li>}
                    {errors.workStart && <li>Horário de início: {errors.workStart}</li>}
                    {errors.workEnd && <li>Horário de término: {errors.workEnd}</li>}
                    {errors.lunchStart && <li>Horário de almoço (início): {errors.lunchStart}</li>}
                    {errors.lunchEnd && <li>Horário de almoço (término): {errors.lunchEnd}</li>}
                    {errors.slotInterval && <li>Intervalo entre slots: {errors.slotInterval}</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Configuração de Horários */}
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Horários de Trabalho</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dias de Trabalho */}
                <div>
                  <Label>Dias de Trabalho *</Label>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`p-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          formData.workDays.includes(day.value)
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/50"
                            : "bg-background-alt/50 text-muted-foreground hover:bg-background-alt"
                        } ${errors.workDays ? "ring-2 ring-destructive/50" : ""}`}
                        title={day.full}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {errors.workDays && (
                    <p className="text-sm text-destructive mt-2 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      {errors.workDays}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    * Campo obrigatório - Selecione pelo menos um dia da semana
                  </p>
                </div>

                {/* Expediente */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workStart">Início do Expediente *</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={formData.workStart}
                      onChange={(e) => setFormData({ ...formData, workStart: e.target.value })}
                      className={errors.workStart ? "ring-2 ring-destructive/50" : ""}
                    />
                    {errors.workStart && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.workStart}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="workEnd">Fim do Expediente *</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={formData.workEnd}
                      onChange={(e) => setFormData({ ...formData, workEnd: e.target.value })}
                      className={errors.workEnd ? "ring-2 ring-destructive/50" : ""}
                    />
                    {errors.workEnd && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.workEnd}
                      </p>
                    )}
                  </div>
                </div>

                {/* Almoço */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart">Início do Almoço (opcional)</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={formData.lunchStart}
                      onChange={(e) => setFormData({ ...formData, lunchStart: e.target.value })}
                    />
                    {errors.lunchStart && (
                      <p className="text-xs text-destructive mt-1">{errors.lunchStart}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lunchEnd">Fim do Almoço (opcional)</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={formData.lunchEnd}
                      onChange={(e) => setFormData({ ...formData, lunchEnd: e.target.value })}
                    />
                    {errors.lunchEnd && (
                      <p className="text-xs text-destructive mt-1">{errors.lunchEnd}</p>
                    )}
                  </div>
                </div>

                {/* Intervalo entre Slots */}
                <div>
                  <Label htmlFor="slotInterval">Intervalo entre Slots (minutos)</Label>
                  <select
                    id="slotInterval"
                    value={formData.slotInterval}
                    onChange={(e) => setFormData({ ...formData, slotInterval: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all backdrop-blur-sm"
                  >
                    <option value="5">5 minutos</option>
                    <option value="10">10 minutos</option>
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">60 minutos</option>
                  </select>
                  {errors.slotInterval && (
                    <p className="text-xs text-destructive mt-1">{errors.slotInterval}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Define o espaçamento entre horários disponíveis para agendamento
                  </p>
                </div>

                <GradientButton type="submit" className="w-full" disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Salvando..." : "Salvar Horários"}
                </GradientButton>
              </form>
            </GlassCard>

            {/* Bloqueios */}
            <div className="space-y-6">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-xl font-bold">Bloqueios de Horário</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowBlockForm(!showBlockForm)}
                    className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Bloqueie horários específicos para reuniões, compromissos ou folgas
                </p>

                {/* Formulário de Novo Bloqueio */}
                {showBlockForm && (
                  <form onSubmit={handleCreateBlock} className="space-y-4 mb-6 p-4 rounded-lg bg-background-alt/30 border border-primary/10">
                    <div>
                      <Label htmlFor="blockDate">Data</Label>
                      <Input
                        id="blockDate"
                        type="date"
                        value={blockForm.date}
                        onChange={(e) => setBlockForm({ ...blockForm, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.blockDate && (
                        <p className="text-xs text-destructive mt-1">{errors.blockDate}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="blockStartTime">Início</Label>
                        <Input
                          id="blockStartTime"
                          type="time"
                          value={blockForm.startTime}
                          onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })}
                        />
                        {errors.blockStartTime && (
                          <p className="text-xs text-destructive mt-1">{errors.blockStartTime}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="blockEndTime">Fim</Label>
                        <Input
                          id="blockEndTime"
                          type="time"
                          value={blockForm.endTime}
                          onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })}
                        />
                        {errors.blockEndTime && (
                          <p className="text-xs text-destructive mt-1">{errors.blockEndTime}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="blockReason">Motivo (opcional)</Label>
                      <Input
                        id="blockReason"
                        type="text"
                        placeholder="Ex: Reunião com fornecedor"
                        value={blockForm.reason}
                        onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={blockForm.recurring}
                        onChange={(e) => setBlockForm({ ...blockForm, recurring: e.target.checked })}
                        className="w-4 h-4 rounded border-primary/20 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-muted-foreground">Repetir semanalmente</span>
                    </label>

                    <div className="flex gap-2">
                      <GradientButton type="submit" size="sm" className="flex-1">
                        Criar Bloqueio
                      </GradientButton>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBlockForm(false);
                          setBlockForm({ date: "", startTime: "", endTime: "", reason: "", recurring: false });
                        }}
                        className="px-4 py-2 rounded-lg bg-background-alt/50 hover:bg-background-alt text-sm transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Bloqueios */}
                <div className="space-y-3">
                  {blocks.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">Nenhum bloqueio cadastrado</p>
                    </div>
                  ) : (
                    blocks.map((block) => (
                      <div
                        key={block.id}
                        className="p-4 rounded-lg bg-background-alt/30 border border-primary/10 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {new Date(block.date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {block.startTime} - {block.endTime}
                            </p>
                            {block.reason && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {block.reason}
                              </p>
                            )}
                            {block.recurring && (
                              <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] bg-primary/20 text-primary">
                                Semanal
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="p-2 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Info Card */}
              <GlassCard className="p-4 bg-primary/5 border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>
                      <strong className="text-foreground">Slots Dinâmicos:</strong> Os horários disponíveis são gerados automaticamente com base na sua configuração.
                    </p>
                    <p>
                      <strong className="text-foreground">Bloqueios:</strong> Use para indisponibilizar horários específicos (reuniões, compromissos).
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>
    </GridBackground>
  );
}
