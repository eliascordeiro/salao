"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, Package, Save } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
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
  active: boolean;
  isActive?: boolean; // Para compatibilidade
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
        if (salonsRes.ok) {
          const salonsData = await salonsRes.json();
          if (Array.isArray(salonsData)) {
            setSalons(salonsData);
          } else {
            console.error("Resposta inválida da API de salões:", salonsData);
            setSalons([]);
          }
        } else {
          console.error("Erro ao carregar salões:", salonsRes.status);
          setSalons([]);
        }

        // Buscar profissionais do salão
        const staffRes = await fetch(`/api/staff?salonId=${service.salonId}`);
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          if (Array.isArray(staffData)) {
            setAllStaff(staffData);
          } else {
            console.error("Resposta inválida da API de profissionais:", staffData);
            setAllStaff([]);
          }
        } else {
          console.error("Erro ao carregar profissionais:", staffRes.status);
          setAllStaff([]);
        }

        // Preencher formulário com dados existentes
        setFormData({
          name: service.name || "",
          description: service.description || "",
          duration: service.duration?.toString() || "",
          price: service.price?.toString() || "",
          category: service.category || "",
          salonId: service.salonId || "",
          isActive: service.active ?? true,
          staffIds: service.staff?.map((s) => s.id) || [],
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
          description: formData.description,
          duration: parseInt(formData.duration),
          price: parseFloat(formData.price),
          category: formData.category,
          salonId: formData.salonId,
          active: formData.isActive,
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
      <div className="min-h-screen bg-background">
        <DashboardHeader user={session?.user || { name: "", email: "", role: "CLIENT" }} />
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
            <Link href="/dashboard/servicos">
              <GradientButton variant="primary" className="mb-4 px-4 py-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar para Serviços
              </GradientButton>
            </Link>
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Editar Serviço
            </h1>
            <p className="text-foreground-muted mt-2">
              Atualize as informações do serviço
            </p>
          </div>

          {/* Formulário */}
          <GlassCard glow="accent" className="max-w-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Package className="h-6 w-6 text-accent" />
                Informações do Serviço
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Nome do Serviço <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Corte de Cabelo Masculino"
                  className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${errors.name ? "border-destructive" : ""}`}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <Label htmlFor="description" className="text-foreground">Descrição</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva o serviço..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg glass-card bg-background-alt/50 border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Duração e Preço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-foreground">
                    Duração (minutos) <span className="text-destructive">*</span>
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
                    className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${errors.duration ? "border-destructive" : ""}`}
                  />
                  {errors.duration && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price" className="text-foreground">
                    Preço (R$) <span className="text-destructive">*</span>
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
                    className={`glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground ${errors.price ? "border-destructive" : ""}`}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive mt-1">{errors.price}</p>
                  )}
                </div>
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category" className="text-foreground">Categoria</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Ex: Cabelo, Barba, Tratamentos"
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary text-foreground"
                />
              </div>

              {/* Salão */}
              <div>
                <Label htmlFor="salonId" className="text-foreground">
                  Salão <span className="text-destructive">*</span>
                </Label>
                <select
                  id="salonId"
                  value={formData.salonId}
                  onChange={(e) =>
                    setFormData({ ...formData, salonId: e.target.value })
                  }
                  className={`w-full px-3 py-2 rounded-lg glass-card bg-background-alt/50 border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    errors.salonId ? "border-destructive" : ""
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
                  <p className="text-sm text-destructive mt-1">{errors.salonId}</p>
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
                  className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer text-foreground">
                  Serviço ativo (visível para clientes)
                </Label>
              </div>

              {/* Profissionais */}
              <div>
                <Label className="text-foreground">Profissionais que prestam este serviço</Label>
                <p className="text-sm text-foreground-muted mb-2">
                  Selecione os profissionais que podem executar este serviço
                </p>
                {allStaff.length === 0 ? (
                  <p className="text-sm text-foreground-muted italic">
                    Nenhum profissional encontrado para este salão
                  </p>
                ) : (
                  <div className="glass-card border-primary/20 rounded-lg p-4 space-y-2 max-h-48 overflow-y-auto">
                    {allStaff.map((staff) => (
                      <div key={staff.id} className="flex items-center hover:bg-primary/10 p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          id={`staff-${staff.id}`}
                          checked={formData.staffIds.includes(staff.id)}
                          onChange={() => handleStaffToggle(staff.id)}
                          className="h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                        />
                        <label
                          htmlFor={`staff-${staff.id}`}
                          className="ml-2 text-sm cursor-pointer text-foreground"
                        >
                          {staff.name}
                          {staff.specialty && (
                            <span className="text-foreground-muted ml-1">
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
              <div className="flex gap-3 pt-6">
                <GradientButton
                  type="button"
                  variant="primary"
                  onClick={() => router.push("/dashboard/servicos")}
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
        </main>
      </GridBackground>
    </div>
  );
}
