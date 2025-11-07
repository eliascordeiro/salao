"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Package, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { Label } from "@/components/ui/label";
import { DashboardHeader } from "@/components/dashboard/header";
import { CalendarPicker } from "@/components/ui/calendar-picker";

interface Service {
  id: string;
  name: string;
  duration: number; // em minutos
  price: number;
  description?: string;
  active?: boolean;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string;
  salonId?: string;
}

interface AvailableSlot {
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  canFit: boolean;
}

interface TimeOption {
  time: string;
  timeMinutes: number;
  available: boolean;
  reason?: string;
  isClientConflict?: boolean; // NOVO: marca se o cliente já tem agendamento neste horário
  conflictDetails?: {
    serviceName: string;
    staffName: string;
    duration: number;
  };
}

interface ScheduleStatistics {
  total: number;
  available: number;
  occupied: number;
  bookings: number;
}

interface ConflictingBooking {
  serviceName: string;
  staffName: string;
  time: string;
  duration: number;
}

export default function DynamicSchedulePage() {
  const router = useRouter();
  const { data: session } = useSession();
  
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [statistics, setStatistics] = useState<ScheduleStatistics | null>(null);
  
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [error, setError] = useState("");
  const [clientBookings, setClientBookings] = useState<Array<{
    time: string;
    serviceName: string;
    staffName: string;
    duration: number;
  }>>([]);

  // Carregar serviços
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data.filter((s: Service) => s.active !== false));
      }
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  // Carregar profissionais quando um serviço é selecionado
  useEffect(() => {
    if (selectedService) {
      fetchStaffForService(selectedService.id);
    } else {
      setStaff([]);
      setSelectedStaff(null);
    }
  }, [selectedService]);

  // Buscar datas com agendamentos quando staff ou mês mudar
  useEffect(() => {
    if (selectedStaff) {
      fetchDatesWithBookings();
    } else {
      setHighlightedDates([]);
    }
  }, [selectedStaff, currentMonth]);

  const fetchStaffForService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/staff`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data);
      }
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
    }
  };

  const fetchDatesWithBookings = async () => {
    if (!selectedStaff) return;

    try {
      const response = await fetch(
        `/api/schedule/dates-with-bookings?staffId=${selectedStaff.id}&month=${currentMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setHighlightedDates(data.dates || []);
      }
    } catch (error) {
      console.error("Erro ao carregar datas com agendamentos:", error);
    }
  };

  // Buscar horários disponíveis quando serviço, profissional e data são selecionados
  useEffect(() => {
    if (selectedService && selectedStaff && selectedDate) {
      fetchAvailableSchedule();
    } else {
      setAvailableSlots([]);
      setTimeOptions([]);
    }
  }, [selectedService, selectedStaff, selectedDate]);

  const fetchAvailableSchedule = async () => {
    if (!selectedService || !selectedStaff || !selectedDate) return;

    setLoadingSchedule(true);
    setError("");
    
    try {
      const url = `/api/schedule/available?staffId=${selectedStaff.id}&date=${selectedDate}&duration=${selectedService.duration}`;
      console.log("🔍 Buscando horários:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("Erro ao buscar horários disponíveis");
      }

      const data = await response.json();
      console.log("📊 Resposta da API:", data);
      
      if (!data.available) {
        setError(data.message || "Nenhum horário disponível");
        setAvailableSlots([]);
        setTimeOptions([]);
        setStatistics(null);
        return;
      }

      console.log("✅ Horários disponíveis:", data.timeOptions?.filter((t: TimeOption) => t.available).length);
      console.log("❌ Horários ocupados:", data.timeOptions?.filter((t: TimeOption) => !t.available).length);
      console.log("📊 Estatísticas:", data.statistics);

      setAvailableSlots(data.availableSlots);
      
      // Buscar agendamentos do cliente para marcar conflitos
      await fetchClientBookings(selectedDate, data.timeOptions);
      
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error("❌ Erro ao buscar horários:", error);
      setError("Erro ao carregar horários disponíveis");
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Buscar agendamentos do cliente e marcar conflitos nos slots
  const fetchClientBookings = async (date: string, timeSlots: TimeOption[]) => {
    if (!session?.user?.id) {
      console.log("👤 Usuário não logado, exibindo todos os slots sem marcação de conflito");
      setTimeOptions(timeSlots);
      return;
    }

    try {
      console.log("🔍 Buscando agendamentos do cliente para data:", date);
      const response = await fetch(`/api/bookings?clientOnly=true`);
      
      if (!response.ok) {
        console.warn("⚠️ Erro ao buscar agendamentos do cliente, exibindo slots normalmente");
        setTimeOptions(timeSlots);
        return;
      }

      const allBookings = await response.json();
      console.log("📅 Total de agendamentos do cliente:", allBookings.length);
      
      // Filtrar apenas os da data selecionada
      const bookings = allBookings.filter((b: any) => {
        const bookingDate = new Date(b.date);
        const selectedDateObj = new Date(date + "T00:00:00Z");
        return (
          bookingDate.getUTCFullYear() === selectedDateObj.getUTCFullYear() &&
          bookingDate.getUTCMonth() === selectedDateObj.getUTCMonth() &&
          bookingDate.getUTCDate() === selectedDateObj.getUTCDate()
        );
      });
      
      console.log("📅 Agendamentos do cliente na data", date, ":", bookings.length);

      if (!bookings || bookings.length === 0) {
        console.log("✅ Cliente não tem agendamentos nesta data");
        setTimeOptions(timeSlots);
        return;
      }

      // Processar agendamentos do cliente
      const clientBookingsData = bookings
        .filter((b: any) => b.status === "PENDING" || b.status === "CONFIRMED")
        .map((b: any) => {
          const bookingDate = new Date(b.date);
          const hours = bookingDate.getUTCHours();
          const minutes = bookingDate.getUTCMinutes();
          const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
          
          return {
            time,
            startMinutes: hours * 60 + minutes,
            endMinutes: hours * 60 + minutes + b.service.duration,
            serviceName: b.service.name,
            staffName: b.staff.name,
            duration: b.service.duration,
          };
        });

      setClientBookings(clientBookingsData.map((b: any) => ({
        time: b.time,
        serviceName: b.serviceName,
        staffName: b.staffName,
        duration: b.duration,
      })));

      // Marcar slots com conflito do cliente
      const updatedSlots = timeSlots.map(slot => {
        // Verificar se este slot conflita com algum agendamento do cliente
        const conflict = clientBookingsData.find((booking: any) => {
          const slotStart = slot.timeMinutes;
          const slotEnd = slot.timeMinutes + (selectedService?.duration || 0);
          
          // Verificar sobreposição
          const hasOverlap =
            (slotStart >= booking.startMinutes && slotStart < booking.endMinutes) ||
            (slotEnd > booking.startMinutes && slotEnd <= booking.endMinutes) ||
            (slotStart <= booking.startMinutes && slotEnd >= booking.endMinutes);
          
          return hasOverlap;
        });

        if (conflict) {
          return {
            ...slot,
            available: false,
            reason: "Você já possui agendamento neste horário",
            isClientConflict: true,
            conflictDetails: {
              serviceName: conflict.serviceName,
              staffName: conflict.staffName,
              duration: conflict.duration,
            },
          };
        }

        return slot;
      });

      setTimeOptions(updatedSlots);
      console.log("✅ Slots atualizados com", updatedSlots.filter(s => s.isClientConflict).length, "conflitos do cliente");
    } catch (error) {
      console.error("❌ Erro ao buscar agendamentos do cliente:", error);
      // IMPORTANTE: Mesmo com erro, exibir a grade normalmente
      console.log("⚠️ Exibindo grade normalmente apesar do erro");
      setTimeOptions(timeSlots);
    }
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    // Verificar se o horário ainda está disponível
    const timeOption = timeOptions.find((t) => t.time === selectedTime);
    if (!timeOption || !timeOption.available) {
      setError("Este horário não está mais disponível. Por favor, escolha outro.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Usar salonId do staff selecionado ou fallback
      const salonId = selectedStaff.salonId || "salon-demo-1";

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          salonId: salonId,
          date: selectedDate, // YYYY-MM-DD
          time: selectedTime, // HH:mm
          notes: `Agendamento dinâmico - Duração: ${selectedService.duration} minutos`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || data.message || "Erro ao criar agendamento");
      }

      const booking = await response.json();
      alert(`✅ Agendamento realizado com sucesso!\n\nCódigo: ${booking.id}`);
      router.push("/meus-agendamentos");
    } catch (error) {
      console.error("Erro ao agendar:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao realizar agendamento"
      );
    } finally {
      setLoading(false);
    }
  };

  // Data mínima: hoje
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        user={session?.user || { name: "", email: "", role: "CLIENT" }}
      />

      <GridBackground>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              Agendamento Dinâmico
            </h1>
            <p className="text-foreground-muted">
              Escolha o serviço e veja os horários disponíveis em tempo real
            </p>
          </div>

          <div className="space-y-6">
            {/* Passo 1: Selecionar Serviço */}
            <GlassCard glow="primary" className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  1. Escolha o Serviço
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      setSelectedStaff(null);
                      setSelectedDate("");
                      setSelectedTime("");
                    }}
                    className={`p-4 rounded-lg border-2 transition text-left ${
                      selectedService?.id === service.id
                        ? "border-primary bg-primary/10"
                        : "border-primary/20 hover:border-primary/50 hover:bg-background-alt/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground">{service.name}</div>
                    <div className="text-sm text-foreground-muted mt-1">
                      ⏱️ {service.duration} min • 💰 R$ {service.price.toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </GlassCard>

            {/* Passo 2: Selecionar Profissional */}
            {selectedService && (
              <GlassCard glow="accent" className="p-6 animate-fadeInUp">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-accent" />
                    2. Escolha o Profissional
                  </h2>
                </div>
                {staff.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {staff.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setSelectedStaff(s);
                          setSelectedDate("");
                          setSelectedTime("");
                        }}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          selectedStaff?.id === s.id
                            ? "border-accent bg-accent/10"
                            : "border-accent/20 hover:border-accent/50 hover:bg-background-alt/50"
                        }`}
                      >
                        <div className="font-semibold text-foreground">{s.name}</div>
                        {s.specialty && (
                          <div className="text-sm text-foreground-muted mt-1">
                            {s.specialty}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-foreground-muted">Nenhum profissional disponível para este serviço</p>
                )}
              </GlassCard>
            )}

            {/* Passo 3: Selecionar Data */}
            {selectedService && selectedStaff && (
              <GlassCard glow="success" className="p-6 animate-fadeInUp">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-success" />
                    3. Escolha a Data
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    Selecione um dia no calendário para ver os horários disponíveis
                  </p>
                </div>
                
                <CalendarPicker
                  selectedDate={selectedDate}
                  onDateSelect={(date) => {
                    setSelectedDate(date);
                    setSelectedTime("");
                  }}
                  minDate={today}
                  maxDate={(() => {
                    // Máximo: 90 dias a partir de hoje
                    const max = new Date();
                    max.setDate(max.getDate() + 90);
                    return max.toISOString().split("T")[0];
                  })()}
                  highlightedDates={highlightedDates}
                  onMonthChange={(month) => {
                    setCurrentMonth(month);
                  }}
                />
              </GlassCard>
            )}

            {/* Passo 4: Visualizar Agenda e Selecionar Horário */}
            {selectedService && selectedStaff && selectedDate && (
              <GlassCard glow="primary" className="p-6 animate-fadeInUp">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    4. Escolha o Horário
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    Serviço: <strong>{selectedService.name}</strong> (Duração: {selectedService.duration} min)
                  </p>
                  
                  {/* Estatísticas da agenda */}
                  {statistics && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        📅 <strong>{statistics.bookings}</strong> {statistics.bookings === 1 ? "agendamento" : "agendamentos"} hoje
                      </span>
                      <span className="flex items-center gap-1">
                        ✅ <strong>{statistics.available}</strong> disponíveis
                      </span>
                      <span className="flex items-center gap-1">
                        ❌ <strong>{statistics.occupied}</strong> ocupados
                      </span>
                    </div>
                  )}
                </div>

                {loadingSchedule ? (
                  <div className="flex items-center justify-center py-8">
                    <Sparkles className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : error ? (
                  <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span>{error}</span>
                  </div>
                ) : (
                  <>
                    {/* Estatísticas da Grade */}
                    {timeOptions.length > 0 && (
                      <div className="mb-4 p-3 rounded-lg bg-background-alt/50 border border-primary/10">
                        <div className="flex items-center justify-between text-xs text-foreground-muted">
                          <span>
                            ✅ Disponíveis: <strong className="text-success">{timeOptions.filter(t => t.available).length}</strong>
                          </span>
                          <span>
                            ❌ Ocupados: <strong className="text-destructive">{timeOptions.filter(t => !t.available).length}</strong>
                          </span>
                          <span>
                            📊 Total: <strong className="text-foreground">{timeOptions.length}</strong>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Horários Específicos */}
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      🕐 Grade de Horários (clique para selecionar):
                    </h3>
                    
                    {/* Legenda */}
                    <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-success/30 bg-success/5"></div>
                        <span className="text-foreground-muted">Disponível</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-primary bg-primary/20"></div>
                        <span className="text-foreground-muted">Selecionado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-destructive/40 bg-destructive/10"></div>
                        <span className="text-foreground-muted">Profissional ocupado</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-orange-500/40 bg-orange-500/10"></div>
                        <span className="text-foreground-muted">Você já tem agendamento</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded border-2 border-foreground-muted/20 bg-background-alt/30"></div>
                        <span className="text-foreground-muted">Indisponível</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
                      {timeOptions.map((option) => {
                        // Definir cor baseado no motivo de indisponibilidade
                        const isBooked = option.reason === "Já possui agendamento";
                        const isLunch = option.reason === "Horário de almoço";
                        const isClientConflict = option.isClientConflict === true;
                        
                        return (
                          <div key={option.time} className="relative group">
                            <button
                              onClick={() => option.available && setSelectedTime(option.time)}
                              disabled={!option.available}
                              className={`
                                w-full relative p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium
                                ${selectedTime === option.time
                                  ? "border-primary bg-primary/20 text-primary shadow-lg shadow-primary/30 scale-105"
                                  : option.available
                                  ? "border-success/30 bg-success/5 text-foreground hover:border-success hover:bg-success/10 hover:scale-105"
                                  : isClientConflict
                                  ? "border-orange-500/40 bg-orange-500/10 text-orange-600/70 cursor-not-allowed"
                                  : isBooked
                                  ? "border-destructive/40 bg-destructive/10 text-destructive/70 cursor-not-allowed"
                                  : isLunch
                                  ? "border-amber-500/40 bg-amber-500/10 text-amber-600/70 cursor-not-allowed"
                                  : "border-foreground-muted/20 bg-background-alt/30 text-foreground-muted/50 cursor-not-allowed opacity-40"
                                }
                              `}
                            >
                              {option.time}
                              
                              {/* Indicador visual no canto */}
                              {!option.available && (
                                <span className="absolute top-0.5 right-0.5 text-[8px]">
                                  {isClientConflict ? "🟠" : isBooked ? "🔴" : isLunch ? "🍽️" : "⚫"}
                                </span>
                              )}
                              
                              {/* Checkmark para horário selecionado */}
                              {selectedTime === option.time && (
                                <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-primary bg-background rounded-full" />
                              )}
                            </button>

                            {/* Tooltip para conflito do cliente */}
                            {isClientConflict && option.conflictDetails && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background border-2 border-orange-500/40 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                <div className="text-xs space-y-1">
                                  <p className="font-bold text-orange-500 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Você já tem agendamento
                                  </p>
                                  <p className="text-foreground-muted">
                                    <strong className="text-foreground">Serviço:</strong> {option.conflictDetails.serviceName}
                                  </p>
                                  <p className="text-foreground-muted">
                                    <strong className="text-foreground">Profissional:</strong> {option.conflictDetails.staffName}
                                  </p>
                                  <p className="text-foreground-muted">
                                    <strong className="text-foreground">Duração:</strong> {option.conflictDetails.duration} min
                                  </p>
                                </div>
                                {/* Seta do tooltip */}
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-orange-500/40"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {timeOptions.every((t) => !t.available) && (
                      <p className="text-sm text-destructive mt-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Nenhum horário disponível para este serviço nesta data
                      </p>
                    )}
                  </>
                )}
              </GlassCard>
            )}

            {/* Resumo e Confirmação */}
            {selectedService && selectedStaff && selectedDate && selectedTime && (
              <GlassCard glow="accent" className="p-6 animate-fadeInUp">
                <h2 className="text-xl font-bold text-foreground mb-4">📋 Resumo do Agendamento</h2>
                <div className="space-y-2 text-sm">
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Serviço:</strong> {selectedService.name}
                  </p>
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Profissional:</strong> {selectedStaff.name}
                  </p>
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Data:</strong>{" "}
                    {new Date(selectedDate).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Horário:</strong> {selectedTime}
                  </p>
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Duração:</strong> {selectedService.duration} minutos
                  </p>
                  <p className="text-foreground-muted">
                    <strong className="text-foreground">Término previsto:</strong>{" "}
                    {(() => {
                      const [hours, minutes] = selectedTime.split(":").map(Number);
                      const endMinutes = hours * 60 + minutes + selectedService.duration;
                      const endHours = Math.floor(endMinutes / 60);
                      const endMins = endMinutes % 60;
                      return `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;
                    })()}
                  </p>
                  <p className="text-lg font-bold text-primary mt-4">
                    Total: R$ {selectedService.price.toFixed(2)}
                  </p>
                </div>

                <GradientButton
                  onClick={handleBooking}
                  variant="success"
                  disabled={loading}
                  className="w-full mt-6"
                >
                  {loading ? (
                    <>
                      <Sparkles className="h-4 w-4 animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar Agendamento
                    </>
                  )}
                </GradientButton>
              </GlassCard>
            )}
          </div>
        </div>
      </GridBackground>
    </div>
  );
}
