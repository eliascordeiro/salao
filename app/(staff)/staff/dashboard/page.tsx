"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  TrendingUp,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingCommissions: number;
  todayBookings: number;
  upcomingBookings: any[];
  recentCommissions: any[];
}

export default function StaffDashboardPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    pendingCommissions: 0,
    todayBookings: 0,
    upcomingBookings: [],
    recentCommissions: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/staff/dashboard");
      if (!response.ok) throw new Error("Erro ao carregar dados");
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Olá, {session?.user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-foreground-muted">
          Bem-vindo ao seu painel de profissional
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hover glow="success">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground-muted">Hoje</p>
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <p className="text-3xl font-bold text-success">
              R$ {stats.todayEarnings.toFixed(2)}
            </p>
          </div>
        </GlassCard>

        <GlassCard hover glow="primary">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground-muted">Esta Semana</p>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <p className="text-3xl font-bold text-primary">
              R$ {stats.weekEarnings.toFixed(2)}
            </p>
          </div>
        </GlassCard>

        <GlassCard hover glow="accent">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground-muted">Este Mês</p>
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
            <p className="text-3xl font-bold text-accent">
              R$ {stats.monthEarnings.toFixed(2)}
            </p>
          </div>
        </GlassCard>

        <GlassCard hover>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-foreground-muted">Pendentes</p>
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <p className="text-3xl font-bold text-warning">
              R$ {stats.pendingCommissions.toFixed(2)}
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Agendamentos */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Próximos Agendamentos
              </h2>
            </div>

            {stats.upcomingBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum agendamento próximo
              </p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingBookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-alt/30 border border-primary/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {booking.service.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {booking.client.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-primary">
                        {format(new Date(booking.date), "dd/MM", { locale: ptBR })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.date), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Comissões Recentes */}
        <GlassCard>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-success" />
              <h2 className="text-lg font-bold text-foreground">
                Comissões Recentes
              </h2>
            </div>

            {stats.recentCommissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhuma comissão registrada
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentCommissions.slice(0, 5).map((commission: any) => (
                  <div
                    key={commission.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background-alt/30 border border-primary/10"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {commission.service.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(commission.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">
                        R$ {commission.calculatedValue.toFixed(2)}
                      </p>
                      {commission.status === "PAID" ? (
                        <div className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle className="h-3 w-3" />
                          Pago
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-warning">
                          <AlertCircle className="h-3 w-3" />
                          Pendente
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
