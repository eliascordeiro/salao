"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
      const response = await fetch(
        `/api/bookings/available-slots?staffId=${selectedStaff.id}&date=${dateStr}&duration=${selectedService.duration}`
      );
      const result = await response.json();
      
      if (result.success) {
        setAvailableSlots(result.slots);
      }
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
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
      // Combinar data e hora
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salonId,
          serviceId: selectedService.id,
          staffId: selectedStaff.id,
          scheduledDate: scheduledDate.toISOString(),
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
        <Card className="p-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                    currentStep >= step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`hidden md:block w-16 h-1 ${
                      currentStep > step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-center text-muted-foreground">
            <span>Serviço</span>
            <span>Profissional</span>
            <span>Data/Hora</span>
            <span>Confirmar</span>
          </div>
        </Card>
        
        {/* Step Content */}
        <div className="space-y-4">
          {/* STEP 1: Escolher Serviço */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Briefcase className="h-5 w-5" />
                <span>Escolha o serviço</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card
                    key={service.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedService?.id === service.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center gap-1 text-lg font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>{service.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          {/* STEP 2: Escolher Profissional */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <User className="h-5 w-5" />
                <span>Escolha o profissional</span>
              </div>
              
              {selectedService && (
                <Card className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço selecionado</p>
                      <p className="font-semibold">{selectedService.name}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                      Alterar
                    </Button>
                  </div>
                </Card>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.map((member) => (
                  <Card
                    key={member.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                      selectedStaff?.id === member.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onClick={() => handleSelectStaff(member)}
                  >
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{member.name}</h3>
                      {member.specialty && (
                        <p className="text-sm text-muted-foreground">
                          {member.specialty}
                        </p>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              
              <Button variant="outline" onClick={prevStep} className="w-full">
                Voltar
              </Button>
            </div>
          )}
          
          {/* STEP 3: Escolher Data e Hora */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="h-5 w-5" />
                <span>Escolha data e horário</span>
              </div>
              
              {/* Resumo */}
              <Card className="p-4 bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Serviço</p>
                    <p className="font-semibold">{selectedService?.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(1)}>
                    Alterar
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Profissional</p>
                    <p className="font-semibold">{selectedStaff?.name}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentStep(2)}>
                    Alterar
                  </Button>
                </div>
              </Card>
              
              {/* Seletor de Data */}
              <div>
                <p className="font-semibold mb-2">Selecione a data</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {next14Days.map((date) => {
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <Button
                        key={date.toISOString()}
                        variant={isSelected ? "default" : "outline"}
                        className="flex flex-col h-auto py-2"
                        onClick={() => handleSelectDate(date)}
                      >
                        <span className="text-xs text-muted-foreground">
                          {format(date, "EEE", { locale: ptBR })}
                        </span>
                        <span className="text-lg font-bold">
                          {format(date, "dd", { locale: ptBR })}
                        </span>
                        <span className="text-xs">
                          {format(date, "MMM", { locale: ptBR })}
                        </span>
                        {isToday && (
                          <Badge className="mt-1 text-[10px] px-1 py-0">Hoje</Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Seletor de Horário */}
              {selectedDate && (
                <div>
                  <p className="font-semibold mb-2">Selecione o horário</p>
                  
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.time}
                          variant={selectedTime === slot.time ? "default" : "outline"}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className="h-auto py-3"
                        >
                          {slot.time}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-6 text-center space-y-2">
                      <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum horário disponível para esta data
                      </p>
                    </Card>
                  )}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={nextStep}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}
          
          {/* STEP 4: Confirmar */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Check className="h-5 w-5" />
                <span>Confirmar agendamento</span>
              </div>
              
              <Card className="p-6 space-y-4">
                <div className="text-center pb-4 border-b">
                  <h3 className="text-2xl font-bold">{salon.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {salon.address} • {salon.city}, {salon.state}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Briefcase className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Serviço</p>
                      <p className="font-semibold">{selectedService?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedService?.duration} minutos • R$ {selectedService?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Profissional</p>
                      <p className="font-semibold">{selectedStaff?.name}</p>
                      {selectedStaff?.specialty && (
                        <p className="text-sm text-muted-foreground">
                          {selectedStaff.specialty}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Data e horário</p>
                      <p className="font-semibold">
                        {selectedDate &&
                          format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        às {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                {status === "unauthenticated" && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-700 dark:text-amber-400">
                          Login necessário
                        </p>
                        <p className="text-sm text-amber-600 dark:text-amber-300">
                          Você será redirecionado para fazer login antes de confirmar
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Voltar
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </GridBackground>
  );
}
