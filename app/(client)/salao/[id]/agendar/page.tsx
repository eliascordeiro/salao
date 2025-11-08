"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Badge } from "@/components/ui/badge";
import { GridBackground } from "@/components/ui/grid-background";
import {
  ArrowLeft,
  Check,
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  User,
  Briefcase,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

type Step = 1 | 2 | 3 | 4;

interface Service {
  id: string;
  name: string;
  description?: string | null;
  duration: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  specialty?: string | null;
}

interface Salon {
  id: string;
  name: string;
  phone: string;
  address: string;
  city?: string | null;
  state?: string | null;
}

interface TimeSlot {
  time: string;
  available: boolean;
  isClientConflict?: boolean;
  conflictDetails?: {
    serviceName: string;
    staffName: string;
    duration: number;
  };
}

export default function AgendarSalaoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const salonId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Dados do salão
  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  
  // Seleções do usuário
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  
  // Slots disponíveis
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  // Carregar dados do salão
  useEffect(() => {
    async function loadSalonData() {
      try {
        const response = await fetch(`/api/public/salons/${salonId}`);
        const result = await response.json();
        
        if (result.success) {
          setSalon({
            id: result.data.id,
            name: result.data.name,
            phone: result.data.phone,
            address: result.data.address,
            city: result.data.city,
            state: result.data.state,
          });
          setServices(result.data.services);
          setStaff(result.data.staff);
        } else {
          router.push("/saloes");
        }
      } catch (error) {
        console.error("Erro ao carregar salão:", error);
        router.push("/saloes");
      } finally {
        setLoading(false);
      }
    }
    
    loadSalonData();
  }, [salonId, router]);
  
  // Carregar slots quando data e profissional são selecionados
  useEffect(() => {
    if (selectedDate && selectedStaff && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedStaff, selectedService]);
  
  async function loadAvailableSlots() {
    if (!selectedDate || !selectedStaff || !selectedService) return;
    
    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      console.log("📅 Buscando slots:", { 
        staffId: selectedStaff.id, 
        date: dateStr, 
        serviceId: selectedService.id,
        duration: selectedService.duration 
      });
      
      const response = await fetch(
        `/api/available-slots?staffId=${selectedStaff.id}&date=${dateStr}&serviceId=${selectedService.id}`
      );
      const result = await response.json();
      
      console.log("✅ Resposta da API:", result);
      
      if (result.availableSlots) {
        // Converter array de strings para formato { time, available }
        const slots = result.availableSlots.map((time: string) => ({
          time,
          available: true
        }));
        setAvailableSlots(slots);
      } else if (result.error) {
        console.error("❌ Erro da API:", result.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar horários:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }
  
  // Avançar para próximo passo
  function nextStep() {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  }
  
  // Voltar para passo anterior
  function prevStep() {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  }
  
  // Selecionar serviço
  function handleSelectService(service: Service) {
    setSelectedService(service);
    // Reset seleções posteriores
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime("");
    nextStep();
  }
  
  // Selecionar profissional
  function handleSelectStaff(member: Staff) {
    setSelectedStaff(member);
    // Reset seleções posteriores
    setSelectedDate(null);
    setSelectedTime("");
    nextStep();
  }
  
  // Selecionar data
  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time
  }
  
  // Confirmar agendamento
  async function handleConfirmBooking() {
    // Verificar autenticação
    if (status === "unauthenticated") {
      // Salvar dados no localStorage para recuperar após login
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          salonId,
          serviceId: selectedService?.id,
          staffId: selectedStaff?.id,
          date: selectedDate,
          time: selectedTime,
        })
      );
      router.push("/login?callbackUrl=" + encodeURIComponent(`/salao/${salonId}/agendar`));
      return;
    }
    
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Formatar data e hora separadamente como a API espera
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salonId,
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          date: dateStr,
          time: selectedTime,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Limpar dados salvos
        localStorage.removeItem("pendingBooking");
        // Redirecionar para meus agendamentos
        router.push("/meus-agendamentos?success=true");
      } else {
        alert(result.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }
  
  // Gerar próximos 14 dias
  const next14Days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date;
  });
  
  if (loading) {
    return (
      <GridBackground>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GridBackground>
    );
  }
  
  if (!salon) {
    return null;
  }
  
  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/salao/${salonId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para {salon.name}
          </Button>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Agendar Horário</h1>
            <p className="text-muted-foreground">
              {salon.name} • {salon.city}, {salon.state}
            </p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <GlassCard className="p-6" glow="primary">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                    currentStep >= step
                      ? "bg-gradient-primary text-white shadow-lg shadow-primary/30"
                      : "bg-background-alt border border-border"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`hidden md:block w-16 h-1 rounded-full transition-all ${
                      currentStep > step ? "bg-gradient-primary" : "bg-background-alt"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-4 text-xs text-center text-foreground-muted">
            <span>Serviço</span>
            <span>Profissional</span>
            <span>Data/Hora</span>
            <span>Confirmar</span>
          </div>
        </GlassCard>
        
        {/* Step Content */}
        <div className="space-y-4">
          {/* STEP 1: Escolher Serviço */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <span>Escolha o serviço</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <GlassCard
                    key={service.id}
                    hover
                    glow={selectedService?.id === service.id ? "primary" : undefined}
                    className={`p-6 cursor-pointer group transition-all ${
                      selectedService?.id === service.id
                        ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                        : ""
                    }`}
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      {service.description && (
                        <p className="text-sm text-foreground-muted">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                            <Clock className="h-4 w-4 text-accent" />
                          </div>
                          <span className="text-foreground-muted">{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-xl font-bold text-primary">
                          <span className="text-sm">R$</span>
                          <span>{service.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
          
          {/* STEP 2: Escolher Profissional */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <span>Escolha o profissional</span>
              </div>
              
              {selectedService && (
                <GlassCard className="p-4 bg-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground-muted">Serviço selecionado</p>
                      <p className="font-semibold text-foreground">{selectedService.name}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCurrentStep(1)}
                      className="hover:bg-primary/10"
                    >
                      Alterar
                    </Button>
                  </div>
                </GlassCard>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((member) => (
                  <GlassCard
                    key={member.id}
                    hover
                    glow={selectedStaff?.id === member.id ? "primary" : undefined}
                    className={`p-6 cursor-pointer group transition-all ${
                      selectedStaff?.id === member.id
                        ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                        : ""
                    }`}
                    onClick={() => handleSelectStaff(member)}
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {member.name}
                      </h3>
                      {member.specialty && (
                        <p className="text-sm text-foreground-muted">
                          {member.specialty}
                        </p>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                onClick={prevStep} 
                className="w-full glass-card hover:bg-background-alt"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          )}
          
          {/* STEP 3: Escolher Data e Hora */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <span>Escolha data e horário</span>
              </div>
              
              {/* Resumo */}
              <GlassCard className="p-4 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between pb-2">
                  <div>
                    <p className="text-sm text-foreground-muted">Serviço</p>
                    <p className="font-semibold text-foreground">{selectedService?.name}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep(1)}
                    className="hover:bg-primary/10"
                  >
                    Alterar
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-sm text-foreground-muted">Profissional</p>
                    <p className="font-semibold text-foreground">{selectedStaff?.name}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCurrentStep(2)}
                    className="hover:bg-primary/10"
                  >
                    Alterar
                  </Button>
                </div>
              </GlassCard>
              
              {/* Seletor de Data */}
              <div>
                <p className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Selecione a data
                </p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {next14Days.map((date) => {
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <Button
                        key={date.toISOString()}
                        variant={isSelected ? "default" : "outline"}
                        className={`flex flex-col h-auto py-3 transition-all ${
                          isSelected 
                            ? "bg-gradient-primary text-white shadow-lg shadow-primary/30" 
                            : "glass-card hover:bg-background-alt hover:border-primary/30"
                        }`}
                        onClick={() => handleSelectDate(date)}
                      >
                        <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-foreground-muted'}`}>
                          {format(date, "EEE", { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold my-1">
                          {format(date, "dd", { locale: ptBR })}
                        </span>
                        <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-foreground-muted'}`}>
                          {format(date, "MMM", { locale: ptBR })}
                        </span>
                        {isToday && (
                          <Badge className={`mt-1 text-[10px] px-2 py-0.5 ${
                            isSelected 
                              ? 'bg-white/20 text-white border-white/30' 
                              : 'bg-primary/20 text-primary border-primary/30'
                          }`}>
                            Hoje
                          </Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Seletor de Horário */}
              {selectedDate && (
                <div>
                  <p className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    Selecione o horário
                  </p>
                  
                  {loadingSlots ? (
                    <GlassCard className="p-10">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    </GlassCard>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`h-auto py-3 ${
                            selectedTime === slot.time 
                              ? "bg-gradient-primary text-white shadow-lg shadow-primary/30" 
                              : "glass-card hover:bg-background-alt"
                          } ${
                            !slot.available ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <GlassCard className="p-8 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-foreground-muted/10 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-foreground-muted" />
                      </div>
                      <p className="text-sm text-foreground-muted">
                        Nenhum horário disponível para esta data
                      </p>
                    </GlassCard>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={prevStep} 
                  className="flex-1 glass-card hover:bg-background-alt"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <GradientButton
                  variant="primary"
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 group"
                >
                  Continuar
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </div>
            </div>
          )}
          
          {/* STEP 4: Confirmar */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center gap-3 text-lg font-semibold">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center">
                  <Check className="h-5 w-5 text-success" />
                </div>
                <span>Confirmar agendamento</span>
              </div>
              
              <GlassCard className="p-6 space-y-6" glow="primary">
                <div className="text-center pb-4 border-b border-border">
                  <h3 className="text-2xl font-bold text-foreground">{salon.name}</h3>
                  <p className="text-sm text-foreground-muted mt-1">
                    {salon.address} • {salon.city}, {salon.state}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Serviço</p>
                      <p className="font-semibold text-lg text-foreground">{selectedService?.name}</p>
                      <p className="text-sm text-foreground-muted mt-1">
                        {selectedService?.duration} minutos • R$ {selectedService?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5">
                    <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Profissional</p>
                      <p className="font-semibold text-lg text-foreground">{selectedStaff?.name}</p>
                      {selectedStaff?.specialty && (
                        <p className="text-sm text-foreground-muted mt-1">
                          {selectedStaff.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-success/5">
                    <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">Data e horário</p>
                      <p className="font-semibold text-lg text-foreground">
                        {selectedDate &&
                          format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                      </p>
                      <p className="text-sm text-foreground-muted mt-1">
                        às {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                {status === "unauthenticated" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                          Login necessário
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                          Você será redirecionado para fazer login antes de confirmar
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
              
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={prevStep} 
                  className="flex-1 glass-card hover:bg-background-alt"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
                <GradientButton
                  variant="success"
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                  className="flex-1 group"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Confirmar Agendamento
                    </>
                  )}
                </GradientButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </GridBackground>
  );
}
