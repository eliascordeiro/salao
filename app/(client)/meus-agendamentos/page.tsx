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
  MapPin,
  X,
  Plus,
  CheckCircle,
  Sparkles,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
import { AddToCalendarButton } from "@/components/ui/add-to-calendar-button";

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
    phone?: string;
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
  const { data: session, status } = useSession();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("upcoming");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOwnerAlert, setShowOwnerAlert] = useState(false);

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/meus-agendamentos");
    }
  }, [status, router]);

  useEffect(() => {
    // Verificar se acabou de criar um agendamento
    if (searchParams?.get("success") === "true") {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
      
      // Verificar se é dono do salão agendando no próprio salão
      if (session?.user.role === "ADMIN") {
        setShowOwnerAlert(true);
        setTimeout(() => setShowOwnerAlert(false), 8000);
      }
    }
  }, [searchParams, session]);

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

  // Loading enquanto verifica autenticação
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <GridBackground>
          <GlassCard className="max-w-md mx-auto text-center py-16">
            <div className="animate-pulseGlow inline-block mb-6">
              <Sparkles className="h-16 w-16 text-primary mx-auto" />
            </div>
            <p className="text-xl text-foreground-muted font-medium">Verificando autenticação...</p>
          </GlassCard>
        </GridBackground>
      </div>
    );
  }

  if (!session) {
    return null; // Vai redirecionar no useEffect
  }

  return (
    <div className="min-h-screen bg-background">
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

          {/* Owner Alert - Quando dono do salão agenda no próprio salão */}
          {showOwnerAlert && (
            <GlassCard className="mb-8 animate-fadeIn border-2 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/20 rounded-full">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Agendamento como Cliente
                  </h3>
                  <p className="text-foreground-muted text-sm leading-relaxed mb-3">
                    Você agendou um serviço no seu próprio salão. Este agendamento aparece aqui na 
                    área do cliente e também no <strong>Dashboard Admin</strong> na gestão de agendamentos.
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <Link href="/dashboard/agendamentos" className="w-full sm:w-auto">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="gap-2 border-amber-500/30 hover:bg-amber-500/10 w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
                      >
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Ver no Dashboard Admin</span>
                        <span className="xs:hidden">Dashboard Admin</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Header Railway */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-8 sm:mb-12 animate-fadeInUp">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3">
                Meus <span className="text-accent font-bold">Agendamentos</span>
              </h1>
              <p className="text-foreground-muted text-sm sm:text-base md:text-lg">
                Gerencie seus agendamentos e horários de forma simples
              </p>
            </div>
            <Link href="/salao/cmhpdo1c40007of60yed697zp/agendar" className="w-full md:w-auto">
              <GradientButton variant="primary" className="group w-full md:w-auto min-h-[48px] text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform" />
                <span className="hidden xs:inline">Novo Agendamento</span>
                <span className="xs:hidden">Novo</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </div>

        {/* Filter Tabs Railway */}
        <GlassCard className="mb-6 sm:mb-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
          <nav className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setFilter("upcoming")}
              className={`flex-1 min-w-0 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[48px] ${
                filter === "upcoming"
                  ? "bg-gradient-primary text-white glow-primary"
                  : "bg-background-alt text-foreground-muted hover:text-primary hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Próximos</span>
                <span className={`py-0.5 px-2 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
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
              className={`flex-1 min-w-0 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[48px] ${
                filter === "past"
                  ? "bg-gradient-accent text-white glow-accent"
                  : "bg-background-alt text-foreground-muted hover:text-accent hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Anteriores</span>
                <span className={`py-0.5 px-2 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
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
              className={`flex-1 min-w-0 py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[48px] ${
                filter === "cancelled"
                  ? "bg-gradient-to-r from-error to-error/80 text-white"
                  : "bg-background-alt text-foreground-muted hover:text-error hover:bg-background-alt/80"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                <X className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">Cancelados</span>
                <span className={`py-0.5 px-2 sm:px-2.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
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
          <GlassCard className="py-12 sm:py-16 md:py-20 text-center animate-fadeInUp px-4" style={{ animationDelay: "400ms" }}>
            <Calendar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-foreground-muted mx-auto mb-4 sm:mb-6 opacity-50" />
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2 sm:mb-3">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-sm sm:text-base text-foreground-muted mb-6 sm:mb-8 max-w-md mx-auto">
              {filter === "upcoming" &&
                "Você não tem agendamentos futuros no momento. Que tal agendar um serviço agora?"}
              {filter === "past" && "Você ainda não tem histórico de agendamentos anteriores."}
              {filter === "cancelled" && "Você não tem agendamentos cancelados."}
            </p>
            <Link href="/salao/cmhpdo1c40007of60yed697zp/agendar" className="inline-block w-full sm:w-auto">
              <GradientButton variant="primary" className="group w-full sm:w-auto min-h-[48px] text-sm sm:text-base">
                <Plus className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform" />
                <span className="hidden xs:inline">Fazer um Agendamento</span>
                <span className="xs:hidden">Agendar</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
            {filteredBookings.map((booking, index) => (
              <GlassCard 
                key={booking.id} 
                hover 
                glow="primary" 
                className="group animate-fadeInUp"
                style={{ animationDelay: `${300 + index * 100}ms` }}
              >
                <div className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-start justify-between mb-4 sm:mb-6">
                    {/* Status Badge Railway */}
                    <span
                      className={`inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm ${
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                    {/* Left Column - Service Details */}
                    <div className="space-y-3 sm:space-y-4 md:space-y-5">
                      <h3 className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {booking.service.name}
                      </h3>

                      <div className="space-y-2.5 sm:space-y-3">
                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-foreground-muted uppercase tracking-wide">Data</p>
                            <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                              {format(new Date(booking.date), "dd/MM/yyyy", {
                                locale: ptBR,
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-foreground-muted uppercase tracking-wide">Horário</p>
                            <p className="text-xs sm:text-sm text-foreground font-medium truncate">
                              {new Date(booking.date).getUTCHours().toString().padStart(2, '0')}:{new Date(booking.date).getUTCMinutes().toString().padStart(2, '0')} • {booking.service.duration} min
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-foreground-muted uppercase tracking-wide">Profissional</p>
                            <p className="text-xs sm:text-sm text-foreground font-medium">
                              <span className="truncate block">{booking.staff.name}</span>
                              {booking.staff.specialty && (
                                <span className="text-foreground-muted text-xs sm:text-sm block mt-0.5 truncate">
                                  {booking.staff.specialty}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5">
                          <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-success/20 flex items-center justify-center">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-xs text-foreground-muted uppercase tracking-wide">Local</p>
                            <p className="text-xs sm:text-sm text-foreground font-medium">
                              <span className="truncate block">{booking.salon.name}</span>
                              {booking.salon.address && (
                                <span className="text-foreground-muted block text-xs sm:text-sm mt-0.5 truncate">
                                  {booking.salon.address}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Price & Actions */}
                    <div className="flex flex-col justify-between space-y-3 sm:space-y-4">
                      {/* Price Display */}
                      <div className="p-3 sm:p-4 md:p-5 rounded-xl bg-success/10 border border-success/20">
                        <p className="text-xs sm:text-sm text-foreground-muted mb-1 uppercase tracking-wide">Valor Total</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-success">
                          R$ {booking.totalPrice.toFixed(2)}
                        </p>
                      </div>

                      {/* Notes */}
                      {booking.notes && (
                        <div className="p-3 sm:p-4 rounded-lg bg-background-alt border border-border">
                          <p className="text-[10px] sm:text-xs text-foreground-muted mb-2 uppercase tracking-wide flex items-center gap-1.5 sm:gap-2">
                            <AlertCircle className="h-3 w-3 flex-shrink-0" />
                            Observações
                          </p>
                          <p className="text-xs sm:text-sm text-foreground break-words">{booking.notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2 sm:space-y-3">
                        {/* Add to Calendar Button */}
                        {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
                          <AddToCalendarButton booking={booking} />
                        )}

                        {/* Cancel Button */}
                        {canCancelBooking(booking) && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="w-full px-4 sm:px-6 py-3 sm:py-3.5 rounded-lg border-2 border-error text-error font-medium text-sm sm:text-base hover:bg-error/10 transition-all group/cancel min-h-[48px]"
                          >
                            <X className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline-block group-hover/cancel:rotate-90 transition-transform" />
                            <span className="hidden xs:inline">Cancelar Agendamento</span>
                            <span className="xs:hidden">Cancelar</span>
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
