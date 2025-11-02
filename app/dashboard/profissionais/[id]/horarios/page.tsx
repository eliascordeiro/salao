"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/profissionais"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Profissionais
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Horários de Trabalho
          </h1>
          <p className="text-gray-600 mt-2">
            Configure os horários de <strong>{staff?.name}</strong>
          </p>
        </div>

        {/* Formulário */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Configurar Horários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dias de Trabalho */}
              <div>
                <Label className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4" />
                  Dias de Trabalho <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <label
                      key={day.value}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                        formData.workDays.includes(day.value)
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.workDays.includes(day.value)}
                        onChange={() => handleDayToggle(day.value)}
                        className="rounded"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
                {errors.workDays && (
                  <p className="text-sm text-red-500 mt-2">{errors.workDays}</p>
                )}
              </div>

              {/* Horário de Trabalho */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStart">
                    Início do Expediente <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={formData.workStart}
                    onChange={(e) =>
                      setFormData({ ...formData, workStart: e.target.value })
                    }
                    className={errors.workStart ? "border-red-500" : ""}
                  />
                  {errors.workStart && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.workStart}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="workEnd">
                    Fim do Expediente <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={formData.workEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, workEnd: e.target.value })
                    }
                    className={errors.workEnd ? "border-red-500" : ""}
                  />
                  {errors.workEnd && (
                    <p className="text-sm text-red-500 mt-1">{errors.workEnd}</p>
                  )}
                </div>
              </div>

              {/* Horário de Almoço (Opcional) */}
              <div>
                <Label className="mb-3 block">
                  Horário de Almoço (Opcional)
                </Label>
                <p className="text-sm text-gray-600 mb-3">
                  Configure um intervalo de almoço onde não haverá atendimentos
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lunchStart">Início do Almoço</Label>
                    <Input
                      id="lunchStart"
                      type="time"
                      value={formData.lunchStart}
                      onChange={(e) =>
                        setFormData({ ...formData, lunchStart: e.target.value })
                      }
                      className={errors.lunchStart ? "border-red-500" : ""}
                    />
                    {errors.lunchStart && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.lunchStart}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lunchEnd">Fim do Almoço</Label>
                    <Input
                      id="lunchEnd"
                      type="time"
                      value={formData.lunchEnd}
                      onChange={(e) =>
                        setFormData({ ...formData, lunchEnd: e.target.value })
                      }
                      className={errors.lunchEnd ? "border-red-500" : ""}
                    />
                    {errors.lunchEnd && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.lunchEnd}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">📋 Resumo</h3>
                  <ul className="text-sm space-y-1 text-gray-700">
                    <li>
                      <strong>Dias:</strong>{" "}
                      {formData.workDays.length > 0
                        ? formData.workDays
                            .map(
                              (d) =>
                                DAYS_OF_WEEK.find((day) => day.value === d)
                                  ?.label
                            )
                            .join(", ")
                        : "Nenhum dia selecionado"}
                    </li>
                    <li>
                      <strong>Expediente:</strong> {formData.workStart} às{" "}
                      {formData.workEnd}
                    </li>
                    {formData.lunchStart && formData.lunchEnd && (
                      <li>
                        <strong>Almoço:</strong> {formData.lunchStart} às{" "}
                        {formData.lunchEnd}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {/* Botões */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/profissionais")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Horários"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
