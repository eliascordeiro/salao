"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function NewBookingPage() {
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1">
                <div className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      currentStep >= step.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p
                      className={`text-sm font-medium ${
                        currentStep >= step.id
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </p>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && "Escolha o Serviço"}
              {currentStep === 2 && "Escolha o Profissional"}
              {currentStep === 3 && "Escolha Data e Horário"}
              {currentStep === 4 && "Confirme seu Agendamento"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Step 1: Serviço */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                      bookingData.serviceId === service.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleServiceSelect(service)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {service.duration} min
                          </span>
                          <span className="flex items-center font-semibold text-green-600">
                            <DollarSign className="h-4 w-4 mr-1" />
                            R$ {service.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {bookingData.serviceId === service.id && (
                        <Check className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Profissional */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {staff.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    Nenhum profissional disponível para este serviço
                  </p>
                ) : (
                  staff.map((staffMember) => (
                    <div
                      key={staffMember.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${
                        bookingData.staffId === staffMember.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200"
                      }`}
                      onClick={() => handleStaffSelect(staffMember)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {staffMember.name}
                          </h3>
                          {staffMember.specialty && (
                            <p className="text-sm text-gray-600 mt-1">
                              {staffMember.specialty}
                            </p>
                          )}
                        </div>
                        {bookingData.staffId === staffMember.id && (
                          <Check className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Step 3: Data e Hora */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Seleção de Data */}
                <div>
                  <Label className="mb-3 block">Escolha a Data</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {availableDates.map((day) => (
                      <button
                        key={day.date}
                        onClick={() => handleDateSelect(day.date)}
                        className={`p-3 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                          bookingData.date === day.date
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="text-xs text-gray-600">{day.weekday}</div>
                        <div className="font-semibold">{day.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seleção de Hora */}
                {bookingData.date && (
                  <div>
                    <Label className="mb-3 block">Escolha o Horário</Label>
                    {loading ? (
                      <p className="text-center text-gray-600 py-8">
                        Carregando horários disponíveis...
                      </p>
                    ) : availableSlots.length === 0 ? (
                      <p className="text-center text-gray-600 py-8">
                        Nenhum horário disponível para esta data
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => handleTimeSelect(slot)}
                            className={`p-3 border rounded-lg text-center hover:border-blue-500 transition-colors ${
                              bookingData.time === slot
                                ? "border-blue-500 bg-blue-50 font-semibold"
                                : "border-gray-200"
                            }`}
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

            {/* Step 4: Confirmação */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Resumo do Agendamento */}
                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Serviço</h3>
                    <p className="text-lg font-semibold">{selectedService?.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600">
                      Profissional
                    </h3>
                    <p className="text-lg font-semibold">{selectedStaff?.name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Data</h3>
                      <p className="text-lg font-semibold">
                        {format(new Date(bookingData.date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Horário</h3>
                      <p className="text-lg font-semibold">{bookingData.time}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Valor</h3>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {selectedService?.price.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Campo de Observações */}
                <div>
                  <Label htmlFor="notes">
                    Observações (opcional)
                  </Label>
                  <Input
                    id="notes"
                    placeholder="Digite alguma observação ou preferência..."
                    value={bookingData.notes}
                    onChange={(e) =>
                      setBookingData({ ...bookingData, notes: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Atenção:</strong> Seu agendamento será confirmado após
                    análise. Você receberá uma notificação em breve.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Confirmando..." : "Confirmar Agendamento"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
