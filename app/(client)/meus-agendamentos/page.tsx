"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  MapPin,
  X,
  Plus,
  CheckCircle,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";

interface Booking {
  id: string;
  date: string;
  status: string;
  totalPrice: number;
  notes?: string;
  service: {
    name: string;
    duration: number;
  };
  staff: {
    name: string;
    specialty?: string;
  };
  salon: {
    name: string;
    address?: string;
  };
  payment?: {
    status: string;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmado", color: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Concluído", color: "bg-blue-100 text-blue-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  NO_SHOW: { label: "Não Compareceu", color: "bg-gray-100 text-gray-800" },
};

type FilterTab = "upcoming" | "past" | "cancelled";

function MyBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("upcoming");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Verificar se acabou de criar um agendamento
    if (searchParams?.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!session) return;

      setLoading(true);
      try {
        const response = await fetch("/api/bookings?clientOnly=true");
        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Erro ao carregar agendamentos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [session]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (response.ok) {
        // Atualizar lista de agendamentos
        setBookings(
          bookings.map((b) =>
            b.id === bookingId ? { ...b, status: "CANCELLED" } : b
          )
        );
        alert("Agendamento cancelado com sucesso!");
      } else {
        alert("Erro ao cancelar agendamento");
      }
    } catch (error) {
      console.error("Erro ao cancelar agendamento:", error);
      alert("Erro ao cancelar agendamento");
    }
  };

  const filterBookings = (bookings: Booking[]): Booking[] => {
    const now = new Date();

    switch (filter) {
      case "upcoming":
        return bookings.filter((b) => {
          const bookingDate = new Date(b.date);
          return (
            bookingDate >= now &&
            (b.status === "PENDING" || b.status === "CONFIRMED")
          );
        });
      case "past":
        return bookings.filter((b) => {
          const bookingDate = new Date(b.date);
          return bookingDate < now || b.status === "COMPLETED";
        });
      case "cancelled":
        return bookings.filter(
          (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
        );
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(bookings);

  const canCancelBooking = (booking: Booking) => {
    return booking.status === "PENDING" || booking.status === "CONFIRMED";
  };

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Message Railway */}
          {showSuccess && (
            <GlassCard glow="success" className="mb-8 animate-fadeIn">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success/20 rounded-full">
                  <CheckCircle className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Agendamento criado com sucesso!
                  </h3>
                  <p className="text-foreground-muted text-sm">
                    Aguarde a confirmação do seu agendamento. Você receberá um email em breve.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Header Railway */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-fadeInUp">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Meus <span className="text-accent font-bold">Agendamentos</span>
              </h1>
              <p className="text-foreground-muted text-lg">
                Gerencie seus agendamentos e horários de forma simples
              </p>
            </div>
            <Link href="/servicos">
              <GradientButton variant="primary" className="group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Novo Agendamento
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </div>

        {/* Filter Tabs Railway */}
        <GlassCard className="mb-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
          <nav className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter("upcoming")}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-lg font-medium text-sm transition-all ${
                filter === "upcoming"
                  ? "bg-gradient-primary text-white glow-primary"
                  : "bg-background-alt text-foreground-muted hover:text-primary hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Próximos</span>
                <span className={`py-0.5 px-2.5 rounded-full text-xs font-bold ${
                  filter === "upcoming" 
                    ? "bg-white/20 text-white" 
                    : "bg-primary/20 text-primary"
                }`}>
                  {
                    filterBookings(bookings).filter((b) =>
                      ["PENDING", "CONFIRMED"].includes(b.status)
                    ).length
                  }
                </span>
              </div>
            </button>
            <button
              onClick={() => setFilter("past")}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-lg font-medium text-sm transition-all ${
                filter === "past"
                  ? "bg-gradient-accent text-white glow-accent"
                  : "bg-background-alt text-foreground-muted hover:text-accent hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Anteriores</span>
                <span className={`py-0.5 px-2.5 rounded-full text-xs font-bold ${
                  filter === "past" 
                    ? "bg-white/20 text-white" 
                    : "bg-accent/20 text-accent"
                }`}>
                  {
                    bookings.filter((b) => {
                      const bookingDate = new Date(b.date);
                      return bookingDate < new Date() || b.status === "COMPLETED";
                    }).length
                  }
                </span>
              </div>
            </button>
            <button
              onClick={() => setFilter("cancelled")}
              className={`flex-1 min-w-[140px] py-4 px-6 rounded-lg font-medium text-sm transition-all ${
                filter === "cancelled"
                  ? "bg-gradient-to-r from-error to-error/80 text-white"
                  : "bg-background-alt text-foreground-muted hover:text-error hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <X className="h-4 w-4" />
                <span>Cancelados</span>
                <span className={`py-0.5 px-2.5 rounded-full text-xs font-bold ${
                  filter === "cancelled" 
                    ? "bg-white/20 text-white" 
                    : "bg-error/20 text-error"
                }`}>
                  {
                    bookings.filter(
                      (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
                    ).length
                  }
                </span>
              </div>
            </button>
          </nav>
        </GlassCard>

        {/* Bookings List Railway */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulseGlow inline-block">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-foreground-muted text-lg">Carregando seus agendamentos...</p>
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <GlassCard className="py-20 text-center animate-fadeInUp" style={{ animationDelay: "400ms" }}>
            <Calendar className="h-16 w-16 text-foreground-muted mx-auto mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-foreground mb-3">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              {filter === "upcoming" &&
                "Você não tem agendamentos futuros no momento. Que tal agendar um serviço agora?"}
              {filter === "past" && "Você ainda não tem histórico de agendamentos anteriores."}
              {filter === "cancelled" && "Você não tem agendamentos cancelados."}
            </p>
            <Link href="/servicos">
              <GradientButton variant="primary" className="group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Fazer um Agendamento
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking, index) => (
              <GlassCard 
                key={booking.id} 
                hover 
                glow="primary" 
                className="group animate-fadeInUp"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    {/* Status Badge Railway */}
                    <span
                      className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                        booking.status === "CONFIRMED"
                          ? "bg-success/20 text-success border border-success/30"
                          : booking.status === "PENDING"
                          ? "bg-warning/20 text-warning border border-warning/30"
                          : booking.status === "CANCELLED"
                          ? "bg-error/20 text-error border border-error/30"
                          : booking.status === "COMPLETED"
                          ? "bg-accent/20 text-accent border border-accent/30"
                          : "bg-foreground-muted/20 text-foreground-muted border border-foreground-muted/30"
                      }`}
                    >
                      {STATUS_LABELS[booking.status]?.label || booking.status}
                    </span>
                  </div>

                  {/* Main Info Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Service Details */}
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {booking.service.name}
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground-muted uppercase tracking-wide">Data</p>
                            <p className="text-foreground font-medium">
                              {format(new Date(booking.date), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-accent" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground-muted uppercase tracking-wide">Horário</p>
                            <p className="text-foreground font-medium">
                              {format(new Date(booking.date), "HH:mm")} • {booking.service.duration} min
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground-muted uppercase tracking-wide">Profissional</p>
                            <p className="text-foreground font-medium">
                              {booking.staff.name}
                              {booking.staff.specialty && (
                                <span className="text-foreground-muted ml-1">
                                  • {booking.staff.specialty}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-success" />
                          </div>
                          <div>
                            <p className="text-xs text-foreground-muted uppercase tracking-wide">Local</p>
                            <p className="text-foreground font-medium">
                              {booking.salon.name}
                              {booking.salon.address && (
                                <span className="text-foreground-muted block text-sm mt-0.5">
                                  {booking.salon.address}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Price & Actions */}
                    <div className="flex flex-col justify-between space-y-6">
                      {/* Price Display */}
                      <div className="p-6 rounded-xl bg-success/10 border border-success/20">
                        <p className="text-sm text-foreground-muted mb-2 uppercase tracking-wide">Valor Total</p>
                        <p className="text-4xl font-bold text-success">
                          R$ {booking.totalPrice.toFixed(2)}
                        </p>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="p-4 rounded-lg bg-background-alt border border-border">
                          <p className="text-xs text-foreground-muted mb-2 uppercase tracking-wide flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" />
                            Observações
                          </p>
                          <p className="text-sm text-foreground">{booking.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-3">
                        {/* Payment Button */}
                        {booking.status === "PENDING" &&
                          (!booking.payment ||
                            booking.payment.status === "PENDING" ||
                            booking.payment.status === "FAILED") && (
                            <Link href={`/agendar/checkout/${booking.id}`} className="block">
                              <GradientButton variant="success" className="w-full group/pay">
                                <DollarSign className="h-4 w-4 group-hover/pay:scale-110 transition-transform" />
                                Realizar Pagamento
                                <ArrowRight className="h-4 w-4 group-hover/pay:translate-x-1 transition-transform" />
                              </GradientButton>
                            </Link>
                          )}

                        {/* Payment Status */}
                        {booking.payment && (
                          <div className="px-4 py-3 rounded-lg bg-background-alt border border-border">
                            <p className="text-xs text-foreground-muted">
                              Status do Pagamento:{" "}
                              <span
                                className={`font-bold ${
                                  booking.payment.status === "COMPLETED"
                                    ? "text-success"
                                    : booking.payment.status === "FAILED"
                                    ? "text-error"
                                    : "text-warning"
                                }`}
                              >
                                {booking.payment.status === "COMPLETED"
                                  ? "✓ Confirmado"
                                  : booking.payment.status === "PROCESSING"
                                  ? "⏳ Processando"
                                  : booking.payment.status === "FAILED"
                                  ? "✗ Falhou"
                                  : "⏱ Pendente"}
                              </span>
                            </p>
                          </div>
                        )}

                        {/* Cancel Button */}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="w-full px-6 py-3 rounded-lg border-2 border-error text-error font-medium hover:bg-error/10 transition-all group/cancel"
                          >
                            <X className="h-5 w-5 mr-2 inline-block group-hover/cancel:rotate-90 transition-transform" />
                            Cancelar Agendamento
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>
      </GridBackground>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <GridBackground>
          <div className="container mx-auto px-4 py-20">
            <GlassCard className="max-w-md mx-auto text-center py-16">
              <div className="animate-pulseGlow inline-block mb-6">
                <Sparkles className="h-16 w-16 text-primary mx-auto" />
              </div>
              <p className="text-xl text-foreground-muted font-medium">Carregando seus agendamentos...</p>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    }>
      <MyBookingsContent />
    </Suspense>
  );
}
