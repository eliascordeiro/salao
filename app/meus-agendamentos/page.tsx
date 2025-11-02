"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function MyBookingsPage() {
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <p className="text-green-800">
              Agendamento criado com sucesso! Aguarde a confirmação.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Meus Agendamentos
            </h1>
            <p className="text-gray-600 mt-2">
              Gerencie seus agendamentos e horários
            </p>
          </div>
          <Link href="/servicos">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setFilter("upcoming")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === "upcoming"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Próximos
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {
                    filterBookings(bookings).filter((b) =>
                      ["PENDING", "CONFIRMED"].includes(b.status)
                    ).length
                  }
                </span>
              </button>
              <button
                onClick={() => setFilter("past")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === "past"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Anteriores
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {
                    bookings.filter((b) => {
                      const bookingDate = new Date(b.date);
                      return bookingDate < new Date() || b.status === "COMPLETED";
                    }).length
                  }
                </span>
              </button>
              <button
                onClick={() => setFilter("cancelled")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  filter === "cancelled"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Cancelados
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {
                    bookings.filter(
                      (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
                    ).length
                  }
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando agendamentos...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === "upcoming" &&
                  "Você não tem agendamentos futuros no momento."}
                {filter === "past" && "Você não tem agendamentos anteriores."}
                {filter === "cancelled" && "Você não tem agendamentos cancelados."}
              </p>
              <Link href="/servicos">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Fazer um Agendamento
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="mb-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            STATUS_LABELS[booking.status]?.color ||
                            "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {STATUS_LABELS[booking.status]?.label || booking.status}
                        </span>
                      </div>

                      {/* Main Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {booking.service.name}
                          </h3>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span>
                                {format(new Date(booking.date), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })}
                              </span>
                            </div>

                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>
                                {format(new Date(booking.date), "HH:mm")} -{" "}
                                {booking.service.duration} minutos
                              </span>
                            </div>

                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              <span>
                                {booking.staff.name}
                                {booking.staff.specialty && (
                                  <span className="text-gray-400 ml-1">
                                    • {booking.staff.specialty}
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>
                                {booking.salon.name}
                                {booking.salon.address && (
                                  <span className="text-gray-400 ml-1">
                                    • {booking.salon.address}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between">
                          {/* Price */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">Valor Total</p>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {booking.totalPrice.toFixed(2)}
                            </p>
                          </div>

                          {/* Notes */}
                          {booking.notes && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 mb-1">Observações</p>
                              <p className="text-sm text-gray-800">{booking.notes}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="space-y-2">
                            {/* Botão de Pagamento */}
                            {booking.status === "PENDING" &&
                              (!booking.payment ||
                                booking.payment.status === "PENDING" ||
                                booking.payment.status === "FAILED") && (
                                <Link href={`/agendar/checkout/${booking.id}`}>
                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Realizar Pagamento
                                  </Button>
                                </Link>
                              )}

                            {/* Status de Pagamento */}
                            {booking.payment && (
                              <div className="text-xs text-gray-600">
                                Pagamento:{" "}
                                <span
                                  className={`font-medium ${
                                    booking.payment.status === "COMPLETED"
                                      ? "text-green-600"
                                      : booking.payment.status === "FAILED"
                                      ? "text-red-600"
                                      : "text-yellow-600"
                                  }`}
                                >
                                  {booking.payment.status === "COMPLETED"
                                    ? "Confirmado"
                                    : booking.payment.status === "PROCESSING"
                                    ? "Processando"
                                    : booking.payment.status === "FAILED"
                                    ? "Falhou"
                                    : "Pendente"}
                                </span>
                              </div>
                            )}

                            {/* Botão de Cancelamento */}
                            {canCancelBooking(booking) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Agendamento
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
