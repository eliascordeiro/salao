"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Plus, Trash2, Calendar, Clock, CheckCircle2, ArrowLeft, Save } from "lucide-react";

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface Staff {
  id: string;
  name: string;
}

const DAY_NAMES = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" }
];

export default function HorariosDisponiveisPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  
  // Estado para adicionar múltiplos horários
  const [formData, setFormData] = useState({
    dayOfWeek: 1, // Segunda-feira por padrão
    startTime: "",
    endTime: "",
  });

  const [tempSlots, setTempSlots] = useState<Array<{
    startTime: string;
    endTime: string;
  }>>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStaff();
    fetchSlots();
  }, [params.id]);

  const fetchStaff = async () => {
    try {
      const response = await fetch(`/api/staff/${params.id}`);
      if (!response.ok) throw new Error("Profissional não encontrado");
      
      const data = await response.json();
      setStaff(data);
    } catch (error) {
      console.error("Erro ao carregar profissional:", error);
      alert("Erro ao carregar profissional");
      router.push("/dashboard/profissionais");
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await fetch(`/api/availabilities?staffId=${params.id}&type=RECURRING`);
      if (!response.ok) throw new Error("Erro ao carregar horários");
      
      const data = await response.json();
      // Filtrar apenas slots recorrentes disponíveis com dayOfWeek válido
      const availableSlots = data.filter((s: any) => 
        s.available === true && 
        s.type === "RECURRING" && 
        s.dayOfWeek !== null && 
        s.dayOfWeek !== undefined
      );
      setSlots(availableSlots);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
    }
  };

  const handleAddToList = () => {
    setErrors({});
    
    const newErrors: Record<string, string> = {};

    if (!formData.startTime) {
      newErrors.startTime = "Informe o horário de início";
    }

    if (!formData.endTime) {
      newErrors.endTime = "Informe o horário de término";
    }

    if (formData.startTime && formData.endTime) {
      const [startHour, startMin] = formData.startTime.split(":").map(Number);
      const [endHour, endMin] = formData.endTime.split(":").map(Number);

      if (endHour * 60 + endMin <= startHour * 60 + startMin) {
        newErrors.endTime = "O horário de término deve ser após o início";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Adicionar à lista temporária
    setTempSlots([
      ...tempSlots,
      {
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
    ]);

    // Limpar campos
    setFormData({
      ...formData,
      startTime: "",
      endTime: "",
    });
  };

  const handleRemoveFromList = (index: number) => {
    setTempSlots(tempSlots.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (tempSlots.length === 0) {
      alert("Adicione pelo menos um horário à lista!");
      return;
    }

    setLoading(true);
    
    try {
      // Salvar todos os slots
      const promises = tempSlots.map(slot =>
        fetch("/api/availabilities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staffId: params.id,
            dayOfWeek: formData.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            available: true, // Horário disponível
            type: "RECURRING", // Recorrente semanal
          }),
        })
      );

      const results = await Promise.all(promises);
      
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`${failed.length} horário(s) falharam ao salvar`);
      }

      const dayName = DAY_NAMES[formData.dayOfWeek].label;
      alert(`${tempSlots.length} horário(s) salvos para ${dayName}!`);
      
      // Limpar lista temporária
      setTempSlots([]);
      
      // Recarregar lista
      fetchSlots();
    } catch (error) {
      console.error("Erro ao salvar horários:", error);
      alert(error instanceof Error ? error.message : "Erro ao salvar horários");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este horário?")) return;

    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar horário");
      }

      alert("Horário removido com sucesso!");
      fetchSlots();
    } catch (error) {
      console.error("Erro ao deletar horário:", error);
      alert("Erro ao deletar horário");
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
      <DashboardHeader
        user={session?.user || { name: "", email: "", role: "CLIENT" }}
      />

      <GridBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <GradientButton
              variant="primary"
              onClick={() => router.push("/dashboard/profissionais")}
              className="mb-4 px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </GradientButton>
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Clock className="h-8 w-8 text-success" />
              Horários Disponíveis
            </h1>
            <p className="text-foreground-muted">
              Profissional: <span className="font-semibold text-success">{staff?.name}</span>
            </p>
            <p className="text-sm text-foreground-muted mt-1">
              Cadastre os horários que ficarão disponíveis para agendamento
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            <GlassCard glow="primary" className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Selecione o Dia da Semana
                </h3>
              </div>
              <div className="space-y-3">
                <Label htmlFor="dayOfWeek" className="text-foreground">
                  Dia da Semana <span className="text-destructive">*</span>
                </Label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 glass-card bg-background-alt/50 border-primary/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                >
                  {DAY_NAMES.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-foreground-muted">
                  Os horários se repetirão toda semana neste dia
                </p>
              </div>
            </GlassCard>

            <GlassCard glow="success" className="p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Clock className="h-5 w-5 text-success" />
                  Adicionar Horários
                </h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-foreground">
                      Hora Inicial <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                        errors.startTime ? "border-destructive" : ""
                      }`}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endTime" className="text-foreground">
                      Hora Final <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${
                        errors.endTime ? "border-destructive" : ""
                      }`}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <GradientButton
                  type="button"
                  onClick={handleAddToList}
                  variant="primary"
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar à Lista
                </GradientButton>

                {/* Lista Temporária */}
                {tempSlots.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-foreground font-semibold">
                      Horários para Salvar ({tempSlots.length})
                    </Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tempSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 glass-card bg-success/10 border-success/30 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Clock className="h-4 w-4 text-success" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <button
                            onClick={() => handleRemoveFromList(index)}
                            className="text-destructive hover:text-destructive/80 transition p-2 hover:bg-destructive/10 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <GradientButton
                      onClick={handleSaveAll}
                      variant="success"
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Sparkles className="h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Salvar Todos ({tempSlots.length})
                        </>
                      )}
                    </GradientButton>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Lista de Horários Cadastrados */}
          <GlassCard glow="accent" className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Horários Cadastrados
              </h3>
            </div>
            <div>
              {slots.length === 0 ? (
                <div className="text-center py-12 text-foreground-muted">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-foreground-muted/50" />
                  <p className="text-lg font-medium">Nenhum horário cadastrado</p>
                  <p className="text-sm mt-2">
                    Adicione horários para ficarem disponíveis aos clientes
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Agrupar por dia da semana */}
                  {Object.entries(
                    slots.reduce((acc, slot) => {
                      const dayOfWeek = slot.dayOfWeek;
                      // Ignorar slots sem dayOfWeek válido
                      if (dayOfWeek === null || dayOfWeek === undefined) return acc;
                      if (!acc[dayOfWeek]) acc[dayOfWeek] = [];
                      acc[dayOfWeek].push(slot);
                      return acc;
                    }, {} as Record<number, TimeSlot[]>)
                  )
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([dayOfWeek, daySlots]) => {
                      const dayNum = Number(dayOfWeek);
                      // Validação extra: se dayNum inválido, pular
                      if (dayNum < 0 || dayNum > 6 || !DAY_NAMES[dayNum]) {
                        return null;
                      }
                      const dayName = DAY_NAMES[dayNum].label;
                      return (
                        <div key={dayOfWeek} className="glass-card border-primary/20 rounded-lg p-4 bg-background-alt/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">{dayName}</span>
                            <span className="text-xs text-foreground-muted">
                              ({daySlots.length} horário{daySlots.length > 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between p-3 glass-card bg-success/10 border-success/30 rounded-lg"
                                >
                                  <div className="flex items-center gap-2 text-sm text-foreground">
                                    <Clock className="h-4 w-4 text-success" />
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <button
                                    onClick={() => handleDelete(slot.id)}
                                    className="text-destructive hover:text-destructive/80 transition p-2 hover:bg-destructive/10 rounded-lg"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)} {/* Remove possíveis null */}
                </div>
              )}
            </div>
          </GlassCard>
          </div>
        </div>
      </GridBackground>
    </div>
  );
}
