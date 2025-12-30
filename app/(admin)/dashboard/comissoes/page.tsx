"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Calendar, User, Filter, CreditCard, Banknote, Smartphone, ArrowLeftRight } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("PIX");

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
    try {
      setPaying(commissionId);

      const response = await fetch(`/api/commissions/${commissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PAID",
          paymentMethod: selectedPaymentMethod,
        }),
      });

      if (!response.ok) throw new Error("Erro ao marcar como pago");

      setShowPaymentDialog(false);
      setSelectedCommission(null);
      fetchCommissions();
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao marcar como pago");
    } finally {
      setPaying(null);
    }
  };

  const openPaymentDialog = (commission: Commission) => {
    setSelectedCommission(commission);
    setSelectedPaymentMethod("PIX");
    setShowPaymentDialog(true);
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
                              onClick={() => openPaymentDialog(commission)}
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

      {/* Dialog de Confirmação de Pagamento */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="glass-card w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-success">
              <CheckCircle className="h-6 w-6" />
              Confirmar Pagamento de Comissão
            </DialogTitle>
            <DialogDescription className="text-base mt-3">
              Selecione o método de pagamento utilizado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6 pb-4">
            {/* Informações da Comissão */}
            {selectedCommission && (
              <div className="p-4 glass-card rounded-xl border border-primary/10 bg-primary/5 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Profissional:</span> {selectedCommission.staff.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Serviço:</span> {selectedCommission.service.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Cliente:</span> {selectedCommission.booking.client.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Data:</span>{" "}
                  {format(new Date(selectedCommission.booking.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
                <div className="pt-2 border-t border-primary/10 mt-3">
                  <p className="text-lg font-bold text-success">
                    Valor: R$ {selectedCommission.calculatedValue.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Seletor de Método de Pagamento */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Método de Pagamento</Label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* PIX */}
                <button
                  onClick={() => setSelectedPaymentMethod("PIX")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${selectedPaymentMethod === "PIX"
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <Smartphone className={`h-6 w-6 ${selectedPaymentMethod === "PIX" ? "text-primary" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${selectedPaymentMethod === "PIX" ? "text-primary" : "text-foreground"}`}>
                    PIX
                  </span>
                </button>

                {/* Dinheiro */}
                <button
                  onClick={() => setSelectedPaymentMethod("CASH")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${selectedPaymentMethod === "CASH"
                      ? "border-success bg-success/10 shadow-lg shadow-success/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <Banknote className={`h-6 w-6 ${selectedPaymentMethod === "CASH" ? "text-success" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${selectedPaymentMethod === "CASH" ? "text-success" : "text-foreground"}`}>
                    Dinheiro
                  </span>
                </button>

                {/* Cartão */}
                <button
                  onClick={() => setSelectedPaymentMethod("CARD")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${selectedPaymentMethod === "CARD"
                      ? "border-accent bg-accent/10 shadow-lg shadow-accent/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <CreditCard className={`h-6 w-6 ${selectedPaymentMethod === "CARD" ? "text-accent" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${selectedPaymentMethod === "CARD" ? "text-accent" : "text-foreground"}`}>
                    Cartão
                  </span>
                </button>

                {/* Transferência */}
                <button
                  onClick={() => setSelectedPaymentMethod("TRANSFER")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${selectedPaymentMethod === "TRANSFER"
                      ? "border-warning bg-warning/10 shadow-lg shadow-warning/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <ArrowLeftRight className={`h-6 w-6 ${selectedPaymentMethod === "TRANSFER" ? "text-warning" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${selectedPaymentMethod === "TRANSFER" ? "text-warning" : "text-foreground"}`}>
                    Transferência
                  </span>
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentDialog(false)}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
                disabled={paying !== null}
              >
                Cancelar
              </Button>
              <GradientButton
                variant="success"
                onClick={() => selectedCommission && handleMarkAsPaid(selectedCommission.id)}
                disabled={paying !== null}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {paying ? "Processando..." : "Confirmar Pagamento"}
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
