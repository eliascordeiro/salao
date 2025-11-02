"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Calendar, Clock, AlertCircle } from "lucide-react";

interface Availability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string | null;
  type: string;
}

interface Staff {
  id: string;
  name: string;
}

export default function DisponibilidadePage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  
  const [formData, setFormData] = useState({
    date: "",
    startTime: "09:00",
    endTime: "18:00",
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados do profissional
  useEffect(() => {
    fetchStaff();
    fetchAvailabilities();
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

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch(`/api/availabilities?staffId=${params.id}`);
      if (!response.ok) throw new Error("Erro ao carregar bloqueios");
      
      const data = await response.json();
      setAvailabilities(data);
    } catch (error) {
      console.error("Erro ao carregar bloqueios:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = "Selecione uma data";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Informe o horário de início";
    }

    if (!formData.endTime) {
      newErrors.endTime = "Informe o horário de término";
    }

    // Validar que endTime > startTime
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

    // Enviar dados
    setLoading(true);
    try {
      const response = await fetch("/api/availabilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId: params.id,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          available: false, // Bloqueio
          reason: formData.reason || null,
          type: "BLOCK",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar bloqueio");
      }

      alert("Bloqueio criado com sucesso!");
      
      // Limpar formulário
      setFormData({
        date: "",
        startTime: "09:00",
        endTime: "18:00",
        reason: "",
      });

      // Recarregar lista
      fetchAvailabilities();
    } catch (error) {
      console.error("Erro ao criar bloqueio:", error);
      alert(
        error instanceof Error ? error.message : "Erro ao criar bloqueio"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover este bloqueio?")) return;

    try {
      const response = await fetch(`/api/availabilities/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar bloqueio");
      }

      alert("Bloqueio removido com sucesso!");
      fetchAvailabilities();
    } catch (error) {
      console.error("Erro ao deletar bloqueio:", error);
      alert("Erro ao deletar bloqueio");
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
            Gerenciar Disponibilidade
          </h1>
          <p className="mt-2 text-gray-600">
            Profissional: <span className="font-semibold">{staff?.name}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Bloqueie horários específicos onde o profissional não poderá atender
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Criar Bloqueio de Horário
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="date">
                    Data <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className={errors.date ? "border-red-500" : ""}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500 mt-1">{errors.date}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">
                      Horário Inicial <span className="text-red-500">*</span>
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
                      Horário Final <span className="text-red-500">*</span>
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

                <div>
                  <Label htmlFor="reason">Motivo (Opcional)</Label>
                  <Input
                    id="reason"
                    type="text"
                    placeholder="Ex: Reunião, Compromisso pessoal"
                    value={formData.reason}
                    onChange={(e) =>
                      setFormData({ ...formData, reason: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Criar Bloqueio
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Bloqueios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Bloqueios Cadastrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availabilities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nenhum bloqueio cadastrado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availabilities.map((availability) => (
                    <div
                      key={availability.id}
                      className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <Calendar className="h-4 w-4 text-red-600" />
                          {new Date(availability.date).toLocaleDateString("pt-BR")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Clock className="h-4 w-4 text-red-600" />
                          {availability.startTime} - {availability.endTime}
                        </div>
                        {availability.reason && (
                          <p className="text-xs text-gray-500 mt-1">
                            {availability.reason}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(availability.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
