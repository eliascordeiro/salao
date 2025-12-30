"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Calendar, User, Filter } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commission {
  id: string;
  servicePrice: number;
  commissionType: string;
  percentageValue: number | null;
  fixedValue: number | null;
  calculatedValue: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  staff: {
    id: string;
    name: string;
    specialty: string | null;
  };
  service: {
    id: string;
    name: string;
  };
  booking: {
    id: string;
    date: string;
    status: string;
    client: {
      name: string;
      email: string;
    };
  };
}

interface Totals {
  pending: number;
  paid: number;
  total: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-warning" },
  PAID: { label: "Pago", color: "text-success" },
  CANCELLED: { label: "Cancelado", color: "text-error" },
};

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totals, setTotals] = useState<Totals>({ pending: 0, paid: 0, total: 0 });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [staffFilter, setStaffFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Estado de pagamento
  const [paying, setPaying] = useState<string | null>(null);

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter, staffFilter, startDate, endDate]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (staffFilter !== "all") params.append("staffId", staffFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/commissions?${params.toString()}`);
      if (!response.ok) throw new Error("Erro ao buscar comissões");

      const data = await response.json();
      setCommissions(data.commissions || []);
      setTotals(data.totals || { pending: 0, paid: 0, total: 0 });
    } catch (error) {
      console.error("Erro ao carregar comissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (commissionId: string) => {
    const paymentMethod = prompt(
      "Método de pagamento:\n1. CASH (Dinheiro)\n2. PIX\n3. TRANSFER (Transferência)\n4. CARD (Cartão)\n\nDigite o número correspondente:"
    );

    if (!paymentMethod) return;

    const methods: Record<string, string> = {
      "1": "CASH",
      "2": "PIX",
      "3": "TRANSFER",
      "4": "CARD",
    };

    const method = methods[paymentMethod];
    if (!method) {
      alert("Método inválido");
      return;
    }

    try {
      setPaying(commissionId);

      const response = await fetch(`/api/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: method,
        }),
      });

      if (!response.ok) throw new Error("Erro ao marcar como pago");

      alert("Comissão marcada como paga!");
      fetchCommissions();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao marcar como pago");
    } finally {
      setPaying(null);
    }
  };

  const handleCancelCommission = async (commissionId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta comissão?")) return;

    try {
      const response = await fetch(`/api/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) throw new Error("Erro ao cancelar");

      alert("Comissão cancelada!");
      fetchCommissions();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao cancelar comissão");
    }
  };

  // Obter lista única de profissionais
  const staffList = Array.from(
    new Set(commissions.map((c) => JSON.stringify({ id: c.staff.id, name: c.staff.name })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Comissões
            </h1>
            <p className="text-foreground-muted">
              Gerencie e acompanhe as comissões dos profissionais
            </p>
          </div>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <GlassCard hover glow="warning">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground-muted">Pendentes</p>
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <p className="text-3xl font-bold text-warning">
                  R$ {totals.pending.toFixed(2)}
                </p>
              </div>
            </GlassCard>

            <GlassCard hover glow="success">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground-muted">Pagas</p>
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <p className="text-3xl font-bold text-success">
                  R$ {totals.paid.toFixed(2)}
                </p>
              </div>
            </GlassCard>

            <GlassCard hover glow="primary">
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-foreground-muted">Total</p>
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">
                  R$ {totals.total.toFixed(2)}
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Filtros */}
          <GlassCard className="mb-6">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Filter className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Filtros</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Status</Label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground"
                  >
                    <option value="all">Todos</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>

                <div>
                  <Label>Profissional</Label>
                  <select
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground"
                  >
                    <option value="all">Todos</option>
                    {staffList.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Lista de Comissões */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-foreground-muted">Carregando...</p>
            </div>
          ) : commissions.length === 0 ? (
            <GlassCard>
              <div className="p-12 text-center">
                <DollarSign className="h-12 w-12 text-foreground-muted mx-auto mb-4" />
                <p className="text-foreground-muted">Nenhuma comissão encontrada</p>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {commissions.map((commission) => (
                <GlassCard key={commission.id} hover>
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Info Principal */}
                      <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-foreground">
                              {commission.service.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="h-4 w-4 text-primary" />
                              <p className="text-sm text-foreground-muted">
                                {commission.staff.name}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              STATUS_LABELS[commission.status]?.color
                            } bg-current/10`}
                          >
                            {STATUS_LABELS[commission.status]?.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-foreground-muted">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(commission.booking.date), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        <div className="text-sm text-foreground-muted">
                          Cliente: {commission.booking.client.name}
                        </div>
                      </div>

                      {/* Cálculo */}
                      <div className="space-y-2">
                        <div className="text-sm text-foreground-muted">
                          Serviço: R$ {commission.servicePrice.toFixed(2)}
                        </div>
                        <div className="text-sm text-foreground-muted">
                          {commission.commissionType === "PERCENTAGE" &&
                            `${commission.percentageValue}%`}
                          {commission.commissionType === "FIXED" &&
                            `R$ ${commission.fixedValue?.toFixed(2)}`}
                          {commission.commissionType === "MIXED" &&
                            `R$ ${commission.fixedValue?.toFixed(2)} + ${commission.percentageValue}%`}
                        </div>
                        <div className="text-2xl font-bold text-success">
                          R$ {commission.calculatedValue.toFixed(2)}
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col gap-2">
                        {commission.status === "PENDING" && (
                          <>
                            <GradientButton
                              onClick={() => handleMarkAsPaid(commission.id)}
                              disabled={paying === commission.id}
                              variant="success"
                              className="text-xs"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              {paying === commission.id ? "Processando..." : "Marcar como Pago"}
                            </GradientButton>
                            <GradientButton
                              onClick={() => handleCancelCommission(commission.id)}
                              variant="ghost"
                              className="text-xs border-error text-error"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancelar
                            </GradientButton>
                          </>
                        )}
                        {commission.status === "PAID" && commission.paidAt && (
                          <div className="text-xs text-foreground-muted">
                            Pago em {format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: ptBR })}
                            <br />
                            <span className="font-semibold">{commission.paymentMethod}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </GridBackground>
    </div>
  );
}
