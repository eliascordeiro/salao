"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Badge } from "@/components/ui/badge";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  workDays?: string | null;     // ← ADICIONADO (ex: "1,2,3,4,5")
  workStart?: string | null;    // ← ADICIONADO
  workEnd?: string | null;      // ← ADICIONADO
  services?: {                  // ← ADICIONADO: relação N:N
    service: {
      id: string;
    };
  }[];
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
  timeMinutes?: number;
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
  const [notes, setNotes] = useState<string>(""); // Campo de observações
  
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
  
  // Restaurar agendamento pendente após login
  useEffect(() => {
    // Aguardar dados do salão serem carregados
    if (loading || !services.length || !staff.length) return;
    
    // Verificar se há agendamento pendente
    const pendingBookingStr = localStorage.getItem("pendingBooking");
    if (!pendingBookingStr) return;
    
    try {
      const pendingBooking = JSON.parse(pendingBookingStr);
      
      // Verificar se é para este salão
      if (pendingBooking.salonId !== salonId) return;
      
      console.log("🔄 Restaurando agendamento pendente:", pendingBooking);
      
      // Restaurar serviço selecionado
      const service = services.find((s) => s.id === pendingBooking.serviceId);
      if (service) {
        setSelectedService(service);
        console.log("✅ Serviço restaurado:", service.name);
      }
      
      // Restaurar profissional selecionado
      const staffMember = staff.find((s) => s.id === pendingBooking.staffId);
      if (staffMember) {
        setSelectedStaff(staffMember);
        console.log("✅ Profissional restaurado:", staffMember.name);
      }
      
      // Restaurar data selecionada
      if (pendingBooking.date) {
        const date = new Date(pendingBooking.date);
        setSelectedDate(date);
        console.log("✅ Data restaurada:", format(date, "dd/MM/yyyy", { locale: ptBR }));
      }
      
      // Restaurar horário selecionado
      if (pendingBooking.time) {
        setSelectedTime(pendingBooking.time);
        console.log("✅ Horário restaurado:", pendingBooking.time);
      }
      
      // Ir para o passo de confirmação (passo 4)
      if (service && staffMember && pendingBooking.date && pendingBooking.time) {
        setCurrentStep(4);
        console.log("✅ Indo para confirmação (passo 4)");
      } else if (service && staffMember && pendingBooking.date) {
        setCurrentStep(3); // Escolher horário
        console.log("✅ Indo para escolha de horário (passo 3)");
      } else if (service && staffMember) {
        setCurrentStep(3); // Escolher data
        console.log("✅ Indo para escolha de data (passo 3)");
      } else if (service) {
        setCurrentStep(2); // Escolher profissional
        console.log("✅ Indo para escolha de profissional (passo 2)");
      }
      
      // Limpar localStorage
      localStorage.removeItem("pendingBooking");
      console.log("🗑️ Agendamento pendente removido do localStorage");
      
    } catch (error) {
      console.error("❌ Erro ao restaurar agendamento pendente:", error);
      localStorage.removeItem("pendingBooking");
    }
  }, [loading, services, staff, salonId]);
  
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
      console.log("📊 Quantidade de slots:", result.availableSlots?.length || 0);
      
      if (result.availableSlots && result.availableSlots.length > 0) {
        console.log("🕒 Primeiros 5 slots:", result.availableSlots.slice(0, 5));
        
        // Converter array de strings para formato { time, available, timeMinutes }
        const slots = result.availableSlots.map((time: string) => {
          const [hours, minutes] = time.split(':').map(Number);
          return {
            time,
            timeMinutes: hours * 60 + minutes,
            available: true
          };
        });
        
        // Buscar agendamentos do cliente e marcar conflitos
        await fetchClientBookings(dateStr, slots);
      } else if (result.message) {
        console.warn("⚠️ Mensagem da API:", result.message);
        setAvailableSlots([]);
      } else if (result.error) {
        console.error("❌ Erro da API:", result.error);
        setAvailableSlots([]);
      } else {
        console.warn("⚠️ Nenhum slot disponível");
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar horários:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }
  
  // Buscar agendamentos do cliente e marcar conflitos nos slots
  async function fetchClientBookings(date: string, timeSlots: TimeSlot[]) {
    if (!session?.user?.id) {
      console.log("👤 Usuário não logado, exibindo todos os slots sem marcação de conflito");
      setAvailableSlots(timeSlots);
      return;
    }

    try {
      console.log("🔍 Buscando agendamentos do cliente para data:", date);
      const response = await fetch(`/api/bookings?clientOnly=true`);
      
      if (!response.ok) {
        console.warn("⚠️ Erro ao buscar agendamentos do cliente, exibindo slots normalmente");
        setAvailableSlots(timeSlots);
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
        setAvailableSlots(timeSlots);
        return;
      }

      // Processar agendamentos do cliente
      const clientBookingsData = bookings
        .filter((b: any) => b.status === "PENDING" || b.status === "CONFIRMED")
        .map((b: any) => {
          const bookingDate = new Date(b.date);
          const hours = bookingDate.getHours();
          const minutes = bookingDate.getMinutes();
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

      // Marcar slots com conflito do cliente
      const updatedSlots = timeSlots.map(slot => {
        // Verificar se este slot conflita com algum agendamento do cliente
        const conflict = clientBookingsData.find((booking: any) => {
          const slotStart = slot.timeMinutes || 0;
          const slotEnd = slotStart + (selectedService?.duration || 0);
          
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

      console.log("🟠 Slots marcados com conflito:", updatedSlots.filter(s => s.isClientConflict).length);
      setAvailableSlots(updatedSlots);

    } catch (error) {
      console.error("❌ Erro ao buscar agendamentos do cliente:", error);
      // Em caso de erro, exibir slots normalmente
      setAvailableSlots(timeSlots);
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
      const bookingData = {
        salonId,
        serviceId: selectedService?.id,
        staffId: selectedStaff?.id,
        date: selectedDate,
        time: selectedTime,
      };
      
      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));
      
      console.log("💾 Agendamento salvo para após login:", bookingData);
      
      // Mostrar feedback antes de redirecionar
      const confirmed = window.confirm(
        "Para confirmar seu agendamento, você precisa fazer login.\n\n" +
        "✅ Suas escolhas serão salvas!\n" +
        "Após o login, você voltará direto para a confirmação.\n\n" +
        "Deseja prosseguir para o login?"
      );
      
      if (confirmed) {
        router.push("/login?callbackUrl=" + encodeURIComponent(`/salao/${salonId}/agendar`));
      }
      
      return;
    }
    
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) {
      return;
    }
    
    // Verificar se o horário selecionado tem conflito com agendamento do cliente
    const selectedSlot = availableSlots.find(s => s.time === selectedTime);
    if (selectedSlot?.isClientConflict) {
      alert(
        `⚠️ CONFLITO DE HORÁRIO\n\n` +
        `Você já possui um agendamento neste horário:\n\n` +
        `📅 Serviço: ${selectedSlot.conflictDetails?.serviceName}\n` +
        `👤 Profissional: ${selectedSlot.conflictDetails?.staffName}\n` +
        `⏰ Duração: ${selectedSlot.conflictDetails?.duration} min\n\n` +
        `❌ Não é possível marcar dois serviços no mesmo horário.\n\n` +
        `💡 Escolha outro horário disponível.`
      );
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Formatar data e hora separadamente como a API espera
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      
      const payload = {
        salonId,
        serviceId: selectedService.id,
        staffId: selectedStaff.id,
        date: dateStr,
        time: selectedTime,
        notes: notes || undefined,
      };
      
      console.log("📤 Enviando agendamento:", payload);
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Status da resposta:", response.status);
      
      const result = await response.json();
      
      console.log("📋 Resultado:", result);
      
      // Se status 201 (Created), foi sucesso
      if (response.status === 201 && result.id) {
        console.log("✅ Agendamento criado com sucesso!");
        // Limpar dados salvos
        localStorage.removeItem("pendingBooking");
        // Redirecionar para meus agendamentos
        router.push("/meus-agendamentos?success=true");
      } else {
        // Se chegou aqui, houve erro
        console.error("❌ Erro:", result.error);
        alert(result.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("❌ Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }
  
  // Gerar próximos 15 dias FILTRADOS pelos dias de trabalho do profissional
  const next14Days = (() => {
    if (!selectedStaff) {
      // Se não tem profissional selecionado, mostra todos os dias
      return Array.from({ length: 15 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
      });
    }

    // Buscar dados completos do profissional para pegar workDays
    const staffMember = staff.find(s => s.id === selectedStaff.id);
    const workDays = (staffMember as any)?.workDays;
    
    console.log('🔍 DEBUG next14Days:');
    console.log('  - Profissional:', selectedStaff.name);
    console.log('  - StaffMember encontrado:', !!staffMember);
    console.log('  - WorkDays:', workDays);
    
    if (!workDays) {
      console.log('  ⚠️ WorkDays não encontrado, mostrando todos os dias');
      // Se não tem workDays configurado, mostra todos
      return Array.from({ length: 15 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
      });
    }

    // Converter workDays string "1,2,3,4,5" para array de números
    const workDaysArray = workDays.split(',').map((d: string) => parseInt(d.trim()));
    console.log('  - WorkDays array:', workDaysArray);
    
    // Gerar até conseguir 15 dias que sejam dias de trabalho
    const validDays: Date[] = [];
    let daysChecked = 0;
    const maxDaysToCheck = 60; // Limite de segurança
    
    while (validDays.length < 15 && daysChecked < maxDaysToCheck) {
      const date = new Date();
      date.setDate(date.getDate() + daysChecked);
      const dayOfWeek = date.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
      
      // Se é dia de trabalho, adiciona na lista
      if (workDaysArray.includes(dayOfWeek)) {
        validDays.push(date);
      }
      
      daysChecked++;
    }
    
    console.log('  ✅ Dias gerados:', validDays.length);
    console.log('  - Primeiro dia:', validDays[0]?.toLocaleDateString('pt-BR'));
    console.log('  - Último dia:', validDays[validDays.length - 1]?.toLocaleDateString('pt-BR'));
    
    return validDays;
  })();
  
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl space-y-4 sm:space-y-6">
        {/* Banner para usuários não autenticados */}
        {status === "unauthenticated" && (
          <GlassCard className="p-4 bg-blue-500/10 border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-blue-600 dark:text-blue-400">
                  Login necessário para confirmar
                </h3>
                <p className="text-sm text-foreground-muted">
                  Você pode navegar e escolher seu serviço, profissional, data e horário.
                  <strong className="text-blue-600 dark:text-blue-400"> Suas escolhas serão salvas automaticamente</strong> quando você fizer login para confirmar o agendamento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/login?callbackUrl=" + encodeURIComponent(`/salao/${salonId}/agendar`))}
                  className="mt-2 border-blue-500/30 hover:bg-blue-500/10"
                >
                  Fazer login agora
                </Button>
              </div>
            </div>
          </GlassCard>
        )}
        
        {/* Header */}
        <div className="space-y-3 sm:space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/salao/${salonId}`)}
            className="gap-2 text-sm"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Voltar para {salon.name}</span>
            <span className="xs:hidden">Voltar</span>
          </Button>
          
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold">Agendar Horário</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              {salon.name} • {salon.city}, {salon.state}
            </p>
          </div>
        </div>
        
        {/* Progress Steps */}
        <GlassCard className="p-4 sm:p-6" glow="primary">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-1 sm:gap-2">
                <div
                  className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base font-semibold transition-all ${
                    currentStep >= step
                      ? "bg-gradient-primary text-white shadow-lg shadow-primary/30"
                      : "bg-background-alt border border-border"
                  }`}
                >
                  {currentStep > step ? <Check className="h-5 w-5" /> : step}
                </div>
                {step < 4 && (
                  <div
                    className={`hidden sm:block w-12 md:w-16 h-1 rounded-full transition-all ${
                      currentStep > step ? "bg-gradient-primary" : "bg-background-alt"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-1 sm:gap-2 mt-3 sm:mt-4 text-[10px] sm:text-xs text-center text-foreground-muted">
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
                {staff
                  .filter((member) => {
                    // Filtrar apenas profissionais vinculados ao serviço selecionado
                    if (!selectedService) return true;
                    return member.services?.some(
                      (s) => s.service.id === selectedService.id
                    );
                  })
                  .length === 0 ? (
                    <GlassCard className="p-8 col-span-full">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
                          <AlertCircle className="h-8 w-8 text-warning" />
                        </div>
                        <h3 className="font-semibold text-lg">Nenhum profissional disponível</h3>
                        <p className="text-sm text-foreground-muted max-w-md mx-auto">
                          Não há profissionais vinculados ao serviço <strong>{selectedService?.name}</strong> no momento.
                          Por favor, selecione outro serviço ou entre em contato com o salão.
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => setCurrentStep(1)}
                          className="mt-4"
                        >
                          Escolher outro serviço
                        </Button>
                      </div>
                    </GlassCard>
                  ) : (
                  staff
                  .filter((member) => {
                    // Filtrar apenas profissionais vinculados ao serviço selecionado
                    if (!selectedService) return true;
                    return member.services?.some(
                      (s) => s.service.id === selectedService.id
                    );
                  })
                  .map((member) => (
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
                ))
                )}
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
                <p className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Selecione a data
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {next14Days.map((date) => {
                    const isSelected =
                      selectedDate?.toDateString() === date.toDateString();
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <Button
                        key={date.toISOString()}
                        variant={isSelected ? "default" : "outline"}
                        className={`flex flex-col h-auto py-2 sm:py-3 transition-all ${
                          isSelected 
                            ? "bg-gradient-primary text-white shadow-lg shadow-primary/30" 
                            : "glass-card hover:bg-background-alt hover:border-primary/30"
                        }`}
                        onClick={() => handleSelectDate(date)}
                      >
                        <span className={`text-[10px] sm:text-xs ${isSelected ? 'text-white/70' : 'text-foreground-muted'}`}>
                          {format(date, "EEE", { locale: ptBR })}
                        </span>
                        <span className="text-base sm:text-lg font-bold my-0.5 sm:my-1">
                          {format(date, "dd", { locale: ptBR })}
                        </span>
                        <span className={`text-[10px] sm:text-xs ${isSelected ? 'text-white/70' : 'text-foreground-muted'}`}>
                          {format(date, "MMM", { locale: ptBR })}
                        </span>
                        {isToday && (
                          <Badge className={`mt-1 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 ${
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
                  <p className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    Selecione o horário
                  </p>
                  
                  {loadingSlots ? (
                    <GlassCard className="p-6 sm:p-10">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                      </div>
                    </GlassCard>
                  ) : availableSlots.length > 0 ? (
                    <>
                      {/* Legenda Visual */}
                      <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-success/30 bg-success/5"></div>
                          <span className="text-foreground-muted">Disponível</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-primary bg-primary/20"></div>
                          <span className="text-foreground-muted">Selecionado</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-orange-500/40 bg-orange-500/10"></div>
                          <span className="text-foreground-muted hidden xs:inline">Você já tem agendamento</span>
                          <span className="text-foreground-muted xs:hidden">Seu agendamento</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded border-2 border-foreground-muted/20 bg-background-alt/30"></div>
                          <span className="text-foreground-muted">Indisponível</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">{availableSlots.map((slot) => {
                          const isClientConflict = slot.isClientConflict === true;
                          const isDisabled = !slot.available || isClientConflict;
                          
                          return (
                            <div key={slot.time} className="relative group">
                              <Button
                                variant={selectedTime === slot.time ? "default" : "outline"}
                                disabled={isDisabled}
                                onClick={() => !isDisabled && setSelectedTime(slot.time)}
                                className={`h-auto py-3 w-full ${
                                  selectedTime === slot.time 
                                    ? "bg-gradient-primary text-white shadow-lg shadow-primary/30" 
                                    : slot.available && !isClientConflict
                                    ? "glass-card hover:bg-background-alt"
                                    : isClientConflict
                                    ? "border-2 border-orange-500/40 bg-orange-500/10 text-orange-600/70 cursor-not-allowed"
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                              >
                                {slot.time}
                                {isClientConflict && <span className="ml-1">🟠</span>}
                              </Button>
                              
                              {/* Tooltip para conflito do cliente */}
                              {isClientConflict && slot.conflictDetails && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-background border-2 border-orange-500/40 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                                  <div className="text-xs space-y-1">
                                    <p className="font-bold text-orange-500 flex items-center gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Você já tem agendamento
                                    </p>
                                    <p className="text-foreground-muted">
                                      <strong className="text-foreground">Serviço:</strong> {slot.conflictDetails.serviceName}
                                    </p>
                                    <p className="text-foreground-muted">
                                      <strong className="text-foreground">Profissional:</strong> {slot.conflictDetails.staffName}
                                    </p>
                                    <p className="text-foreground-muted">
                                      <strong className="text-foreground">Duração:</strong> {slot.conflictDetails.duration} min
                                    </p>
                                  </div>
                                  {/* Seta do tooltip */}
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-[2px]">
                                    <div className="border-4 border-transparent border-t-orange-500/40"></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
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
              
              {/* Campo de Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-foreground-muted" />
                  Observações (opcional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Digite alguma observação ou preferência especial..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="glass-card"
                />
              </div>
              
              {/* Mensagem de Atenção */}
              <GlassCard className="p-4 bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-foreground">
                    <strong className="text-primary">Atenção:</strong> Seu agendamento será confirmado após análise. Você receberá uma notificação por email em breve.
                  </div>
                </div>
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
