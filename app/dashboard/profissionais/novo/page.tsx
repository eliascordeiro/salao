"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, UserPlus, Save, Briefcase } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function NewStaffPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    active: true,
    serviceIds: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Buscar serviços disponíveis
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data.filter((s: Service) => s.id)); // Apenas serviços válidos
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
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
          serviceIds: formData.serviceIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar profissional");
      }

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
              Novo Profissional
            </h1>
            <p className="text-foreground-muted mt-2">
              Adicione um novo profissional à sua equipe
            </p>
          </div>

          {/* Formulário */}
          <GlassCard glow="success" className="max-w-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <UserPlus className="h-6 w-6 text-primary" />
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

              {/* Serviços */}
              <div>
                <Label className="text-foreground mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Serviços que este profissional presta
                </Label>
                {loadingServices ? (
                  <div className="flex items-center justify-center py-4">
                    <Sparkles className="h-5 w-5 animate-spin text-primary" />
                  </div>
                ) : services.length === 0 ? (
                  <p className="text-sm text-foreground-muted">
                    Nenhum serviço cadastrado. Cadastre serviços primeiro.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.serviceIds.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background-alt hover:border-primary/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.serviceIds.includes(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-primary/30 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{service.name}</div>
                          <div className="text-xs text-foreground-muted mt-1">
                            {service.duration} min · R$ {service.price.toFixed(2)}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
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
                <GradientButton type="submit" variant="success" disabled={loading} className="flex-1 py-3">
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Profissional
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
