"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format, addDays, subDays, startOfDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  Receipt,
  CheckCircle2,
  Loader2,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeft,
  X,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  RefreshCw,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Booking {
  id: string;
  date: string;
  service: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  staff: {
    id: string;
    name: string;
    specialty: string | null;
  };
  price: number;
  status: string;
}

interface Client {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  bookings: Booking[];
  subtotal: number;
  hasOpenSession: boolean;
  sessionId: string | null;
}

interface DailyData {
  date: string;
  totalClients: number;
  totalBookings: number;
  clients: Client[];
}

// Funções auxiliares para formatação de moeda
function formatCurrencyInput(value: string): string {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  if (!numbers) return '';
  
  // Converte para número com 2 casas decimais
  const amount = parseInt(numbers) / 100;
  
  // Formata no padrão brasileiro
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseCurrencyInput(formatted: string): number {
  if (!formatted) return 0;
  
  // Remove pontos (separador de milhar) e substitui vírgula por ponto
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  
  return isNaN(value) ? 0 : value;
}

export default function CaixaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [pendingData, setPendingData] = useState<DailyData | null>(null);
  const [historyData, setHistoryData] = useState<DailyData | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountDisplay, setDiscountDisplay] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set());

  // Funções de navegação de data
  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  // Carrega dados pendentes (OPEN)
  const loadPendingData = useCallback(async (date: Date) => {
    try {
      const dateParam = format(date, "yyyy-MM-dd");
      console.log('🔵 Carregando pendentes para:', dateParam, 'selectedDate:', date);
      const response = await fetch(`/api/cashier/daily-bookings?date=${dateParam}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar dados");
      }
      const result = await response.json();
      console.log('✅ Pendentes carregados:', result);
      setPendingData(result);
    } catch (error) {
      console.error("Erro ao carregar pendentes:", error);
      throw error;
    }
  }, []);

  // Carrega histórico (CLOSED)
  const loadHistoryData = useCallback(async (date: Date) => {
    try {
      const dateParam = format(date, "yyyy-MM-dd");
      console.log('🟢 Carregando histórico para:', dateParam, 'selectedDate:', date);
      const response = await fetch(`/api/cashier/history?date=${dateParam}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar histórico");
      }
      const result = await response.json();
      console.log('✅ Histórico carregado:', result);
      setHistoryData(result);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      throw error;
    }
  }, []);

  // Carrega ambos
  const loadAllData = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadPendingData(date), loadHistoryData(date)]);
    } catch (error) {
      console.error("Erro ao carregar dados do caixa:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [loadPendingData, loadHistoryData]);

  // Recarregar quando data muda
  useEffect(() => {
    loadAllData(selectedDate);
  }, [selectedDate]);

  // Abre modal de fechamento
  const handleOpenCheckout = (client: Client) => {
    setSelectedClient(client);
    setDiscount(0);
    setDiscountDisplay('');
    setPaymentMethod("");
    // Inicializa todos os bookings como selecionados (default "sim")
    setSelectedBookings(new Set(client.bookings.map(b => b.id)));
    setShowCheckoutModal(true);
  };

  // Alterna seleção de um serviço
  const toggleBookingSelection = (bookingId: string) => {
    setSelectedBookings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(bookingId)) {
        newSet.delete(bookingId);
      } else {
        newSet.add(bookingId);
      }
      return newSet;
    });
  };

  // Calcula subtotal apenas dos serviços selecionados
  const getSelectedSubtotal = () => {
    if (!selectedClient) return 0;
    return selectedClient.bookings
      .filter(b => selectedBookings.has(b.id))
      .reduce((sum, b) => sum + b.price, 0);
  };

  // Fecha a conta do cliente
  const handleCloseAccount = async () => {
    if (!selectedClient || !paymentMethod) return;

    // Valida se ao menos um serviço foi selecionado
    if (selectedBookings.size === 0) {
      alert("Selecione pelo menos um serviço para fechar a conta.");
      return;
    }

    setProcessing(true);
    try {
      console.log('🔄 Fechando conta...', {
        sessionId: selectedClient.sessionId,
        clientId: selectedClient.client.id,
        clientName: selectedClient.client.name,
        selectedBookingIds: Array.from(selectedBookings),
        allBookingIds: selectedClient.bookings.map((b) => b.id),
        discount,
        paymentMethod,
        selectedSubtotal: getSelectedSubtotal(),
      });

      const body: any = {
        clientId: selectedClient.client.id,
        bookingIds: Array.from(selectedBookings), // Apenas os selecionados
        discount,
        paymentMethod,
      };

      // Se já existe uma sessão OPEN, passa o sessionId para atualizar
      if (selectedClient.sessionId) {
        body.sessionId = selectedClient.sessionId;
      }

      const response = await fetch("/api/cashier/close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao fechar conta: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      // Fecha modal e recarrega dados
      setShowCheckoutModal(false);
      setSelectedClient(null);
      await loadAllData(selectedDate);
      
      // Aqui poderia abrir um modal de comprovante
      alert(`Conta fechada com sucesso! Total: R$ ${result.session.total.toFixed(2)}`);
    } catch (error) {
      console.error("Erro ao fechar conta:", error);
      alert("Erro ao fechar conta. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  // Calcula total com desconto
  const calculateTotal = () => {
    if (!selectedClient) return 0;
    return Math.max(0, selectedClient.subtotal - discount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Frente de Caixa</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o fechamento de contas dos clientes
          </p>
        </div>
        <GlassCard className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-semibold">Erro ao carregar dados</p>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
          <Button onClick={() => loadAllData(selectedDate)} variant="outline">
            Tentar Novamente
          </Button>
        </GlassCard>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="hover:bg-primary/10 flex-shrink-0 w-10 h-10 p-0"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Frente de Caixa</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              Gerencie o fechamento de contas dos clientes
            </p>
          </div>
        </div>
        
        {/* Botão Atualizar */}
        <Button 
          onClick={() => loadAllData(selectedDate)} 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto"
          title="Atualizar dados"
        >
          <RefreshCw className="h-4 w-4 sm:mr-2" />
          <span className="hidden xs:inline">Atualizar</span>
        </Button>
      </div>

      {/* Navegação de Data */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Data Atual - Aparece primeiro em mobile */}
          <div className="flex-1 text-center sm:order-2 min-w-0">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                {/* Formato completo para desktop */}
                <p className="hidden md:block text-base md:text-lg font-bold text-foreground">
                  {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </p>
                {/* Formato abreviado para mobile/tablet */}
                <p className="md:hidden text-sm sm:text-base font-bold text-foreground">
                  {format(selectedDate, "EEE, dd/MM", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(selectedDate, "yyyy")}
                </p>
              </div>
            </div>
          </div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:order-1">
            {/* Botão Anterior */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousDay}
              className="flex-1 sm:flex-initial flex-shrink-0 min-h-[44px]"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 sm:order-3">
            {/* Botão Próximo */}
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextDay}
              className="flex-1 sm:flex-initial flex-shrink-0 min-h-[44px]"
              disabled={isToday(selectedDate)}
            >
              <span className="hidden sm:inline">Próximo</span>
              <ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>

            {/* Botão Hoje */}
            {!isToday(selectedDate) && (
              <Button
                variant="default"
                size="sm"
                onClick={goToToday}
                className="flex-1 sm:flex-initial flex-shrink-0 min-h-[44px]"
              >
                <Calendar className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Hoje</span>
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === "pending"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pendentes
            {pendingData && pendingData.totalClients > 0 && (
              <Badge variant="default" className="ml-1">
                {pendingData.totalClients}
              </Badge>
            )}
          </div>
          {activeTab === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 sm:px-6 py-3 font-medium transition-colors relative whitespace-nowrap ${
            activeTab === "history"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Histórico
            {historyData && historyData.totalClients > 0 && (
              <Badge variant="outline" className="ml-1">
                {historyData.totalClients}
              </Badge>
            )}
          </div>
          {activeTab === "history" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Stats do Dia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="text-lg font-semibold">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {activeTab === "pending" ? "Clientes Pendentes" : "Sessões Pagas"}
              </p>
              <p className="text-lg font-semibold">
                {(activeTab === "pending" ? pendingData?.totalClients : historyData?.totalSessions) || 0}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Serviços Prestados</p>
              <p className="text-lg font-semibold">
                {(activeTab === "pending" ? pendingData?.totalBookings : historyData?.totalBookings) || 0}
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                {activeTab === "pending" ? "A Receber" : "Recebido"}
              </p>
              <p className="text-lg font-semibold text-green-500">
                R$ {((activeTab === "pending" 
                  ? pendingData?.clients?.reduce((sum: number, c: any) => sum + c.subtotal, 0)
                  : historyData?.totalRevenue) || 0).toFixed(2)}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Lista de Clientes */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {activeTab === "pending" ? (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <h2 className="text-lg sm:text-xl font-semibold">
              {activeTab === "pending" ? "Aguardando Pagamento" : "Pagamentos Realizados"}
            </h2>
          </div>

          {/* Campo de Busca */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Renderizar baseado na tab ativa */}
        {activeTab === "pending" ? (
          // Tab Pendentes
          (() => {
            console.log('🔵 Renderizando TAB PENDENTES - dados:', pendingData?.clients?.length, 'clientes');
            const filteredClients = pendingData?.clients?.filter((client: any) =>
              client.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              client.client.email.toLowerCase().includes(searchTerm.toLowerCase())
            ) || [];

            return !filteredClients || filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum pagamento pendente"}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {searchTerm 
                    ? "Tente buscar por outro nome ou email."
                    : "Os agendamentos completados aparecerão aqui aguardando pagamento."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((clientData: any) => (
              <GlassCard
                key={clientData.sessionId || clientData.client.id}
                className="p-4 sm:p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Info do Cliente */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{clientData.client.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {clientData.client.email}
                        </p>
                        {clientData.sessionId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ID: {clientData.sessionId.slice(0, 8)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Lista de Serviços */}
                    <div className="space-y-2 pl-0 sm:pl-13">
                      {clientData.bookings.map((booking: Booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">{booking.service.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {booking.staff.name}
                            </Badge>
                          </div>
                          <span className="font-medium text-primary sm:text-foreground">
                            R$ {booking.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {clientData.subtotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Botão de Ação */}
                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-auto">
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 whitespace-nowrap flex-shrink-0">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Aguardando Pagamento</span>
                      <span className="sm:hidden">Aguardando</span>
                    </Badge>
                    <Button
                      onClick={() => handleOpenCheckout(clientData)}
                      size="sm"
                      className="flex-1 lg:w-full min-h-[44px]"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Receber
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))}
            </div>
            );
          })()
        ) : (
          // Tab Histórico
          (() => {
            console.log('🟢 Renderizando TAB HISTÓRICO - dados:', historyData?.clients?.length, 'sessões');
            const filteredClients = historyData?.clients?.filter((client: any) =>
              client.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              client.client.email.toLowerCase().includes(searchTerm.toLowerCase())
            ) || [];

            return !filteredClients || filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "Nenhum cliente encontrado" : "Nenhum pagamento realizado hoje"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchTerm 
                    ? "Tente buscar por outro nome ou email."
                    : "Os pagamentos finalizados hoje aparecerão neste histórico."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredClients.map((clientData: any) => (
                <GlassCard
                  key={clientData.sessionId}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Info do Cliente */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{clientData.client.name}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {clientData.client.email}
                          </p>
                          {clientData.sessionId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ID: {clientData.sessionId.slice(0, 8)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Lista de Serviços */}
                      <div className="space-y-2 pl-0 sm:pl-13">
                        {clientData.bookings.map((booking: Booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="font-medium">{booking.service.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {booking.staff.name}
                              </Badge>
                            </div>
                            <span className="font-medium text-green-500 sm:text-foreground">
                              R$ {booking.price.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Subtotal */}
                      <div className="flex items-center justify-between pt-3 border-t border-primary/10">
                        <span className="font-semibold">Subtotal</span>
                        <span className="text-lg font-bold">
                          R$ {clientData.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Desconto */}
                      {clientData.discount > 0 && (
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>Desconto</span>
                          <span>- R$ {clientData.discount.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Total Pago */}
                      <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                        <span className="font-semibold">Total Pago</span>
                        <span className="text-xl font-bold text-green-500">
                          R$ {clientData.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Badge e Info de Pagamento */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:items-end w-full lg:w-auto">
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 whitespace-nowrap flex-shrink-0">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Pago
                      </Badge>
                      {clientData.paymentMethod && (
                        <div className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {clientData.paymentMethod === "CASH" && "💵 Dinheiro"}
                          {clientData.paymentMethod === "CARD" && "💳 Cartão"}
                          {clientData.paymentMethod === "PIX" && "📱 PIX"}
                          {clientData.paymentMethod === "MULTIPLE" && "💰 Múltiplos"}
                        </div>
                      )}
                      {clientData.paidAt && (
                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap ml-auto lg:ml-0">
                          {new Date(clientData.paidAt).getUTCHours().toString().padStart(2, '0')}:{new Date(clientData.paidAt).getUTCMinutes().toString().padStart(2, '0')}
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
            );
          })()
        )}
      </GlassCard>

      {/* Modal de Checkout */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[92vh] sm:max-h-[90vh] flex flex-col p-4 sm:p-6">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-xl sm:text-2xl">Fechar Conta</DialogTitle>
            <DialogDescription className="text-sm sm:text-base">
              Finalize o pagamento do cliente <span className="font-semibold">{selectedClient?.client.name}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4 sm:space-y-6 py-3 sm:py-4 overflow-y-auto flex-1">
              {/* Resumo de Serviços */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="text-sm sm:text-base font-semibold">Serviços Prestados</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedBookings(
                          new Set(selectedClient.bookings.map((b) => b.id))
                        )
                      }
                      className="flex-1 sm:flex-initial min-h-[40px]"
                    >
                      <Check className="h-4 w-4 sm:mr-1" />
                      <span className="hidden xs:inline">Todos</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedBookings(new Set())}
                      className="flex-1 sm:flex-initial min-h-[40px]"
                    >
                      <X className="h-4 w-4 sm:mr-1" />
                      <span className="hidden xs:inline">Nenhum</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedClient.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border-2 transition-colors ${
                        selectedBookings.has(booking.id)
                          ? "bg-primary/10 border-primary/50"
                          : "bg-background-alt/50 border-transparent"
                      }`}
                    >
                      <Checkbox
                        checked={selectedBookings.has(booking.id)}
                        onCheckedChange={() => toggleBookingSelection(booking.id)}
                        id={`booking-${booking.id}`}
                        className="flex-shrink-0"
                      />
                      <label
                        htmlFor={`booking-${booking.id}`}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <p className="font-medium text-sm sm:text-base truncate">{booking.service.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {booking.staff.name}
                        </p>
                      </label>
                      <span className="font-medium text-sm sm:text-base flex-shrink-0">
                        R$ {booking.price.toFixed(2)}
                      </span>
                      {selectedBookings.has(booking.id) && (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground text-center py-1 bg-muted/30 rounded">
                  <span className="font-semibold">{selectedBookings.size}</span> de <span className="font-semibold">{selectedClient.bookings.length}</span>{" "}
                  serviço(s) selecionado(s)
                </div>
              </div>

              {/* Desconto */}
              <div className="space-y-2">
                <Label htmlFor="discount" className="text-sm sm:text-base font-semibold">Desconto (R$)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    R$
                  </span>
                  <Input
                    id="discount"
                    type="text"
                    inputMode="decimal"
                    value={discountDisplay}
                    onChange={(e) => {
                      const formatted = formatCurrencyInput(e.target.value);
                      setDiscountDisplay(formatted);
                      const numericValue = parseCurrencyInput(formatted);
                      setDiscount(numericValue);
                    }}
                    placeholder="0,00"
                    className="h-11 text-base pl-10"
                  />
                </div>
                {discount > getSelectedSubtotal() && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Desconto não pode ser maior que o subtotal
                  </p>
                )}
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="payment" className="text-sm sm:text-base font-semibold">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment" className="h-11">
                    <SelectValue placeholder="Selecione o método..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4" />
                        <span>Dinheiro</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="CARD">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Cartão</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PIX">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <span>PIX</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MULTIPLE">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Múltiplos</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Totais */}
              <div className="space-y-2 pt-3 sm:pt-4 border-t-2 border-primary/20">
                <div className="flex items-center justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R$ {getSelectedSubtotal().toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-500 font-medium">- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg sm:text-xl font-bold pt-2 border-t-2 border-primary/20">
                  <span>Total</span>
                  <span className="text-primary text-xl sm:text-2xl">
                    R$ {(getSelectedSubtotal() - discount).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckoutModal(false)}
                  disabled={processing}
                  className="flex-1 min-h-[48px] text-base order-2 sm:order-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleCloseAccount}
                  disabled={processing || !paymentMethod || selectedBookings.size === 0}
                  className="flex-1 min-h-[48px] text-base order-1 sm:order-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
