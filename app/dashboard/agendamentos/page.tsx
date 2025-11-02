"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, User, Phone, Mail, Filter, Search } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  NO_SHOW: { label: "Não compareceu", color: "bg-gray-100 text-gray-800" },
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
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os agendamentos do salão
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </Button>

              <div className="flex items-center gap-2 flex-1 max-w-md ml-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por cliente, serviço ou profissional..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                {/* Status */}
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <Label htmlFor="staffId">Profissional</Label>
                  <select
                    id="staffId"
                    value={filters.staffId}
                    onChange={(e) =>
                      setFilters({ ...filters, staffId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <Label htmlFor="startDate">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                  />
                </div>

                {/* Data Fim */}
                <div>
                  <Label htmlFor="endDate">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{filteredBookings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {filteredBookings.filter((b) => b.status === "PENDING").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-blue-600">
                {filteredBookings.filter((b) => b.status === "CONFIRMED").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Concluídos</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredBookings.filter((b) => b.status === "COMPLETED").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600">Cancelados</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredBookings.filter((b) => b.status === "CANCELLED").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Agendamentos */}
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
              <p className="text-gray-600">
                Tente ajustar os filtros ou aguarde novos agendamentos
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1 space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {booking.staff.name}
                            {booking.staff.specialty && (
                              <span className="text-gray-400">
                                {" "}
                                • {booking.staff.specialty}
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statusConfig[booking.status as keyof typeof statusConfig]
                              ?.color
                          }`}
                        >
                          {
                            statusConfig[booking.status as keyof typeof statusConfig]
                              ?.label
                          }
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(booking.date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(booking.date), "HH:mm")} (
                          {booking.service.duration}min)
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-gray-700">
                          <User className="h-4 w-4" />
                          <span className="font-medium">
                            {booking.client.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 ml-5">
                          <Mail className="h-3 w-3" />
                          {booking.client.email}
                        </div>
                        {booking.client.phone && (
                          <div className="flex items-center gap-1 text-gray-600 ml-5">
                            <Phone className="h-3 w-3" />
                            {booking.client.phone}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">
                          Valor:{" "}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Notas */}
                      {booking.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">
                            Observações:{" "}
                          </span>
                          <span className="text-gray-600">{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {booking.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(booking.id, "CONFIRMED")
                            }
                            className="w-full"
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(booking.id, "CANCELLED")
                            }
                            className="w-full text-red-600 hover:text-red-700"
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(booking.id, "COMPLETED")
                            }
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            Marcar Concluído
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(booking.id, "NO_SHOW")
                            }
                            className="w-full"
                          >
                            Não Compareceu
                          </Button>
                        </>
                      )}
                      {(booking.status === "COMPLETED" ||
                        booking.status === "CANCELLED" ||
                        booking.status === "NO_SHOW") && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          Agendamento finalizado
                        </p>
                      )}
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
