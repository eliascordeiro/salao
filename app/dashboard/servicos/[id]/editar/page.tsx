"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/header";

interface Salon {
  id: string;
  name: string;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  isActive: boolean;
  salonId: string;
  staff: Staff[];
}

export default function EditServicePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    price: "",
    category: "",
    salonId: "",
    isActive: true,
    staffIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados do serviço, salões e profissionais
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);

        // Buscar serviço atual
        const serviceRes = await fetch(`/api/services/${params.id}`);
        if (!serviceRes.ok) {
          throw new Error("Serviço não encontrado");
        }
        const service: Service = await serviceRes.json();

        // Buscar salões
        const salonsRes = await fetch("/api/salons");
        const salonsData = await salonsRes.json();
        setSalons(salonsData);

        // Buscar profissionais do salão
        const staffRes = await fetch(`/api/staff?salonId=${service.salonId}`);
        const staffData = await staffRes.json();
        setAllStaff(staffData);

        // Preencher formulário com dados existentes
        setFormData({
          name: service.name,
          description: service.description || "",
          duration: service.duration.toString(),
          price: service.price.toString(),
          category: service.category || "",
          salonId: service.salonId,
          isActive: service.isActive,
          staffIds: service.staff.map((s) => s.id),
        });
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        alert("Erro ao carregar serviço. Redirecionando...");
        router.push("/dashboard/servicos");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  // Quando o salão muda, atualizar lista de profissionais
  useEffect(() => {
    const fetchStaff = async () => {
      if (formData.salonId) {
        try {
          const response = await fetch(`/api/staff?salonId=${formData.salonId}`);
          const data = await response.json();
          setAllStaff(data);
        } catch (error) {
          console.error("Erro ao carregar profissionais:", error);
        }
      }
    };

    fetchStaff();
  }, [formData.salonId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validações
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = "Duração deve ser maior que 0";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Preço deve ser maior que 0";
    }

    if (!formData.salonId) {
      newErrors.salonId = "Salão é obrigatório";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/services/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          category: formData.category || null,
          isActive: formData.isActive,
          salonId: formData.salonId,
          staffIds: formData.staffIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar serviço");
      }

      router.push("/dashboard/servicos");
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      alert(error instanceof Error ? error.message : "Erro ao atualizar serviço");
    } finally {
      setLoading(false);
    }
  };

  const handleStaffToggle = (staffId: string) => {
    setFormData((prev) => ({
      ...prev,
      staffIds: prev.staffIds.includes(staffId)
        ? prev.staffIds.filter((id) => id !== staffId)
        : [...prev.staffIds, staffId],
    }));
  };

  if (loadingData || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
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
            href="/dashboard/servicos"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar para Serviços
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Editar Serviço</h1>
          <p className="text-gray-600 mt-2">
            Atualize as informações do serviço
          </p>
        </div>

        {/* Formulário */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Informações do Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <Label htmlFor="name">
                  Nome do Serviço <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Corte de Cabelo Masculino"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description">Descrição</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o serviço..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Duração e Preço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">
                    Duração (minutos) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="Ex: 30"
                    className={errors.duration ? "border-red-500" : ""}
                  />
                  {errors.duration && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price">
                    Preço (R$) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Ex: 45.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Cabelo, Barba, Tratamentos"
                />
              </div>

              {/* Salão */}
              <div>
                <Label htmlFor="salonId">
                  Salão <span className="text-red-500">*</span>
                </Label>
                <select
                  id="salonId"
                  value={formData.salonId}
                  onChange={(e) =>
                    setFormData({ ...formData, salonId: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.salonId ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Selecione um salão</option>
                  {salons.map((salon) => (
                    <option key={salon.id} value={salon.id}>
                      {salon.name}
                    </option>
                  ))}
                </select>
                {errors.salonId && (
                  <p className="text-sm text-red-500 mt-1">{errors.salonId}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Serviço ativo (visível para clientes)
                </Label>
              </div>

              {/* Profissionais */}
              <div>
                <Label>Profissionais que prestam este serviço</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Selecione os profissionais que podem executar este serviço
                </p>
                {allStaff.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    Nenhum profissional encontrado para este salão
                  </p>
                ) : (
                  <div className="border border-gray-300 rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {allStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={formData.staffIds.includes(staff.id)}
                          onChange={() => handleStaffToggle(staff.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`staff-${staff.id}`}
                          className="ml-2 text-sm cursor-pointer"
                        >
                          {staff.name}
                          {staff.specialty && (
                            <span className="text-gray-500 ml-1">
                              ({staff.specialty})
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/servicos")}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
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
