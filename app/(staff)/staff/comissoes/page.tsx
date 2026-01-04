"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar, CheckCircle, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commission {
  id: string;
  calculatedValue: number;
  status: string;
  paidAt: string | null;
  paymentMethod: string | null;
  createdAt: string;
  service: { name: string };
  booking: {
    date: string;
    client: { name: string };
  };
}

export default function StaffComissoesPage() {
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totals, setTotals] = useState({ pending: 0, paid: 0, total: 0 });

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
    try {
      const response = await fetch("/api/staff/commissions");
      if (!response.ok) throw new Error("Erro ao carregar comissões");
      
      const data = await response.json();
      setCommissions(data.commissions || []);
      setTotals(data.totals || { pending: 0, paid: 0, total: 0 });
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
          Minhas Comissões
        </h1>
        <p className="text-sm sm:text-base text-foreground-muted">
          Acompanhe suas comissões e pagamentos
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <GlassCard hover className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-foreground-muted">Pendentes</p>
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-warning" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-warning">
            R$ {totals.pending.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard hover className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-foreground-muted">Pagas</p>
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-success">
            R$ {totals.paid.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard hover className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-foreground-muted">Total</p>
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-primary">
            R$ {totals.total.toFixed(2)}
          </p>
        </GlassCard>
      </div>

      {/* Lista de Comissões */}
      {commissions.length === 0 ? (
        <GlassCard>
          <div className="p-8 sm:p-12 text-center">
            <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Nenhuma comissão encontrada</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {commissions.map((commission) => (
            <GlassCard key={commission.id} hover className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="lg:col-span-2 space-y-1.5 sm:space-y-2">
                  <h3 className="font-bold text-foreground text-base sm:text-lg">
                    {commission.service.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Cliente: {commission.booking.client.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {format(new Date(commission.booking.date), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <p className="text-xl sm:text-2xl font-bold text-success">
                    R$ {commission.calculatedValue.toFixed(2)}
                  </p>
                </div>

                <div className="flex flex-col justify-center items-start lg:items-end">
                  {commission.status === "PAID" && commission.paidAt ? (
                    <div className="text-left lg:text-right">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                        Pago
                      </span>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(commission.paidAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                      {commission.paymentMethod && (
                        <p className="text-xs font-semibold text-foreground">
                          {commission.paymentMethod}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                      Pendente
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
