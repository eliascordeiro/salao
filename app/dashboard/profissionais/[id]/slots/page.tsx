"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Calendar, Clock, CheckCircle2 } from "lucide-react";

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
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          user={session?.user || { name: "", email: "", role: "CLIENT" }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        user={session?.user || { name: "", email: "", role: "CLIENT" }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/profissionais")}
            className="mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">
            Cadastrar Horários Disponíveis
          </h1>
          <p className="mt-2 text-gray-600">
            Profissional: <span className="font-semibold">{staff?.name}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Adicione os horários que ficarão disponíveis para agendamento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Selecione o Dia da Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="dayOfWeek">
                  Dia da Semana <span className="text-red-500">*</span>
                </Label>
                <select
                  id="dayOfWeek"
                  value={formData.dayOfWeek}
                  onChange={(e) =>
                    setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {DAY_NAMES.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-500 mt-2">
                  Os horários se repetirão toda semana neste dia
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Adicionar Horários
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">
                      Hora Inicial <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className={errors.startTime ? "border-red-500" : ""}
                    />
                    {errors.startTime && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.startTime}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="endTime">
                      Hora Final <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className={errors.endTime ? "border-red-500" : ""}
                    />
                    {errors.endTime && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.endTime}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleAddToList}
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar à Lista
                </Button>

                {/* Lista Temporária */}
                {tempSlots.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label>Horários para Salvar ({tempSlots.length})</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {tempSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                        >
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                            <Clock className="h-4 w-4 text-green-600" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFromList(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Button
                      onClick={handleSaveAll}
                      className="w-full mt-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Salvar Todos ({tempSlots.length})
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Horários Cadastrados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Horários Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {slots.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum horário cadastrado</p>
                  <p className="text-xs mt-2">
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
                        <div key={dayOfWeek} className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-gray-900">{dayName}</span>
                            <span className="text-xs text-gray-500">
                              ({daySlots.length} horário{daySlots.length > 1 ? "s" : ""})
                            </span>
                          </div>
                          <div className="space-y-2">
                            {daySlots
                              .sort((a, b) => a.startTime.localeCompare(b.startTime))
                              .map((slot) => (
                                <div
                                  key={slot.id}
                                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded"
                                >
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-green-600" />
                                    {slot.startTime} - {slot.endTime}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(slot.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })
                    .filter(Boolean)} {/* Remove possíveis null */}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
