"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, User, Phone, Mail, Filter, Search, Sparkles, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  date: string;
  status: string;
  notes?: string;
  totalPrice: number;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
  staff: {
    name: string;
    specialty?: string;
  };
}

interface Staff {
  id: string;
  name: string;
}

const statusConfig = {
  PENDING: { label: "Pendente", color: "glass-card border-yellow-500/50 bg-yellow-500/10 text-yellow-400", icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", color: "glass-card border-primary/50 bg-primary/10 text-primary", icon: CheckCircle },
  COMPLETED: { label: "Concluído", color: "glass-card border-accent/50 bg-accent/10 text-accent", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "glass-card border-destructive/50 bg-destructive/10 text-destructive", icon: XCircle },
  NO_SHOW: { label: "Não compareceu", color: "glass-card bg-background-alt/50 text-foreground-muted", icon: XCircle },
};

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    staffId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Carregar agendamentos
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.status) params.append("status", filters.status);
      if (filters.staffId) params.append("staffId", filters.staffId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(`/api/bookings?${params.toString()}`);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar profissionais para o filtro
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await fetch("/api/staff");
        const data = await response.json();
        setStaff(data);
      } catch (error) {
        console.error("Erro ao carregar profissionais:", error);
      }
    };

    fetchStaff();
  }, []);

  // Carregar agendamentos ao montar e quando filtros mudarem
  useEffect(() => {
    fetchBookings();
  }, [filters.status, filters.staffId, filters.startDate, filters.endDate]);

  // Atualizar status do agendamento
  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      // Recarregar lista
      fetchBookings();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do agendamento");
    }
  };

  // Filtrar por busca de texto
  const filteredBookings = bookings.filter((booking) => {
    if (!filters.search) return true;
    
    const searchLower = filters.search.toLowerCase();
    return (
      booking.client.name.toLowerCase().includes(searchLower) ||
      booking.client.email.toLowerCase().includes(searchLower) ||
      booking.service.name.toLowerCase().includes(searchLower) ||
      booking.staff.name.toLowerCase().includes(searchLower)
    );
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
        <div className="flex items-center justify-center h-64">
          <Sparkles className="h-8 w-8 text-primary animate-spin" />
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
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-primary" />
              Agendamentos
            </h1>
            <p className="text-foreground-muted mt-2">
              Gerencie todos os agendamentos do salão
            </p>
          </div>

          {/* Filtros */}
          <GlassCard className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <GradientButton
                variant="primary"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </GradientButton>

              <div className="flex items-center gap-2 flex-1 max-w-md ml-4">
                <Search className="h-4 w-4 text-primary" />
                <Input
                  placeholder="Buscar por cliente, serviço ou profissional..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-primary/20">
                {/* Status */}
                <div>
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 glass-card bg-background-alt/50 border-primary/20 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    <option value="PENDING">Pendente</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="CANCELLED">Cancelado</option>
                    <option value="NO_SHOW">Não compareceu</option>
                  </select>
                </div>

                {/* Profissional */}
                <div>
                  <Label htmlFor="staffId" className="text-foreground">Profissional</Label>
                  <select
                    id="staffId"
                    value={filters.staffId}
                    onChange={(e) =>
                      setFilters({ ...filters, staffId: e.target.value })
                    }
                    className="w-full px-3 py-2 glass-card bg-background-alt/50 border-primary/20 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Todos</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data Início */}
                <div>
                  <Label htmlFor="startDate" className="text-foreground">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                  />
                </div>

                {/* Data Fim */}
                <div>
                  <Label htmlFor="endDate" className="text-foreground">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <GlassCard className="p-6">
              <p className="text-sm text-foreground-muted">Total</p>
              <p className="text-2xl font-bold text-foreground">{filteredBookings.length}</p>
            </GlassCard>
            <GlassCard className="p-6" glow="primary">
              <p className="text-sm text-foreground-muted">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "PENDING").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6" glow="success">
              <p className="text-sm text-foreground-muted">Confirmados</p>
              <p className="text-2xl font-bold text-primary flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "CONFIRMED").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6" glow="accent">
              <p className="text-sm text-foreground-muted">Concluídos</p>
              <p className="text-2xl font-bold text-accent flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "COMPLETED").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6">
              <p className="text-sm text-foreground-muted">Cancelados</p>
              <p className="text-2xl font-bold text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "CANCELLED").length}
              </p>
            </GlassCard>
          </div>

          {/* Lista de Agendamentos */}
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-foreground-muted">Carregando agendamentos...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Calendar className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-foreground-muted">
                Tente ajustar os filtros ou aguarde novos agendamentos
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <GlassCard 
                  key={booking.id} 
                  hover 
                  className="p-6 animate-fadeIn" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1 space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            {booking.staff.name}
                            {booking.staff.specialty && (
                              <span className="text-foreground-muted/70">
                                {" "}
                                • {booking.staff.specialty}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig[booking.status as keyof typeof statusConfig]?.color}`}>
                          {(() => {
                            const Icon = statusConfig[booking.status as keyof typeof statusConfig]?.icon;
                            return Icon && <Icon className="h-3 w-3" />;
                          })()}
                          {statusConfig[booking.status as keyof typeof statusConfig]?.label}
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(booking.date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-accent" />
                          {format(new Date(booking.date), "HH:mm")} (
                          {booking.service.duration}min)
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-foreground">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {booking.client.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-muted ml-5">
                          <Mail className="h-3 w-3 text-primary" />
                          {booking.client.email}
                        </div>
                        {booking.client.phone && (
                          <div className="flex items-center gap-1 text-foreground-muted ml-5">
                            <Phone className="h-3 w-3 text-accent" />
                            {booking.client.phone}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          Valor:{" "}
                        </span>
                        <span className="text-lg font-bold text-accent">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Notas */}
                      {booking.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground">
                            Observações:{" "}
                          </span>
                          <span className="text-foreground-muted">{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {booking.status === "PENDING" && (
                        <>
                          <GradientButton
                            variant="success"
                            onClick={() =>
                              handleStatusChange(booking.id, "CONFIRMED")
                            }
                            className="w-full py-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar
                          </GradientButton>
                          <GradientButton
                            variant="accent"
                            onClick={() =>
                              handleStatusChange(booking.id, "CANCELLED")
                            }
                            className="w-full py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar
                          </GradientButton>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <>
                          <GradientButton
                            variant="accent"
                            onClick={() =>
                              handleStatusChange(booking.id, "COMPLETED")
                            }
                            className="w-full py-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Marcar Concluído
                          </GradientButton>
                          <GradientButton
                            variant="primary"
                            onClick={() =>
                              handleStatusChange(booking.id, "NO_SHOW")
                            }
                            className="w-full py-2"
                          >
                            <XCircle className="h-4 w-4" />
                            Não Compareceu
                          </GradientButton>
                        </>
                      )}
                      {(booking.status === "COMPLETED" ||
                        booking.status === "CANCELLED" ||
                        booking.status === "NO_SHOW") && (
                        <p className="text-sm text-foreground-muted text-center py-2 glass-card bg-background-alt/30 rounded-lg">
                          Agendamento finalizado
                        </p>
                      )}
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
