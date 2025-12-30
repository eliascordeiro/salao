"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, DollarSign, Percent, Calculator, Save, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { DashboardHeader } from "@/components/dashboard/header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CommissionType = "PERCENTAGE" | "FIXED" | "MIXED";

interface ServiceOverride {
  serviceId: string;
  commissionType: CommissionType;
  percentageValue: number | null;
  fixedValue: number | null;
  service?: {
    id: string;
    name: string;
    price: number;
  };
}

interface CommissionConfig {
  id: string;
  commissionType: CommissionType;
  percentageValue: number | null;
  fixedValue: number | null;
  serviceOverrides: ServiceOverride[];
}

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string;
}

export default function StaffCommissionPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [config, setConfig] = useState<CommissionConfig | null>(null);

  // Estado do formulário
  const [commissionType, setCommissionType] = useState<CommissionType>("PERCENTAGE");
  const [percentageValue, setPercentageValue] = useState<string>("");
  const [fixedValue, setFixedValue] = useState<string>("");
  const [serviceOverrides, setServiceOverrides] = useState<ServiceOverride[]>([]);

  useEffect(() => {
    fetchData();
  }, [staffId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar profissional
      const staffRes = await fetch(`/api/staff/${staffId}`);
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData);
      }

      // Buscar serviços do salão
      const servicesRes = await fetch("/api/services");
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData);
      }

      // Buscar configuração de comissão
      const configRes = await fetch(`/api/commissions/config?staffId=${staffId}`);
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData) {
          setConfig(configData);
          setCommissionType(configData.commissionType);
          setPercentageValue(configData.percentageValue?.toString() || "");
          setFixedValue(configData.fixedValue?.toString() || "");
          setServiceOverrides(configData.serviceOverrides || []);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const payload = {
        staffId,
        commissionType,
        percentageValue: percentageValue ? parseFloat(percentageValue) : null,
        fixedValue: fixedValue ? parseFloat(fixedValue) : null,
        serviceOverrides: serviceOverrides.map((override) => ({
          serviceId: override.serviceId,
          commissionType: override.commissionType,
          percentageValue: override.percentageValue,
          fixedValue: override.fixedValue,
        })),
      };

      const response = await fetch("/api/commissions/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Erro ao salvar configuração");
        return;
      }

      alert("Configuração de comissão salva com sucesso!");
      router.push("/dashboard/profissionais");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover a configuração de comissão?")) {
      return;
    }

    try {
      const response = await fetch(`/api/commissions/config?staffId=${staffId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar");
      }

      alert("Configuração removida com sucesso!");
      router.push("/dashboard/profissionais");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro ao remover configuração");
    }
  };

  const addServiceOverride = () => {
    if (services.length === 0) {
      alert("Nenhum serviço disponível");
      return;
    }

    const availableServices = services.filter(
      (s) => !serviceOverrides.find((o) => o.serviceId === s.id)
    );

    if (availableServices.length === 0) {
      alert("Todos os serviços já possuem configuração específica");
      return;
    }

    setServiceOverrides([
      ...serviceOverrides,
      {
        serviceId: availableServices[0].id,
        commissionType: "PERCENTAGE",
        percentageValue: null,
        fixedValue: null,
        service: availableServices[0],
      },
    ]);
  };

  const removeServiceOverride = (index: number) => {
    setServiceOverrides(serviceOverrides.filter((_, i) => i !== index));
  };

  const updateServiceOverride = (
    index: number,
    field: keyof ServiceOverride,
    value: any
  ) => {
    const updated = [...serviceOverrides];
    updated[index] = { ...updated[index], [field]: value };

    // Se mudou o serviceId, atualizar o objeto service
    if (field === "serviceId") {
      const service = services.find((s) => s.id === value);
      if (service) {
        updated[index].service = service;
      }
    }

    setServiceOverrides(updated);
  };

  const calculateExample = (
    type: CommissionType,
    percentage: number | null,
    fixed: number | null,
    servicePrice: number
  ): string => {
    switch (type) {
      case "PERCENTAGE":
        return percentage
          ? `R$ ${((servicePrice * percentage) / 100).toFixed(2)}`
          : "R$ 0,00";
      case "FIXED":
        return fixed ? `R$ ${fixed.toFixed(2)}` : "R$ 0,00";
      case "MIXED":
        const calc =
          (fixed || 0) + (percentage ? (servicePrice * percentage) / 100 : 0);
        return `R$ ${calc.toFixed(2)}`;
      default:
        return "R$ 0,00";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Profissional não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard/profissionais">
              <GradientButton variant="ghost" className="px-3">
                <ArrowLeft className="h-4 w-4" />
              </GradientButton>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Configuração de Comissão
              </h1>
              <p className="text-foreground-muted">
                {staff.name} {staff.specialty && `• ${staff.specialty}`}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Configuração Padrão */}
            <GlassCard>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Comissão Padrão
                    </h2>
                    <p className="text-sm text-foreground-muted">
                      Aplicada a todos os serviços
                    </p>
                  </div>
                </div>

                {/* Tipo de Comissão */}
                <div>
                  <Label>Tipo de Comissão</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setCommissionType("PERCENTAGE")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        commissionType === "PERCENTAGE"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Percent className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm">Percentual</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommissionType("FIXED")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        commissionType === "FIXED"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <DollarSign className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm">Valor Fixo</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommissionType("MIXED")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        commissionType === "MIXED"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Calculator className="h-5 w-5 mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm">Misto</p>
                    </button>
                  </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(commissionType === "PERCENTAGE" || commissionType === "MIXED") && (
                    <div>
                      <Label htmlFor="percentage">Percentual (%)</Label>
                      <Input
                        id="percentage"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={percentageValue}
                        onChange={(e) => setPercentageValue(e.target.value)}
                        placeholder="Ex: 40"
                      />
                    </div>
                  )}
                  {(commissionType === "FIXED" || commissionType === "MIXED") && (
                    <div>
                      <Label htmlFor="fixed">Valor Fixo (R$)</Label>
                      <Input
                        id="fixed"
                        type="number"
                        step="0.01"
                        min="0"
                        value={fixedValue}
                        onChange={(e) => setFixedValue(e.target.value)}
                        placeholder="Ex: 15.00"
                      />
                    </div>
                  )}
                </div>

                {/* Exemplo de Cálculo */}
                {(percentageValue || fixedValue) && (
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-sm text-foreground-muted mb-2">
                      Exemplo de cálculo para serviço de R$ 50,00:
                    </p>
                    <p className="text-2xl font-bold text-accent">
                      {calculateExample(
                        commissionType,
                        percentageValue ? parseFloat(percentageValue) : null,
                        fixedValue ? parseFloat(fixedValue) : null,
                        50
                      )}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Configurações Específicas por Serviço */}
            <GlassCard>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Comissões Específicas
                      </h2>
                      <p className="text-sm text-foreground-muted">
                        Sobrescrevem a configuração padrão
                      </p>
                    </div>
                  </div>
                  <GradientButton
                    type="button"
                    onClick={addServiceOverride}
                    variant="secondary"
                    className="text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </GradientButton>
                </div>

                {serviceOverrides.length === 0 ? (
                  <p className="text-sm text-foreground-muted text-center py-8">
                    Nenhuma configuração específica. A comissão padrão será aplicada a
                    todos os serviços.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {serviceOverrides.map((override, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-xl border border-border space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Label>Serviço</Label>
                          <button
                            type="button"
                            onClick={() => removeServiceOverride(index)}
                            className="text-error hover:text-error/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <select
                          value={override.serviceId}
                          onChange={(e) =>
                            updateServiceOverride(index, "serviceId", e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground"
                        >
                          {services.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} - R$ {service.price.toFixed(2)}
                            </option>
                          ))}
                        </select>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateServiceOverride(
                                index,
                                "commissionType",
                                "PERCENTAGE"
                              )
                            }
                            className={`p-2 rounded-lg border text-xs ${
                              override.commissionType === "PERCENTAGE"
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateServiceOverride(index, "commissionType", "FIXED")
                            }
                            className={`p-2 rounded-lg border text-xs ${
                              override.commissionType === "FIXED"
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            R$
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateServiceOverride(index, "commissionType", "MIXED")
                            }
                            className={`p-2 rounded-lg border text-xs ${
                              override.commissionType === "MIXED"
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            Misto
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          {(override.commissionType === "PERCENTAGE" ||
                            override.commissionType === "MIXED") && (
                            <div>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                value={override.percentageValue || ""}
                                onChange={(e) =>
                                  updateServiceOverride(
                                    index,
                                    "percentageValue",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="% (ex: 40)"
                                className="text-sm"
                              />
                            </div>
                          )}
                          {(override.commissionType === "FIXED" ||
                            override.commissionType === "MIXED") && (
                            <div>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={override.fixedValue || ""}
                                onChange={(e) =>
                                  updateServiceOverride(
                                    index,
                                    "fixedValue",
                                    e.target.value ? parseFloat(e.target.value) : null
                                  )
                                }
                                placeholder="R$ (ex: 15.00)"
                                className="text-sm"
                              />
                            </div>
                          )}
                        </div>

                        {override.service && (
                          <div className="text-xs text-foreground-muted text-center pt-2 border-t border-border">
                            Comissão:{" "}
                            {calculateExample(
                              override.commissionType,
                              override.percentageValue,
                              override.fixedValue,
                              override.service.price
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3">
              <GradientButton
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configuração"}
              </GradientButton>
              {config && (
                <GradientButton
                  onClick={handleDelete}
                  variant="ghost"
                  className="sm:w-auto border-error text-error hover:bg-error/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </GradientButton>
              )}
            </div>
          </div>
        </main>
      </GridBackground>
    </div>
  );
}
