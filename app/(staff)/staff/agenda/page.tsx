"use client";

import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Clock, User, Phone, CheckCircle, XCircle } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  date: string;
  status: string;
  notes?: string;
  service: { name: string; duration: number };
  client: { name: string; phone?: string };
}

interface StaffProfile {
  id: string;
  name: string;
  canConfirmBooking: boolean;
  canCancelBooking: boolean;
  canEditSchedule: boolean;
  canManageBlocks: boolean;
}

export default function StaffAgendaPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchStaffProfile();
    fetchBookings();
  }, []);

  const fetchStaffProfile = async () => {
    try {
      const response = await fetch("/api/staff/profile");
      if (!response.ok) throw new Error("Erro ao carregar perfil");
      
      const data = await response.json();
      setStaffProfile(data);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch("/api/staff/bookings");
      if (!response.ok) throw new Error("Erro ao carregar agendamentos");
      
      const data = await response.json();
      setBookings(data.bookings || []);
    } catch (error) {
      console.error("Erro:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "text-success bg-success/10 border-success/20";
      case "PENDING":
        return "text-warning bg-warning/10 border-warning/20";
      case "COMPLETED":
        return "text-primary bg-primary/10 border-primary/20";
      case "CANCELLED":
        return "text-error bg-error/10 border-error/20";
      default:
        return "text-muted-foreground bg-background-alt/30 border-primary/10";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Pendente",
      CONFIRMED: "Confirmado",
      COMPLETED: "Concluído",
      CANCELLED: "Cancelado",
    };
    return labels[status] || status;
  };

  const handleConfirmBooking = async (bookingId: string) => {
    if (!confirm("Deseja confirmar este agendamento?")) return;

    setActionLoading(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMED" }),
      });

      if (!response.ok) throw new Error("Erro ao confirmar agendamento");

      // Atualizar lista local
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: "CONFIRMED" } : b
      ));
      alert("Agendamento confirmado com sucesso!");
    } catch (error) {
      console.error("Erro ao confirmar:", error);
      alert("Erro ao confirmar agendamento");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Deseja cancelar este agendamento?")) return;

    setActionLoading(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) throw new Error("Erro ao cancelar agendamento");

      // Atualizar lista local
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: "CANCELLED" } : b
      ));
      alert("Agendamento cancelado com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      alert("Erro ao cancelar agendamento");
    } finally {
      setActionLoading(null);
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
          Minha Agenda
        </h1>
        <p className="text-sm sm:text-base text-foreground-muted">
          Visualize seus agendamentos
        </p>
      </div>

      {bookings.length === 0 ? (
        <GlassCard>
          <div className="p-8 sm:p-12 text-center">
            <CalendarIcon className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Nenhum agendamento encontrado</p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {bookings.map((booking) => (
            <GlassCard key={booking.id} hover className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="lg:col-span-2 space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-foreground text-base sm:text-lg">
                        {booking.service.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {booking.service.duration} min
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    <span className="text-foreground">{booking.client.name}</span>
                    {booking.client.phone && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{booking.client.phone}</span>
                      </>
                    )}
                  </div>

                  {booking.notes && (
                    <p className="text-xs sm:text-sm text-muted-foreground italic">
                      Obs: {booking.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex lg:flex-col items-start lg:items-end gap-3 sm:gap-3">
                    <div className="text-left lg:text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Data</p>
                      <p className="text-base sm:text-lg font-bold text-primary">
                        {format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-xs sm:text-sm text-muted-foreground">Horário</p>
                      <p className="text-base sm:text-lg font-bold text-accent">
                        {format(new Date(booking.date), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Ações baseadas em permissões */}
                  {booking.status === "PENDING" && staffProfile && (
                    <div className="flex flex-col gap-2">
                      {staffProfile.canConfirmBooking && (
                        <Button
                          onClick={() => handleConfirmBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          className="w-full bg-success hover:bg-success/90 text-white gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {actionLoading === booking.id ? "Confirmando..." : "Confirmar"}
                        </Button>
                      )}
                      {staffProfile.canCancelBooking && (
                        <Button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={actionLoading === booking.id}
                          variant="outline"
                          className="w-full border-error text-error hover:bg-error/10 gap-2"
                        >
                          <XCircle className="h-4 w-4" />
                          {actionLoading === booking.id ? "Cancelando..." : "Cancelar"}
                        </Button>
                      )}
                      {!staffProfile.canConfirmBooking && !staffProfile.canCancelBooking && (
                        <p className="text-xs text-muted-foreground text-center italic">
                          Sem permissão para gerenciar agendamentos
                        </p>
                      )}
                    </div>
                  )}

                  {booking.status === "CONFIRMED" && staffProfile?.canCancelBooking && (
                    <Button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={actionLoading === booking.id}
                      variant="outline"
                      className="w-full border-error text-error hover:bg-error/10 gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      {actionLoading === booking.id ? "Cancelando..." : "Cancelar"}
                    </Button>
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
