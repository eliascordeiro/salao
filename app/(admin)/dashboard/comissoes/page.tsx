"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Calendar, User, Filter, CreditCard, Banknote, Smartphone, ArrowLeftRight, Check } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  
  // Seleção múltipla
  const [selectedCommissions, setSelectedCommissions] = useState<Set<string>>(new Set());
  const [showBulkPaymentDialog, setShowBulkPaymentDialog] = useState(false);
  const [bulkPaymentMethod, setBulkPaymentMethod] = useState<string>("PIX");

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

  // Funções de seleção múltipla
  const toggleCommissionSelection = (commissionId: string) => {
    const newSelection = new Set(selectedCommissions);
    if (newSelection.has(commissionId)) {
      newSelection.delete(commissionId);
    } else {
      newSelection.add(commissionId);
    }
    setSelectedCommissions(newSelection);
  };

  const toggleSelectAll = () => {
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING');
    if (selectedCommissions.size === pendingCommissions.length) {
      setSelectedCommissions(new Set());
    } else {
      setSelectedCommissions(new Set(pendingCommissions.map(c => c.id)));
    }
  };

  const getSelectedTotal = () => {
    return commissions
      .filter(c => selectedCommissions.has(c.id))
      .reduce((sum, c) => sum + c.calculatedValue, 0);
  };

  const handleBulkPayment = async () => {
    if (selectedCommissions.size === 0) return;

    try {
      setPaying("bulk");
      
      // Processar pagamento de todas as comissões selecionadas
      const promises = Array.from(selectedCommissions).map(id =>
        fetch(`/api/commissions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "PAID",
            paymentMethod: bulkPaymentMethod,
          }),
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        throw new Error(`${failed.length} pagamento(s) falharam`);
      }

      setShowBulkPaymentDialog(false);
      setSelectedCommissions(new Set());
      setBulkPaymentMethod("PIX");
      fetchCommissions();
      alert(`${selectedCommissions.size} comissão(ões) marcadas como pagas!`);
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao processar pagamentos em lote");
    } finally {
      setPaying(null);
    }
  };

  const openBulkPaymentDialog = () => {
    if (selectedCommissions.size === 0) {
      alert("Selecione pelo menos uma comissão pendente");
      return;
    }
    setBulkPaymentMethod("PIX");
    setShowBulkPaymentDialog(true);
  };

  // Obter lista única de profissionais
  const staffList = Array.from(
    new Set(commissions.map((c) => JSON.stringify({ id: c.staff.id, name: c.staff.name })))
  ).map((s) => JSON.parse(s));

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
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
            <GlassCard hover>
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Filtros</h2>
                </div>
                
                {/* Checkbox "Selecionar Todos" - apenas para pendentes */}
                {commissions.filter(c => c.status === 'PENDING').length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedCommissions.size === commissions.filter(c => c.status === 'PENDING').length && selectedCommissions.size > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <Label htmlFor="select-all" className="text-sm cursor-pointer">
                      Selecionar todas pendentes ({commissions.filter(c => c.status === 'PENDING').length})
                    </Label>
                  </div>
                )}
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
                      {/* Checkbox de seleção - apenas para pendentes */}
                      {commission.status === 'PENDING' && (
                        <div className="lg:col-span-4 mb-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`commission-${commission.id}`}
                              checked={selectedCommissions.has(commission.id)}
                              onCheckedChange={() => toggleCommissionSelection(commission.id)}
                            />
                            <Label 
                              htmlFor={`commission-${commission.id}`} 
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Selecionar para pagamento em lote
                            </Label>
                          </div>
                        </div>
                      )}
                      
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
                            <Button
                              onClick={() => handleCancelCommission(commission.id)}
                              variant="outline"
                              className="text-xs border-error text-error hover:bg-error/10"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancelar
                            </Button>
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

      {/* Barra flutuante de pagamento em lote */}
      {selectedCommissions.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95vw] max-w-2xl">
          <GlassCard className="p-4 sm:p-6 shadow-2xl border-2 border-success/30">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-success/20">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm sm:text-base">
                    {selectedCommissions.size} comissão(ões) selecionada(s)
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-success">
                    R$ {getSelectedTotal().toFixed(2)}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => setSelectedCommissions(new Set())}
                  className="flex-1 sm:flex-initial"
                >
                  Cancelar
                </Button>
                <GradientButton
                  onClick={openBulkPaymentDialog}
                  variant="success"
                  className="flex-1 sm:flex-initial"
                  disabled={paying === "bulk"}
                >
                  <CheckCircle className="h-4 w-4" />
                  {paying === "bulk" ? "Processando..." : "Pagar Selecionadas"}
                </GradientButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

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

      {/* Dialog de Pagamento em Lote */}
      <Dialog open={showBulkPaymentDialog} onOpenChange={setShowBulkPaymentDialog}>
        <DialogContent className="glass-card w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-success">
              <CheckCircle className="h-6 w-6" />
              Pagamento em Lote
            </DialogTitle>
            <DialogDescription className="text-sm sm:text-base pt-2">
              Confirme o pagamento de <span className="font-bold text-success">{selectedCommissions.size}</span> comissão(ões) 
              no valor total de <span className="font-bold text-success">R$ {getSelectedTotal().toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Lista de comissões selecionadas */}
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {commissions
                .filter(c => selectedCommissions.has(c.id))
                .map((commission) => (
                  <div key={commission.id} className="p-3 rounded-lg bg-background-alt/30 border border-primary/10">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {commission.service.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {commission.staff.name}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-success whitespace-nowrap">
                        R$ {commission.calculatedValue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            {/* Seletor de Método de Pagamento */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Selecione o método de pagamento:
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod("PIX")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${bulkPaymentMethod === "PIX"
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <Smartphone className={`h-6 w-6 ${bulkPaymentMethod === "PIX" ? "text-primary" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${bulkPaymentMethod === "PIX" ? "text-primary" : "text-foreground"}`}>
                    PIX
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod("CASH")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${bulkPaymentMethod === "CASH"
                      ? "border-success bg-success/10 shadow-lg shadow-success/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <Banknote className={`h-6 w-6 ${bulkPaymentMethod === "CASH" ? "text-success" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${bulkPaymentMethod === "CASH" ? "text-success" : "text-foreground"}`}>
                    Dinheiro
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod("CARD")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${bulkPaymentMethod === "CARD"
                      ? "border-error bg-error/10 shadow-lg shadow-error/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <CreditCard className={`h-6 w-6 ${bulkPaymentMethod === "CARD" ? "text-error" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${bulkPaymentMethod === "CARD" ? "text-error" : "text-foreground"}`}>
                    Cartão
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBulkPaymentMethod("TRANSFER")}
                  className={`
                    p-4 rounded-xl border-2 transition-all duration-200
                    flex flex-col items-center gap-2 min-h-[100px]
                    ${bulkPaymentMethod === "TRANSFER"
                      ? "border-warning bg-warning/10 shadow-lg shadow-warning/20"
                      : "border-primary/20 bg-background-alt/30 hover:border-primary/40"
                    }
                  `}
                >
                  <ArrowLeftRight className={`h-6 w-6 ${bulkPaymentMethod === "TRANSFER" ? "text-warning" : "text-foreground-muted"}`} />
                  <span className={`text-sm font-semibold ${bulkPaymentMethod === "TRANSFER" ? "text-warning" : "text-foreground"}`}>
                    Transferência
                  </span>
                </button>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowBulkPaymentDialog(false)}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
                disabled={paying === "bulk"}
              >
                Cancelar
              </Button>
              <GradientButton
                variant="success"
                onClick={handleBulkPayment}
                disabled={paying === "bulk"}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                {paying === "bulk" ? "Processando..." : `Pagar ${selectedCommissions.size} Comissão(ões)`}
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
