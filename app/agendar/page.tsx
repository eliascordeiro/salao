"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  User,
  DollarSign,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string;
}

interface BookingData {
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  notes: string;
}

const STEPS = [
  { id: 1, name: "Serviço", icon: Calendar },
  { id: 2, name: "Profissional", icon: User },
  { id: 3, name: "Data & Hora", icon: Clock },
  { id: 4, name: "Confirmação", icon: Check },
];

function BookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [currentStep, setCurrentStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [bookingData, setBookingData] = useState<BookingData>({
    serviceId: searchParams?.get("serviceId") || "",
    staffId: "",
    date: "",
    time: "",
    notes: "",
  });

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  // Carregar serviços
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services?activeOnly=true");
        const data = await response.json();
        
        if (response.ok) {
          // A API já retorna apenas serviços ativos
          setServices(data);

          // Se já tem serviceId na URL, carregar os detalhes
          if (bookingData.serviceId) {
            const service = data.find((s: any) => s.id === bookingData.serviceId);
            if (service) {
              setSelectedService(service);
            }
          }
        } else {
          console.error("Erro ao carregar serviços:", data.error);
          setServices([]);
        }
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        setServices([]);
      }
    };

    fetchServices();
  }, []);

  // Carregar profissionais quando selecionar serviço
  useEffect(() => {
    if (!bookingData.serviceId) return;

    const fetchStaff = async () => {
      try {
        const response = await fetch(
          `/api/services/${bookingData.serviceId}/staff`
        );
        const data = await response.json();
        setStaff(data.filter((s: any) => s.isActive));
      } catch (error) {
        console.error("Erro ao carregar profissionais:", error);
      }
    };

    fetchStaff();
  }, [bookingData.serviceId]);

  // Carregar horários disponíveis quando selecionar profissional e data
  useEffect(() => {
    if (!bookingData.staffId || !bookingData.date || !bookingData.serviceId)
      return;

    const fetchAvailableSlots = async () => {
      setLoading(true);
      try {
        console.log('[agendar] Buscando slots disponíveis:', {
          staffId: bookingData.staffId,
          date: bookingData.date,
          serviceId: bookingData.serviceId,
        });

        const response = await fetch(
          `/api/available-slots?staffId=${bookingData.staffId}&date=${bookingData.date}&serviceId=${bookingData.serviceId}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('[agendar] Erro na resposta da API:', errorData);
          setAvailableSlots([]);
          return;
        }

        const data = await response.json();
        console.log('[agendar] Resposta da API:', data);
        
        // A API retorna { availableSlots: [...] }
        if (data && Array.isArray(data.availableSlots)) {
          console.log('[agendar] Slots disponíveis:', data.availableSlots.length);
          setAvailableSlots(data.availableSlots);
        } else {
          console.error('[agendar] Formato de resposta inválido:', data);
          setAvailableSlots([]);
        }
      } catch (error) {
        console.error('[agendar] Erro ao carregar horários:', error);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [bookingData.staffId, bookingData.date, bookingData.serviceId]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setBookingData({ ...bookingData, serviceId: service.id });
    handleNext();
  };

  const handleStaffSelect = (staffMember: Staff) => {
    setSelectedStaff(staffMember);
    setBookingData({ ...bookingData, staffId: staffMember.id });
    handleNext();
  };

  const handleDateSelect = (date: string) => {
    setBookingData({ ...bookingData, date, time: "" });
  };

  const handleTimeSelect = (time: string) => {
    setBookingData({ ...bookingData, time });
    handleNext();
  };

  const handleSubmit = async () => {
    if (!session?.user?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        serviceId: bookingData.serviceId,
        staffId: bookingData.staffId,
        salonId: "salon-demo-1", // ID do salão padrão
        date: bookingData.date,
        time: bookingData.time,
        notes: bookingData.notes,
      };
      
      console.log("[agendar] Enviando dados do agendamento:", payload);
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[agendar] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[agendar] Agendamento criado com sucesso:", data);
        router.push("/meus-agendamentos?success=true");
      } else {
        const error = await response.json();
        console.error("[agendar] Erro na resposta:", error);
        alert(error.details || error.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("[agendar] Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!bookingData.serviceId;
      case 2:
        return !!bookingData.staffId;
      case 3:
        return !!bookingData.date && !!bookingData.time;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Gerar próximos 14 dias
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      date: format(date, "yyyy-MM-dd"),
      label: format(date, "dd/MM", { locale: ptBR }),
      weekday: format(date, "EEE", { locale: ptBR }),
    };
  });

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Progress Steps Railway */}
          <GlassCard className="mb-8 animate-fadeInUp">
            <div className="p-6">
              <div className="flex items-center justify-between gap-2">
                {STEPS.map((step, index) => (
                  <div key={step.id} className="flex-1">
                    <div className="flex items-center">
                      {/* Step Icon */}
                      <div
                        className={`relative flex items-center justify-center w-12 h-12 rounded-xl transition-all ${
                          currentStep >= step.id
                            ? "bg-gradient-primary glow-primary"
                            : "bg-background-alt"
                        }`}
                      >
                        <step.icon 
                          className={`h-6 w-6 transition-colors ${
                            currentStep >= step.id ? "text-white" : "text-foreground-muted"
                          }`}
                        />
                        {currentStep > step.id && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Step Label */}
                      <div className="ml-3 hidden sm:block">
                        <p
                          className={`text-sm font-semibold transition-colors ${
                            currentStep >= step.id
                              ? "text-primary"
                              : "text-foreground-muted"
                          }`}
                        >
                          {step.name}
                        </p>
                      </div>

                      {/* Connector Line */}
                      {index < STEPS.length - 1 && (
                        <div className="flex-1 mx-3">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              currentStep > step.id 
                                ? "bg-gradient-primary" 
                                : "bg-border"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Step Content Railway */}
          <GlassCard className="animate-fadeInUp" style={{ animationDelay: "200ms" }}>
            <div className="p-8">
              {/* Step Title */}
              <h2 className="text-3xl font-bold text-foreground mb-8">
                {currentStep === 1 && (
                  <AnimatedText gradient="primary">Escolha o Serviço</AnimatedText>
                )}
                {currentStep === 2 && (
                  <AnimatedText gradient="accent">Escolha o Profissional</AnimatedText>
                )}
                {currentStep === 3 && (
                  <AnimatedText gradient="primary">Escolha Data e Horário</AnimatedText>
                )}
                {currentStep === 4 && (
                  <AnimatedText gradient="accent">Confirme seu Agendamento</AnimatedText>
                )}
              </h2>

              {/* Step 1: Serviço Railway */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  {services.map((service, index) => (
                    <div
                      key={service.id}
                      className={`group relative p-6 rounded-xl cursor-pointer transition-all animate-fadeInUp ${
                        bookingData.serviceId === service.id
                          ? "bg-gradient-primary glow-primary"
                          : "bg-background-alt border border-border hover:border-primary hover:glow-primary"
                      }`}
                      style={{ animationDelay: `${300 + index * 100}ms` }}
                      onClick={() => handleServiceSelect(service)}
                    >
                      <div className="flex justify-between items-start gap-6">
                        <div className="flex-1">
                          <h3 className={`font-bold text-xl mb-2 transition-colors ${
                            bookingData.serviceId === service.id
                              ? "text-white"
                              : "text-foreground group-hover:text-primary"
                          }`}>
                            {service.name}
                          </h3>
                          
                          {service.description && (
                            <p className={`text-sm mb-4 transition-colors ${
                              bookingData.serviceId === service.id
                                ? "text-white/80"
                                : "text-foreground-muted"
                            }`}>
                              {service.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-6">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                              bookingData.serviceId === service.id
                                ? "bg-white/20"
                                : "bg-accent/20"
                            }`}>
                              <Clock className={`h-4 w-4 ${
                                bookingData.serviceId === service.id ? "text-white" : "text-accent"
                              }`} />
                              <span className={`text-sm font-medium ${
                                bookingData.serviceId === service.id ? "text-white" : "text-foreground"
                              }`}>
                                {service.duration} min
                              </span>
                            </div>
                            
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                              bookingData.serviceId === service.id
                                ? "bg-white/20"
                                : "bg-success/20"
                            }`}>
                              <DollarSign className={`h-4 w-4 ${
                                bookingData.serviceId === service.id ? "text-white" : "text-success"
                              }`} />
                              <span className={`text-sm font-bold ${
                                bookingData.serviceId === service.id ? "text-white" : "text-success"
                              }`}>
                                R$ {service.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {bookingData.serviceId === service.id && (
                          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center animate-pulseGlow">
                            <Check className="h-6 w-6 text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Step 2: Profissional Railway */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  {staff.length === 0 ? (
                    <div className="text-center py-16">
                      <User className="h-16 w-16 text-foreground-muted mx-auto mb-4 opacity-50" />
                      <p className="text-foreground-muted text-lg">
                        Nenhum profissional disponível para este serviço
                      </p>
                    </div>
                  ) : (
                    staff.map((staffMember, index) => (
                      <div
                        key={staffMember.id}
                        className={`group relative p-6 rounded-xl cursor-pointer transition-all animate-fadeInUp ${
                          bookingData.staffId === staffMember.id
                            ? "bg-gradient-accent glow-accent"
                            : "bg-background-alt border border-border hover:border-accent hover:glow-accent"
                        }`}
                        style={{ animationDelay: `${300 + index * 100}ms` }}
                        onClick={() => handleStaffSelect(staffMember)}
                      >
                        <div className="flex justify-between items-center gap-6">
                          <div className="flex items-center gap-4 flex-1">
                            {/* Avatar */}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                              bookingData.staffId === staffMember.id
                                ? "bg-white/20"
                                : "bg-primary/20 group-hover:bg-accent/30"
                            }`}>
                              <User className={`h-8 w-8 ${
                                bookingData.staffId === staffMember.id
                                  ? "text-white"
                                  : "text-primary group-hover:text-accent"
                              }`} />
                            </div>
                            
                            <div className="flex-1">
                              <h3 className={`font-bold text-xl mb-1 transition-colors ${
                                bookingData.staffId === staffMember.id
                                  ? "text-white"
                                  : "text-foreground group-hover:text-accent"
                              }`}>
                                {staffMember.name}
                              </h3>
                              
                              {staffMember.specialty && (
                                <p className={`text-sm transition-colors ${
                                  bookingData.staffId === staffMember.id
                                    ? "text-white/80"
                                    : "text-foreground-muted"
                                }`}>
                                  {staffMember.specialty}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {bookingData.staffId === staffMember.id && (
                            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center animate-pulseGlow">
                              <Check className="h-6 w-6 text-accent" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Step 3: Data e Hora Railway */}
              {currentStep === 3 && (
                <div className="space-y-8">
                  {/* Seleção de Data */}
                  <div>
                    <Label className="mb-4 block text-lg font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Escolha a Data
                    </Label>
                    <div className="grid grid-cols-7 gap-3">
                      {availableDates.map((day, index) => (
                        <button
                          key={day.date}
                          onClick={() => handleDateSelect(day.date)}
                          className={`group p-4 rounded-xl text-center transition-all animate-fadeInUp ${
                            bookingData.date === day.date
                              ? "bg-gradient-primary glow-primary"
                              : "bg-background-alt border border-border hover:border-primary hover:glow-primary"
                          }`}
                          style={{ animationDelay: `${300 + index * 50}ms` }}
                        >
                          <div className={`text-xs font-medium mb-1 transition-colors ${
                            bookingData.date === day.date
                              ? "text-white/80"
                              : "text-foreground-muted"
                          }`}>
                            {day.weekday}
                          </div>
                          <div className={`font-bold text-lg transition-colors ${
                            bookingData.date === day.date
                              ? "text-white"
                              : "text-foreground group-hover:text-primary"
                          }`}>
                            {day.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seleção de Hora */}
                  {bookingData.date && (
                    <div>
                      <Label className="mb-4 block text-lg font-semibold text-foreground flex items-center gap-2">
                        <Clock className="h-5 w-5 text-accent" />
                        Escolha o Horário
                      </Label>
                      {loading ? (
                        <div className="text-center py-16">
                          <div className="animate-pulseGlow inline-block">
                            <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                            <p className="text-foreground-muted text-lg">Carregando horários disponíveis...</p>
                          </div>
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <div className="text-center py-16">
                          <AlertCircle className="h-16 w-16 text-foreground-muted mx-auto mb-4 opacity-50" />
                          <p className="text-foreground-muted text-lg">
                            Nenhum horário disponível para esta data
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                          {availableSlots.map((slot, index) => (
                            <button
                              key={slot}
                              onClick={() => handleTimeSelect(slot)}
                              className={`group p-4 rounded-xl text-center font-semibold transition-all animate-fadeInUp ${
                                bookingData.time === slot
                                  ? "bg-gradient-accent glow-accent text-white"
                                  : "bg-background-alt border border-border hover:border-accent hover:glow-accent text-foreground hover:text-accent"
                              }`}
                              style={{ animationDelay: `${300 + index * 30}ms` }}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Step 4: Confirmação Railway */}
              {currentStep === 4 && (
                <div className="space-y-8">
                  {/* Resumo do Agendamento */}
                  <div className="bg-background-alt border border-success/30 p-8 rounded-2xl space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                          Serviço
                        </h3>
                        <p className="text-2xl font-bold text-foreground">{selectedService?.name}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                          Profissional
                        </h3>
                        <p className="text-2xl font-bold text-foreground">{selectedStaff?.name}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                            Data
                          </h3>
                          <p className="text-xl font-bold text-foreground">
                            {format(new Date(bookingData.date), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <Clock className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                            Horário
                          </h3>
                          <p className="text-xl font-bold text-foreground">{bookingData.time}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-success" />
                          </div>
                          <h3 className="text-lg font-medium text-foreground-muted">Valor Total</h3>
                        </div>
                        <p className="text-4xl font-bold text-success">
                          R$ {selectedService?.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Campo de Observações */}
                  <div>
                    <Label htmlFor="notes" className="text-lg font-semibold text-foreground flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-foreground-muted" />
                      Observações (opcional)
                    </Label>
                    <Input
                      id="notes"
                      placeholder="Digite alguma observação ou preferência..."
                      value={bookingData.notes}
                      onChange={(e) =>
                        setBookingData({ ...bookingData, notes: e.target.value })
                      }
                      className="bg-background-alt border-border focus:border-primary"
                    />
                  </div>

                  <div className="bg-warning/10 border border-warning/30 p-6 rounded-xl">
                    <p className="text-sm text-foreground flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-warning">Atenção:</strong> Seu agendamento será confirmado após
                        análise. Você receberá uma notificação em breve.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Navigation Buttons Railway */}
          <div className="flex justify-between mt-8 gap-4">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`group px-6 py-3 rounded-xl font-medium transition-all ${
                currentStep === 1
                  ? "bg-background-alt text-foreground-muted cursor-not-allowed"
                  : "bg-background-alt border border-border text-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <ChevronLeft className="h-5 w-5 mr-2 inline-block group-hover:-translate-x-1 transition-transform" />
              Voltar
            </button>

            {currentStep < 4 ? (
              <GradientButton
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                className={!canProceed() ? "opacity-50 cursor-not-allowed" : ""}
              >
                Próximo
                <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            ) : (
              <GradientButton
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
                className={`min-w-[200px] ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {submitting ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar Agendamento
                    <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </GradientButton>
            )}
          </div>
        </div>
      </GridBackground>
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <GridBackground>
          <div className="container mx-auto px-4 py-20">
            <GlassCard className="max-w-md mx-auto text-center py-16">
              <div className="animate-pulseGlow inline-block mb-6">
                <Sparkles className="h-16 w-16 text-primary mx-auto" />
              </div>
              <p className="text-xl text-foreground-muted font-medium">
                Preparando agendamento...
              </p>
            </GlassCard>
          </div>
        </GridBackground>
      </div>
    }>
      <BookingContent />
    </Suspense>
  );
}
