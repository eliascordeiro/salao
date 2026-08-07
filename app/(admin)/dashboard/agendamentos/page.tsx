"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, User, Phone, Mail, Filter, Search, Sparkles, CheckCircle, XCircle, AlertCircle, Plus, Edit2, Save, X as XIcon, Check, Briefcase, UserCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  date: string;
  status: string;
  notes?: string;
  totalPrice: number;
  clientId: string;
  serviceId: string;
  staffId: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  staff: {
    id: string;
    name: string;
    specialty?: string;
  };
}

interface Staff {
  id: string;
  name: string;
  services?: {
    service: {
      id: string;
      name: string;
    };
  }[];
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

interface BookingForm {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceId: string;
  staffId: string;
  date: string;
  time: string;
  notes?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const statusConfig = {
  PENDING: { label: "Pendente", color: "glass-card border-yellow-500/50 bg-yellow-500/10 text-yellow-400", icon: AlertCircle },
  CONFIRMED: { label: "Confirmado", color: "glass-card border-primary/50 bg-primary/10 text-primary", icon: CheckCircle },
  COMPLETED: { label: "Concluído", color: "glass-card border-accent/50 bg-accent/10 text-accent", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", color: "glass-card border-destructive/50 bg-destructive/10 text-destructive", icon: XCircle },
  NO_SHOW: { label: "Não compareceu", color: "glass-card bg-background-alt/50 text-foreground-muted", icon: XCircle },
};

export default function AgendamentosPage() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  
  // Estados para criar/editar
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifyClient, setNotifyClient] = useState(true);
  
  // Estados para cancelamento
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [notifyCancelClient, setNotifyCancelClient] = useState(true);
  
  // Estados para confirmação
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [notifyConfirmClient, setNotifyConfirmClient] = useState(true);

  // Evitar hydration error
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const [formData, setFormData] = useState<BookingForm>({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    serviceId: "",
    staffId: "",
    date: "",
    time: "",
    notes: "",
  });

  const [filters, setFilters] = useState({
    status: "",
    staffId: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Função para formatar telefone com máscara (99) 9 9999-9999
  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica a máscara
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 3) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    } else {
      // Limitar a 11 dígitos
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Função para remover máscara (apenas números)
  const unformatPhoneNumber = (value: string) => {
    return value.replace(/\D/g, "");
  };

  // Função para normalizar texto (remove acentos e converte para minúscula)
  const normalizeText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

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
      
      // Extrair clientes únicos dos agendamentos
      const bookingClients: Client[] = Array.from(
        new Map(
          data.map((booking: Booking) => [
            booking.client.id,
            {
              id: booking.client.id,
              name: booking.client.name,
              email: booking.client.email,
              phone: booking.client.phone,
            }
          ])
        ).values()
      ) as Client[];
      
      // Buscar também todos os clientes cadastrados (role=CLIENT)
      try {
        const clientsResponse = await fetch("/api/users?role=CLIENT");
        if (clientsResponse.ok) {
          const allClients = await clientsResponse.json();
          
          // Mesclar clientes dos agendamentos com clientes cadastrados (removendo duplicatas)
          const clientsMap = new Map<string, Client>();
          
          // Adicionar clientes dos agendamentos
          bookingClients.forEach(client => {
            clientsMap.set(client.id, client);
          });
          
          // Adicionar clientes cadastrados (se não existirem)
          if (Array.isArray(allClients)) {
            allClients.forEach((client: any) => {
              if (!clientsMap.has(client.id)) {
                clientsMap.set(client.id, {
                  id: client.id,
                  name: client.name,
                  email: client.email,
                  phone: client.phone,
                });
              }
            });
          }
          
          const mergedClients = Array.from(clientsMap.values());
          setClients(mergedClients);
          console.log('✅ Clientes carregados:', mergedClients.length, 
            '(', bookingClients.length, 'dos agendamentos +', 
            mergedClients.length - bookingClients.length, 'cadastrados)');
        } else {
          // Se falhar, usar apenas clientes dos agendamentos
          setClients(bookingClients);
          console.log('⚠️ Falha ao carregar clientes cadastrados, usando apenas dos agendamentos:', bookingClients.length);
        }
      } catch (clientError) {
        console.error("Erro ao carregar clientes cadastrados:", clientError);
        setClients(bookingClients);
        console.log('⚠️ Usando apenas clientes dos agendamentos:', bookingClients.length);
      }
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

  // Carregar serviços
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        const data = await response.json();
        // Garantir que data é um array
        const servicesArray = Array.isArray(data) ? data : [];
        setServices(servicesArray.filter((s: any) => s.active));
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        setServices([]); // Garantir array vazio em caso de erro
      }
    };
    fetchServices();
  }, []);

  // Clientes são extraídos dos bookings (ver fetchBookings)
  // Não precisamos de useEffect separado pois os clientes vêm dos agendamentos

  // Filtrar profissionais baseado no serviço selecionado
  const getFilteredStaff = () => {
    if (!formData.serviceId) {
      // Se nenhum serviço selecionado, retornar todos
      return staff;
    }
    
    // Filtrar apenas profissionais que possuem o serviço selecionado
    return staff.filter((s) => {
      if (!s.services || s.services.length === 0) {
        // Se profissional não tem serviços cadastrados, não mostrar
        return false;
      }
      // Verificar se o profissional tem o serviço selecionado
      return s.services.some((ss) => ss.service.id === formData.serviceId);
    });
  };

  // Abrir modal de criar
  const handleOpenCreate = () => {
    setFormData({
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      serviceId: "",
      staffId: "",
      date: "",
      time: "",
      notes: "",
    });
    setClientSearchTerm("");
    setIsNewClient(false);
    setAvailableSlots([]);
    setShowCreateModal(true);
  };

  // Buscar horários disponíveis
  const fetchAvailableSlots = async () => {
    if (!formData.serviceId || !formData.staffId || !formData.date) {
      console.log("Faltam dados para buscar slots:", {
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        date: formData.date,
      });
      return;
    }

    try {
      setLoadingSlots(true);
      console.log("Buscando slots para:", {
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        date: formData.date,
      });
      
      const response = await fetch(
        `/api/schedule/available-slots?serviceId=${formData.serviceId}&staffId=${formData.staffId}&date=${formData.date}`
      );
      const data = await response.json();
      
      console.log("Resposta da API:", data);
      
      if (!response.ok) {
        console.error("Erro na resposta:", data);
        alert(data.error || "Erro ao buscar horários");
        setAvailableSlots([]);
        return;
      }
      
      setAvailableSlots(data.slots || []);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Buscar horários quando serviço, profissional ou data mudarem
  useEffect(() => {
    if (formData.serviceId && formData.staffId && formData.date) {
      fetchAvailableSlots();
    }
  }, [formData.serviceId, formData.staffId, formData.date]);

  // Filtrar clientes conforme busca (apenas por nome - com normalização)
  const filteredClientSuggestions = clients.filter(
    (client) => {
      const searchNormalized = normalizeText(clientSearchTerm.trim());
      const nameNormalized = normalizeText(client.name);
      
      const matches = nameNormalized.includes(searchNormalized);
      
      if (clientSearchTerm.length > 0) {
        console.log('🔍 Filtro:', {
          cliente: client.name,
          clienteNormalizado: nameNormalized,
          busca: clientSearchTerm,
          buscaNormalizada: searchNormalized,
          matches
        });
      }
      
      return matches;
    }
  );
  
  console.log('📋 Total clientes:', clients.length, 'Filtrados:', filteredClientSuggestions.length, 'Busca:', clientSearchTerm, 'Show:', showClientSuggestions);

  // Atualizar busca de cliente
  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔎 Busca mudou:', value);
    setClientSearchTerm(value);
    setShowClientSuggestions(value.length > 0);
    console.log('👀 Show suggestions:', value.length > 0);
    
    // Atualizar campo Nome automaticamente enquanto digita
    setFormData({
      ...formData,
      clientName: value,
      clientId: "",
      clientEmail: "",
      clientPhone: "",
    });
    
    // Verificar se é novo cliente (não encontrou correspondência exata com normalização)
    const normalizedValue = normalizeText(value);
    const hasMatch = clients.some(
      (c) => normalizeText(c.name) === normalizedValue
    );
    setIsNewClient(!hasMatch && value.length > 2);
  };

  // Selecionar cliente existente
  const handleSelectClient = (client: Client) => {
    setFormData({
      ...formData,
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone ? formatPhoneNumber(client.phone) : "",
    });
    setClientSearchTerm(client.name);
    setShowClientSuggestions(false);
    setIsNewClient(false);
  };

  // Criar novo cliente junto com agendamento
  const handleClientNameChange = (value: string) => {
    setClientSearchTerm(value);
    setFormData({ ...formData, clientName: value, clientId: "" });
    setShowClientSuggestions(true);
    
    // Se não encontrar cliente, considerar novo
    const hasMatch = clients.some(
      (c) => c.name.toLowerCase() === value.toLowerCase()
    );
    setIsNewClient(!hasMatch && value.length > 2);
  };

  // Abrir modal de editar
  const handleOpenEdit = (booking: Booking) => {
    setEditingBooking(booking);
    const bookingDate = new Date(booking.date);
    
    // Resetar checkbox de notificação (marcado por padrão)
    setNotifyClient(true);
    
    // Preencher form com dados do booking usando UTC
    setFormData({
      clientId: booking.client.id,
      clientName: booking.client.name,
      clientEmail: booking.client.email,
      clientPhone: booking.client.phone || "",
      serviceId: booking.service.id,
      staffId: booking.staff.id,
      date: `${bookingDate.getUTCFullYear()}-${String(bookingDate.getUTCMonth() + 1).padStart(2, '0')}-${String(bookingDate.getUTCDate()).padStart(2, '0')}`,
      time: `${String(bookingDate.getUTCHours()).padStart(2, '0')}:${String(bookingDate.getUTCMinutes()).padStart(2, '0')}`,
      notes: booking.notes || "",
    });
    
    setClientSearchTerm(booking.client.name);
    setShowEditModal(true);
    
    // Buscar slots após setar os dados (com pequeno delay para garantir que o estado foi atualizado)
    setTimeout(() => {
      if (booking.service.id && booking.staff.id && format(bookingDate, "yyyy-MM-dd")) {
        fetchAvailableSlots();
      }
    }, 100);
  };

  // Criar agendamento
  const handleCreate = async () => {
    try {
      setSaving(true);
      
      // Validações
      if (!formData.clientName || !formData.clientEmail || !formData.serviceId || !formData.staffId || !formData.date || !formData.time) {
        alert("Preencha todos os campos obrigatórios (nome, email, serviço, profissional, data e horário)");
        setSaving(false);
        return;
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.clientEmail)) {
        alert("Email inválido");
        setSaving(false);
        return;
      }

      // Validar formato do horário (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(formData.time)) {
        alert("Horário inválido. Selecione um horário da grade de horários disponíveis.");
        setSaving(false);
        return;
      }

      let clientId = formData.clientId;
      let isNewClient = false;

      // Se não tem clientId, buscar cliente existente na lista ou criar novo
      if (!clientId) {
        // Buscar cliente existente na lista de clientes carregada
        const existingClient = clients.find(
          (c) => c.email.toLowerCase() === formData.clientEmail.toLowerCase()
        );
        
        if (existingClient) {
          clientId = existingClient.id;
          console.log("Cliente existente encontrado na lista:", existingClient);
          
          // Informar usuário que o cliente já existe
          const useExisting = window.confirm(
            `Cliente "${existingClient.name}" (${existingClient.email}) já cadastrado!\n\n` +
            `Deseja usar este cliente para o agendamento?\n\n` +
            `Clique "OK" para usar o cliente existente ou "Cancelar" para criar um novo.`
          );
          
          if (useExisting) {
            // Auto-preencher dados do cliente existente
            setFormData({
              ...formData,
              clientId: existingClient.id,
              clientName: existingClient.name,
              clientEmail: existingClient.email,
              clientPhone: existingClient.phone ? formatPhoneNumber(existingClient.phone) : formData.clientPhone,
            });
          } else {
            clientId = ""; // Forçar criação de novo cliente
          }
        }

        // Se não encontrou ou usuário optou por criar novo, criar cliente
        if (!clientId) {
          isNewClient = true;
          const clientResponse = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: formData.clientName,
              email: formData.clientEmail,
              phone: unformatPhoneNumber(formData.clientPhone),
              password: Math.random().toString(36).slice(-8), // Senha temporária
              role: "CLIENT",
            }),
          });

          if (!clientResponse.ok) {
            const error = await clientResponse.json();
            throw new Error(error.error || "Erro ao criar cliente");
          }

          const newClient = await clientResponse.json();
          clientId = newClient.user.id;
          console.log("Novo cliente criado:", newClient);
        }
      }
      
      // Combinar data e hora usando UTC para evitar problema de timezone
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      const dateTime = new Date();
      dateTime.setUTCFullYear(year);
      dateTime.setUTCMonth(month - 1); // Mês começa em 0
      dateTime.setUTCDate(day);
      dateTime.setUTCHours(hours, minutes, 0, 0);
      
      // Validar se a data é válida
      if (isNaN(dateTime.getTime())) {
        alert("Data ou horário inválido. Verifique os campos e tente novamente.");
        setSaving(false);
        return;
      }
      
      console.log("Enviando agendamento:", {
        clientId: clientId,
        serviceId: formData.serviceId,
        staffId: formData.staffId,
        date: dateTime.toISOString(),
        notes: formData.notes,
      });
      
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId,
          serviceId: formData.serviceId,
          staffId: formData.staffId,
          date: dateTime.toISOString(),
          notes: formData.notes,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        let errorMessage = "Erro ao criar agendamento";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch (e) {
          console.error("Erro ao parsear resposta de erro:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Agendamento criado:", result);

      // Enviar notificação se solicitado
      if (notifyClient) {
        try {
          await fetch("/api/email/booking-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: result.id,
              isNewClient: isNewClient,
            }),
          });
          console.log("✅ Notificação de novo agendamento enviada ao cliente");
        } catch (emailError) {
          console.error("❌ Erro ao enviar notificação:", emailError);
          // Não bloquear o fluxo se email falhar
        }
      } else {
        console.log("ℹ️ Notificação ao cliente desabilitada pelo admin");
      }

      setShowCreateModal(false);
      fetchBookings();
      
      const notificationMsg = notifyClient
        ? "Agendamento criado e cliente notificado!"
        : "Agendamento criado (cliente não foi notificado)";
      alert(notificationMsg);
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      alert(error.message || "Erro ao criar agendamento");
    } finally {
      setSaving(false);
    }
  };

  // Atualizar agendamento
  const handleUpdate = async () => {
    if (!editingBooking) return;
    
    try {
      setSaving(true);
      
      if (!formData.serviceId || !formData.staffId || !formData.date || !formData.time) {
        alert("Preencha todos os campos obrigatórios");
        setSaving(false);
        return;
      }

      // Validar formato do horário (HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(formData.time)) {
        alert("Horário inválido. Selecione um horário da grade de horários disponíveis.");
        setSaving(false);
        return;
      }
      
      // Combinar data e hora usando UTC para evitar problema de timezone
      const [year, month, day] = formData.date.split('-').map(Number);
      const [hours, minutes] = formData.time.split(':').map(Number);
      
      const dateTime = new Date();
      dateTime.setUTCFullYear(year);
      dateTime.setUTCMonth(month - 1); // Mês começa em 0
      dateTime.setUTCDate(day);
      dateTime.setUTCHours(hours, minutes, 0, 0);
      
      // Validar se a data é válida
      if (isNaN(dateTime.getTime())) {
        alert("Data ou horário inválido. Verifique os campos e tente novamente.");
        setSaving(false);
        return;
      }
      
      const response = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          staffId: formData.staffId,
          date: dateTime.toISOString(),
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar agendamento");
      }

      const result = await response.json();
      
      // Enviar notificação sobre a alteração (somente se marcado)
      if (notifyClient) {
        try {
          await fetch("/api/email/booking-notification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: editingBooking.id,
              isUpdate: true,
            }),
          });
          console.log("✅ Notificação de alteração enviada ao cliente");
        } catch (emailError) {
          console.error("❌ Erro ao enviar notificação:", emailError);
          // Não bloquear o fluxo se notificação falhar
        }
      } else {
        console.log("ℹ️ Notificação ao cliente desabilitada pelo admin");
      }

      setShowEditModal(false);
      setEditingBooking(null);
      fetchBookings();
      
      const notificationMsg = notifyClient 
        ? "Agendamento atualizado e cliente notificado!" 
        : "Agendamento atualizado (cliente não foi notificado)";
      alert(notificationMsg);
    } catch (error: any) {
      console.error("Erro ao atualizar agendamento:", error);
      alert(error.message || "Erro ao atualizar agendamento");
    } finally {
      setSaving(false);
    }
  };

  // Carregar agendamentos ao montar e quando filtros mudarem
  useEffect(() => {
    fetchBookings();
  }, [filters.status, filters.staffId, filters.startDate, filters.endDate]);

  // Atualizar status do agendamento
  const handleStatusChange = async (bookingId: string, newStatus: string, shouldNotify: boolean = true) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: newStatus,
          shouldNotify: shouldNotify 
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      // Recarregar lista
      fetchBookings();
      
      // Mensagem personalizada para cancelamento e confirmação
      if (newStatus === "CANCELLED") {
        const notificationMsg = shouldNotify
          ? "Agendamento cancelado e cliente notificado!"
          : "Agendamento cancelado (cliente não foi notificado)";
        alert(notificationMsg);
      } else if (newStatus === "CONFIRMED") {
        const notificationMsg = shouldNotify
          ? "Agendamento confirmado e cliente notificado!"
          : "Agendamento confirmado (cliente não foi notificado)";
        alert(notificationMsg);
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do agendamento");
    }
  };

  // Abrir dialog de confirmação de cancelamento
  const handleOpenCancelDialog = (booking: Booking) => {
    setCancellingBooking(booking);
    setNotifyCancelClient(true); // Reset para true (notificar por padrão)
    setShowCancelDialog(true);
  };

  // Confirmar cancelamento
  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    
    await handleStatusChange(cancellingBooking.id, "CANCELLED", notifyCancelClient);
    setShowCancelDialog(false);
    setCancellingBooking(null);
  };

  // Abrir dialog de confirmação de agendamento
  const handleOpenConfirmDialog = (booking: Booking) => {
    setConfirmingBooking(booking);
    setNotifyConfirmClient(true); // Reset para true (notificar por padrão)
    setShowConfirmDialog(true);
  };

  // Confirmar agendamento
  const handleConfirmBooking = async () => {
    if (!confirmingBooking) return;
    
    await handleStatusChange(confirmingBooking.id, "CONFIRMED", notifyConfirmClient);
    setShowConfirmDialog(false);
    setConfirmingBooking(null);
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
      <div className="min-h-screen bg-background">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
        <div className="flex items-center justify-center h-64">
          <Sparkles className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8 animate-fadeInUp flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground flex items-center gap-2 md:gap-3">
                <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                Agendamentos
              </h1>
              <p className="text-sm sm:text-base text-foreground-muted mt-1 md:mt-2">
                Gerencie todos os agendamentos do salão
              </p>
            </div>
            <GradientButton
              variant="primary"
              onClick={handleOpenCreate}
              className="w-full sm:w-auto px-4 py-2 gap-2 min-h-[44px]"
            >
              <Plus className="h-5 w-5" />
              Novo Agendamento
            </GradientButton>
          </div>

          {/* Filtros */}
          <GlassCard className="mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 md:gap-4 mb-4">
              <GradientButton
                variant="primary"
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 min-h-[44px] w-full sm:w-auto"
              >
                <Filter className="h-4 w-4" />
                {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
              </GradientButton>

              <div className="flex items-center gap-2 flex-1 max-w-full sm:max-w-md">
                <Search className="h-4 w-4 text-primary flex-shrink-0" />
                <Input
                  placeholder="Buscar por cliente, serviço ou profissional..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-primary/20">
                {/* Status */}
                <div>
                  <Label htmlFor="status" className="text-foreground">Status</Label>
                  <select
                    id="status"
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full px-3 py-2 glass-card bg-background-alt/50 border-primary/20 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <Label htmlFor="staffId" className="text-foreground">Profissional</Label>
                  <select
                    id="staffId"
                    value={filters.staffId}
                    onChange={(e) =>
                      setFilters({ ...filters, staffId: e.target.value })
                    }
                    className="w-full px-3 py-2 glass-card bg-background-alt/50 border-primary/20 text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
                  <Label htmlFor="startDate" className="text-foreground">Data Início</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      setFilters({ ...filters, startDate: e.target.value })
                    }
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                  />
                </div>

                {/* Data Fim */}
                <div>
                  <Label htmlFor="endDate" className="text-foreground">Data Fim</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      setFilters({ ...filters, endDate: e.target.value })
                    }
                    className="glass-card bg-background-alt/50 border-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </GlassCard>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <GlassCard className="p-6">
              <p className="text-sm text-foreground-muted">Total</p>
              <p className="text-2xl font-bold text-foreground">{filteredBookings.length}</p>
            </GlassCard>
            <GlassCard className="p-6" glow="primary">
              <p className="text-sm text-foreground-muted">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "PENDING").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6" glow="success">
              <p className="text-sm text-foreground-muted">Confirmados</p>
              <p className="text-2xl font-bold text-primary flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "CONFIRMED").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6" glow="accent">
              <p className="text-sm text-foreground-muted">Concluídos</p>
              <p className="text-2xl font-bold text-accent flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "COMPLETED").length}
              </p>
            </GlassCard>
            <GlassCard className="p-6">
              <p className="text-sm text-foreground-muted">Cancelados</p>
              <p className="text-2xl font-bold text-destructive flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                {filteredBookings.filter((b) => b.status === "CANCELLED").length}
              </p>
            </GlassCard>
          </div>

          {/* Lista de Agendamentos */}
          {loading ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <p className="text-foreground-muted">Carregando agendamentos...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <Calendar className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum agendamento encontrado
              </h3>
              <p className="text-foreground-muted">
                Tente ajustar os filtros ou aguarde novos agendamentos
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <GlassCard 
                  key={booking.id} 
                  hover 
                  className="p-6 animate-fadeIn" 
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1 space-y-3">
                      {/* Cabeçalho */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            {booking.service.name}
                          </h3>
                          <p className="text-sm text-foreground-muted">
                            {booking.staff.name}
                            {booking.staff.specialty && (
                              <span className="text-foreground-muted/70">
                                {" "}
                                • {booking.staff.specialty}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${statusConfig[booking.status as keyof typeof statusConfig]?.color}`}>
                          {(() => {
                            const Icon = statusConfig[booking.status as keyof typeof statusConfig]?.icon;
                            return Icon && <Icon className="h-3 w-3" />;
                          })()}
                          {statusConfig[booking.status as keyof typeof statusConfig]?.label}
                        </span>
                      </div>

                      {/* Data e Hora */}
                      <div className="flex items-center gap-4 text-sm text-foreground-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          {format(new Date(booking.date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-accent" />
                          {new Date(booking.date).getUTCHours().toString().padStart(2, '0')}:{new Date(booking.date).getUTCMinutes().toString().padStart(2, '0')} (
                          {booking.service.duration}min)
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="flex items-center gap-1 text-foreground">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {booking.client.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-muted ml-5">
                          <Mail className="h-3 w-3 text-primary" />
                          {booking.client.email}
                        </div>
                        {booking.client.phone && (
                          <div className="flex items-center gap-1 text-foreground-muted ml-5">
                            <Phone className="h-3 w-3 text-accent" />
                            {formatPhoneNumber(booking.client.phone)}
                          </div>
                        )}
                      </div>

                      {/* Preço */}
                      <div className="text-sm">
                        <span className="font-medium text-foreground">
                          Valor:{" "}
                        </span>
                        <span className="text-lg font-bold text-accent">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>

                      {/* Notas */}
                      {booking.notes && (
                        <div className="text-sm">
                          <span className="font-medium text-foreground">
                            Observações:{" "}
                          </span>
                          <span className="text-foreground-muted">{booking.notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      {/* Botão Editar (disponível para PENDING e CONFIRMED) */}
                      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
                        <Button
                          variant="outline"
                          onClick={() => handleOpenEdit(booking)}
                          className="w-full py-2 gap-2 border-primary/30 hover:bg-primary/10 min-h-[44px]"
                        >
                          <Edit2 className="h-4 w-4" />
                          Editar
                        </Button>
                      )}
                      
                      {booking.status === "PENDING" && (
                        <>
                          <GradientButton
                            variant="success"
                            onClick={() =>
                              handleOpenConfirmDialog(booking)
                            }
                            className="w-full py-2 min-h-[44px]"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar
                          </GradientButton>
                          <GradientButton
                            variant="accent"
                            onClick={() =>
                              handleOpenCancelDialog(booking)
                            }
                            className="w-full py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive min-h-[44px]"
                          >
                            <XCircle className="h-4 w-4" />
                            Cancelar
                          </GradientButton>
                        </>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <>
                          <GradientButton
                            variant="accent"
                            onClick={() =>
                              handleStatusChange(booking.id, "COMPLETED")
                            }
                            className="w-full py-2 min-h-[44px]"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Marcar Concluído
                          </GradientButton>
                          <GradientButton
                            variant="primary"
                            onClick={() =>
                              handleStatusChange(booking.id, "NO_SHOW")
                            }
                            className="w-full py-2 min-h-[44px]"
                          >
                            <XCircle className="h-4 w-4" />
                            Não Compareceu
                          </GradientButton>
                        </>
                      )}
                      {(booking.status === "COMPLETED" ||
                        booking.status === "CANCELLED" ||
                        booking.status === "NO_SHOW") && (
                        <p className="text-sm text-foreground-muted text-center py-2 glass-card bg-background-alt/30 rounded-lg">
                          Agendamento finalizado
                        </p>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </GridBackground>

      {/* Modal de Criar Agendamento */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="glass-card w-[95vw] max-w-3xl max-h-[92vh] overflow-y-auto p-0">
          {/* Header com gradiente */}
          <div className="relative px-6 pt-6 pb-5 border-b border-primary/15 bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-foreground">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <Plus className="h-4 w-4" />
                </span>
                Novo Agendamento
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Preencha os dados abaixo. Campos com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center gap-1 mt-4">
              {[
                { n: 1, label: "Cliente", done: !!formData.clientName },
                { n: 2, label: "Serviço", done: !!formData.serviceId && !!formData.staffId },
                { n: 3, label: "Data/Hora", done: !!formData.date && !!formData.time },
                { n: 4, label: "Confirmar", done: false },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex items-center gap-1 flex-1 min-w-0">
                  <div className={`flex items-center gap-1.5 flex-shrink-0 ${step.done ? "text-primary" : "text-muted-foreground"}`}>
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${step.done ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                      {step.done ? "✓" : step.n}
                    </span>
                    <span className="text-[11px] font-medium hidden sm:block">{step.label}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${step.done ? "bg-primary/40" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* ── Seção 1: Cliente ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <h3 className="font-semibold text-sm text-foreground">Dados do Cliente</h3>
              </div>

              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="clientSearch"
                  value={clientSearchTerm}
                  onChange={handleClientSearchChange}
                  onFocus={() => {
                    if (clientSearchTerm.length > 0 && !formData.clientId) setShowClientSuggestions(true);
                  }}
                  placeholder="Buscar cliente pelo nome..."
                  className="pl-9 pr-10 h-11"
                  autoComplete="off"
                />
                {formData.clientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, clientId: "", clientName: "", clientEmail: "", clientPhone: "" });
                      setClientSearchTerm("");
                      setShowClientSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}

                {/* Dropdown */}
                {mounted && showClientSuggestions && filteredClientSuggestions.length > 0 && !formData.clientId && (
                  <div className="absolute z-50 w-full mt-1 glass-card border border-primary/20 rounded-lg shadow-xl max-h-52 overflow-y-auto">
                    {filteredClientSuggestions.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="w-full px-4 py-2.5 text-left hover:bg-primary/10 transition-colors border-b border-border/50 last:border-0 flex items-center gap-3"
                      >
                        <span className="h-8 w-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {client.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{client.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{client.email}{client.phone ? ` • ${formatPhoneNumber(client.phone)}` : ""}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Estado: cliente selecionado → card de perfil */}
              {formData.clientId && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/25 bg-primary/5">
                  <span className="h-10 w-10 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {formData.clientName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{formData.clientName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formData.clientEmail}{formData.clientPhone ? ` • ${formData.clientPhone}` : ""}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex-shrink-0">existente</span>
                </div>
              )}

              {/* Estado: novo cliente → campos de cadastro */}
              {!formData.clientId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isNewClient && (
                    <div className="col-span-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Plus className="h-4 w-4 flex-shrink-0" />
                      <span className="text-xs font-medium">Novo cliente será cadastrado automaticamente</span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="clientPhone" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> WhatsApp *
                    </Label>
                    <Input
                      id="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value);
                        setFormData({ ...formData, clientPhone: formatted, clientId: "" });
                      }}
                      placeholder="(99) 9 9999-9999"
                      maxLength={19}
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="clientEmail" className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> E-mail *
                    </Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value, clientId: "" })}
                      placeholder="email@exemplo.com"
                      className="h-10"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/50" />

            {/* ── Seção 2: Serviço e Profissional ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <h3 className="font-semibold text-sm text-foreground">Serviço e Profissional</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Serviço */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Serviço *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, serviceId: value, staffId: "", time: "" });
                      setAvailableSlots([]);
                    }}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum serviço ativo</div>
                      ) : (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            <div className="flex flex-col py-0.5">
                              <span className="font-medium">{service.name}</span>
                              <span className="text-xs text-muted-foreground">R$ {service.price.toFixed(2)} • {service.duration}min</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Profissional */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Profissional *</Label>
                  <Select
                    value={formData.staffId}
                    onValueChange={(value) => setFormData({ ...formData, staffId: value })}
                    disabled={!formData.serviceId}
                  >
                    <SelectTrigger className={`h-10 ${!formData.serviceId ? "opacity-50" : ""}`}>
                      <SelectValue placeholder={!formData.serviceId ? "Selecione o serviço primeiro" : "Selecione o profissional"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getFilteredStaff().length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          {!formData.serviceId ? "Selecione um serviço primeiro" : "Nenhum profissional disponível"}
                        </div>
                      ) : (
                        getFilteredStaff().map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview do serviço selecionado */}
              {formData.serviceId && (() => {
                const svc = services.find((s) => s.id === formData.serviceId);
                const stf = staff.find((s) => s.id === formData.staffId);
                if (!svc) return null;
                return (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-alt/40 text-sm">
                    <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium text-foreground">{svc.name}</span>
                    <span className="text-muted-foreground text-xs">R$ {svc.price.toFixed(2)} • {svc.duration}min</span>
                    {stf && <><span className="text-border">|</span><UserCheck className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground text-xs">{stf.name}</span></>}
                  </div>
                );
              })()}
            </div>

            <div className="border-t border-border/50" />

            {/* ── Seção 3: Data e Horário ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">3</span>
                <h3 className="font-semibold text-sm text-foreground">Data e Horário</h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Data do Agendamento *</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value, time: "" })}
                  min={new Date().toISOString().split("T")[0]}
                  className="cursor-pointer h-10 max-w-xs"
                />
              </div>

              {formData.date && formData.serviceId && formData.staffId && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Horários Disponíveis *
                  </Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center gap-3 py-10 rounded-xl border border-border bg-background-alt/30">
                      <Sparkles className="h-5 w-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Carregando horários...</span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-10 rounded-xl border border-border bg-background-alt/30 text-center">
                      <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="text-sm font-medium text-foreground">Sem horários disponíveis</p>
                      <p className="text-xs text-muted-foreground mt-1">Tente outra data ou profissional</p>
                    </div>
                  ) : (
                    (() => {
                      const morning = availableSlots.filter((s) => parseInt(s.time) < 12);
                      const afternoon = availableSlots.filter((s) => parseInt(s.time) >= 12);
                      const SlotGroup = ({ label, slots }: { label: string; slots: TimeSlot[] }) => (
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot) => (
                              <button
                                key={slot.time}
                                type="button"
                                onClick={() => slot.available && setFormData({ ...formData, time: slot.time })}
                                disabled={!slot.available}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all min-h-[36px] min-w-[56px]
                                  ${formData.time === slot.time
                                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40 shadow-md scale-105"
                                    : slot.available
                                    ? "border border-border bg-background-alt/60 hover:border-primary/40 hover:bg-primary/5 hover:scale-105"
                                    : "border border-border/40 bg-muted/20 text-muted-foreground/40 cursor-not-allowed line-through"
                                  }`}
                              >
                                {slot.time}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                      return (
                        <div className="p-4 rounded-xl border border-border bg-background-alt/30 space-y-4">
                          {morning.length > 0 && <SlotGroup label="Manhã" slots={morning} />}
                          {afternoon.length > 0 && <SlotGroup label="Tarde / Noite" slots={afternoon} />}
                          <p className="text-[11px] text-muted-foreground pt-1">
                            {availableSlots.filter((s) => s.available).length} horários disponíveis
                            {formData.time && <span className="text-primary font-semibold"> · Selecionado: {formData.time}</span>}
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border/50" />

            {/* ── Seção 4: Observações + Notificação ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">4</span>
                <h3 className="font-semibold text-sm text-foreground">Finalizar</h3>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Observações (opcional)
                </Label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Cliente prefere corte mais curto nas laterais..."
                  className="h-10"
                />
              </div>

              {/* Notificação */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background-alt/30">
                <Checkbox
                  id="notify-client-create"
                  checked={notifyClient}
                  onCheckedChange={(checked) => setNotifyClient(checked as boolean)}
                />
                <Label htmlFor="notify-client-create" className="cursor-pointer flex-1 text-sm">
                  Notificar cliente por e-mail/WhatsApp
                </Label>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Resumo do agendamento */}
              {formData.clientName && formData.serviceId && formData.date && formData.time && (() => {
                const svc = services.find((s) => s.id === formData.serviceId);
                const stf = staff.find((s) => s.id === formData.staffId);
                const [y, m, d] = formData.date.split("-");
                return (
                  <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">Resumo do Agendamento</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="text-muted-foreground">Cliente</div><div className="font-medium text-foreground truncate">{formData.clientName}</div>
                      <div className="text-muted-foreground">Serviço</div><div className="font-medium text-foreground truncate">{svc?.name}</div>
                      {stf && <><div className="text-muted-foreground">Profissional</div><div className="font-medium text-foreground">{stf.name}</div></>}
                      <div className="text-muted-foreground">Data/Hora</div><div className="font-medium text-foreground">{`${d}/${m}/${y} às ${formData.time}`}</div>
                      {svc && <><div className="text-muted-foreground">Valor</div><div className="font-semibold text-primary">R$ {svc.price.toFixed(2)}</div></>}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                disabled={saving}
                className="flex-1 h-11 text-sm"
              >
                <XIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <GradientButton
                variant="primary"
                onClick={handleCreate}
                disabled={saving}
                className="flex-1 h-11 text-sm"
              >
                {saving ? (
                  <><Sparkles className="h-4 w-4 mr-2 animate-spin" />Criando...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" />Criar Agendamento</>
                )}
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Editar Agendamento */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-card w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 md:pb-6 border-b border-primary/10">
            <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 md:gap-3 text-foreground">
              <Edit2 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              Editar Agendamento
            </DialogTitle>
            <DialogDescription className="text-base mt-3 text-muted-foreground">
              Atualize os dados do agendamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8 mt-8 pb-4">
            {/* Cliente (somente leitura) */}
            {editingBooking && (
              <div className="space-y-4 p-6 glass-card rounded-xl border border-primary/20 bg-background-alt/30">
                <Label className="text-base font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </Label>
                <div className="space-y-2 pl-6">
                  <div className="font-medium text-base">{editingBooking.client.name}</div>
                  <div className="text-muted-foreground text-sm">{editingBooking.client.email}</div>
                </div>
              </div>
            )}

            {/* Serviço */}
            <div className="space-y-4 p-6 glass-card rounded-xl border border-primary/20 bg-background-alt/30">
              <Label htmlFor="edit-service" className="text-base font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Serviço *
              </Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => {
                  // Ao mudar serviço, limpar profissional e horário
                  setFormData({ 
                    ...formData, 
                    serviceId: value,
                    staffId: "",
                    time: ""
                  });
                  setAvailableSlots([]);
                }}
              >
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Nenhum serviço ativo cadastrado
                    </div>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="text-base py-3">
                        {service.name} - R$ {service.price.toFixed(2)} ({service.duration}min)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Profissional */}
            <div className="space-y-4 p-6 glass-card rounded-xl border border-primary/20 bg-background-alt/30">
              <Label htmlFor="edit-staff" className="text-base font-medium flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Profissional *
              </Label>
              <Select
                value={formData.staffId}
                onValueChange={(value) =>
                  setFormData({ ...formData, staffId: value })
                }
                disabled={!formData.serviceId}
              >
                <SelectTrigger className="h-14 text-base">
                  <SelectValue placeholder={
                    !formData.serviceId 
                      ? "Selecione primeiro o serviço" 
                      : "Selecione o profissional"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredStaff().length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      {!formData.serviceId 
                        ? "Selecione um serviço primeiro"
                        : "Nenhum profissional disponível para este serviço"
                      }
                    </div>
                  ) : (
                    getFilteredStaff().map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-base py-3">
                        {s.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Data e Hora */}
            <div className="space-y-6 p-6 glass-card rounded-xl border border-primary/20 bg-background-alt/30">
              <div className="space-y-4">
                <Label htmlFor="edit-date" className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data *
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value, time: "" })
                  }
                  min={new Date().toISOString().split("T")[0]}
                  className="h-14 text-base"
                />
              </div>

              {/* Horários Disponíveis */}
              {formData.date && formData.serviceId && formData.staffId && (
                <div className="space-y-4 pt-2">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Horários Disponíveis *
                  </Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-16 glass-card rounded-xl">
                      <Sparkles className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-base text-muted-foreground">
                        Carregando horários...
                      </span>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="glass-card bg-muted/50 p-8 rounded-xl text-center border border-dashed border-muted-foreground/30">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-base text-muted-foreground font-medium mb-2">
                        Nenhum horário disponível
                      </p>
                      <p className="text-sm text-muted-foreground/80 max-w-md mx-auto">
                        O profissional pode não trabalhar neste dia ou todos os horários estão ocupados.
                        <br />
                        Tente outra data ou profissional.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-3 max-h-64 overflow-y-auto p-3 sm:p-4 glass-card rounded-xl border border-primary/10">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() =>
                            slot.available &&
                            setFormData({ ...formData, time: slot.time })
                          }
                          disabled={!slot.available}
                          className={`
                            px-2 sm:px-3 md:px-5 py-3 sm:py-3.5 md:py-4 rounded-xl text-xs sm:text-sm md:text-base font-medium transition-all min-h-[44px]
                            ${
                              formData.time === slot.time
                                ? "bg-primary text-primary-foreground ring-2 ring-primary/50 shadow-lg shadow-primary/20"
                                : slot.available
                                ? "glass-card hover:bg-primary/10 hover:border-primary/30 hover:shadow-md"
                                : "bg-muted/30 text-muted-foreground cursor-not-allowed opacity-50"
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-5 p-6 glass-card rounded-xl border border-primary/20 bg-background-alt/30">
              <div className="space-y-3">
                <Label htmlFor="edit-notes" className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  Observações (opcional)
                </Label>
                <Input
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Observações adicionais (opcional)"
                  className="h-12"
                />
              </div>
            </div>

            {/* Notificação ao Cliente */}
            <div className="p-5 glass-card rounded-xl border border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="notify-client"
                  checked={notifyClient}
                  onCheckedChange={(checked) => setNotifyClient(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="notify-client"
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    Notificar cliente sobre as alterações
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se marcado, o cliente receberá um email/WhatsApp informando sobre a mudança no agendamento (horário, profissional, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBooking(null);
                }}
                disabled={saving}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                <XIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <GradientButton
                variant="primary"
                onClick={handleUpdate}
                disabled={saving}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                {saving ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Agendamento */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="glass-card w-[95vw] max-w-md">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-success">
              <CheckCircle className="h-6 w-6" />
              Confirmar Agendamento
            </DialogTitle>
            <DialogDescription className="text-base mt-3">
              Tem certeza que deseja confirmar este agendamento?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6 pb-4">
            {/* Informações do agendamento */}
            {confirmingBooking && (
              <div className="p-4 glass-card rounded-xl border border-primary/10 bg-primary/5 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Cliente:</span> {confirmingBooking.client.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Serviço:</span> {confirmingBooking.service.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Profissional:</span> {confirmingBooking.staff.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Data/Hora:</span>{" "}
                  {format(new Date(confirmingBooking.date), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                  {new Date(confirmingBooking.date).getUTCHours().toString().padStart(2, "0")}:
                  {new Date(confirmingBooking.date).getUTCMinutes().toString().padStart(2, "0")}
                </p>
              </div>
            )}

            {/* Opção de Notificação */}
            <div className="p-5 glass-card rounded-xl border border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="notify-confirm-client"
                  checked={notifyConfirmClient}
                  onCheckedChange={(checked) => setNotifyConfirmClient(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="notify-confirm-client"
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    Notificar cliente sobre a confirmação
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se marcado, o cliente receberá um email/WhatsApp confirmando o agendamento
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                Voltar
              </Button>
              <GradientButton
                variant="success"
                onClick={handleConfirmBooking}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirmar Agendamento
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="glass-card w-[95vw] max-w-md">
          <DialogHeader className="pb-4 border-b border-primary/10">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-destructive">
              <XCircle className="h-6 w-6" />
              Confirmar Cancelamento
            </DialogTitle>
            <DialogDescription className="text-base mt-3">
              Tem certeza que deseja cancelar este agendamento?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6 pb-4">
            {/* Informações do agendamento */}
            {cancellingBooking && (
              <div className="p-4 glass-card rounded-xl border border-primary/10 bg-primary/5 space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">Cliente:</span> {cancellingBooking.client.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Serviço:</span> {cancellingBooking.service.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Profissional:</span> {cancellingBooking.staff.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Data/Hora:</span>{" "}
                  {format(new Date(cancellingBooking.date), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                  {new Date(cancellingBooking.date).getUTCHours().toString().padStart(2, "0")}:
                  {new Date(cancellingBooking.date).getUTCMinutes().toString().padStart(2, "0")}
                </p>
              </div>
            )}

            {/* Opção de Notificação */}
            <div className="p-5 glass-card rounded-xl border border-accent/20 bg-accent/5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="notify-cancel-client"
                  checked={notifyCancelClient}
                  onCheckedChange={(checked) => setNotifyCancelClient(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="notify-cancel-client"
                    className="text-base font-medium cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-accent" />
                    Notificar cliente sobre o cancelamento
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se marcado, o cliente receberá um email/WhatsApp informando sobre o cancelamento
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px]"
              >
                Voltar
              </Button>
              <GradientButton
                variant="accent"
                onClick={handleConfirmCancel}
                className="flex-1 h-12 sm:h-11 text-base min-h-[44px] bg-destructive/80 hover:bg-destructive text-destructive-foreground"
              >
                <XCircle className="h-5 w-5 mr-2" />
                Confirmar Cancelamento
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
