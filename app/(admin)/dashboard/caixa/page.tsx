"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
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
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardHeader } from "@/components/dashboard/header";
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

export default function CaixaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DailyData | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [processing, setProcessing] = useState(false);

  // Carrega dados do dia
  const loadDailyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/cashier/daily-bookings");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao carregar dados");
      }
      const result = await response.json();
      console.log("Dados do caixa:", result); // Debug
      setData(result);
    } catch (error) {
      console.error("Erro ao carregar dados do caixa:", error);
      setError(error instanceof Error ? error.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDailyData();
  }, []);

  // Abre modal de fechamento
  const handleOpenCheckout = (client: Client) => {
    setSelectedClient(client);
    setDiscount(0);
    setPaymentMethod("");
    setShowCheckoutModal(true);
  };

  // Fecha a conta do cliente
  const handleCloseAccount = async () => {
    if (!selectedClient || !paymentMethod) return;

    setProcessing(true);
    try {
      console.log('🔄 Fechando conta...', {
        clientId: selectedClient.client.id,
        clientName: selectedClient.client.name,
        bookingIds: selectedClient.bookings.map((b) => b.id),
        discount,
        paymentMethod,
        subtotal: selectedClient.subtotal,
      });

      const response = await fetch("/api/cashier/close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.client.id,
          bookingIds: selectedClient.bookings.map((b) => b.id),
          discount,
          paymentMethod,
        }),
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
      await loadDailyData();
      
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
        {/* Dashboard Header */}
        {session?.user && (
          <DashboardHeader
            user={{
              name: session.user.name,
              email: session.user.email,
              role: session.user.role,
            }}
          />
        )}
        
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
          <Button onClick={loadDailyData} variant="outline">
            Tentar Novamente
          </Button>
        </GlassCard>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      {session?.user && (
        <DashboardHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      )}

      <div className="space-y-6">
      {/* Header com Botão Voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Frente de Caixa</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie o fechamento de contas dos clientes
            </p>
          </div>
        </div>
        <Button onClick={loadDailyData} variant="outline" size="sm">
          <Loader2 className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="text-lg font-semibold">
                {data?.date
                  ? format(new Date(data.date), "dd 'de' MMMM", { locale: ptBR })
                  : "-"}
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
              <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
              <p className="text-lg font-semibold">{data?.totalClients || 0}</p>
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
              <p className="text-lg font-semibold">{data?.totalBookings || 0}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Lista de Clientes */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Clientes do Dia</h2>
        </div>

        {!data?.clients || data.clients.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <p className="text-lg font-medium text-foreground mb-2">
              Nenhum atendimento hoje
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Os agendamentos com status "Confirmado" aparecerão aqui para fechamento de conta.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">
                Aguardando atendimentos do dia {data?.date ? format(new Date(data.date), "dd/MM/yyyy", { locale: ptBR }) : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {data.clients.map((clientData) => (
              <GlassCard
                key={clientData.client.id}
                className="p-5 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info do Cliente */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{clientData.client.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {clientData.client.email}
                        </p>
                      </div>
                    </div>

                    {/* Lista de Serviços */}
                    <div className="space-y-2 pl-13">
                      {clientData.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.service.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {booking.staff.name}
                            </Badge>
                          </div>
                          <span className="font-medium">
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
                  <div>
                    {clientData.hasOpenSession ? (
                      <Badge variant="outline" className="bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Pago
                      </Badge>
                    ) : (
                      <Button
                        onClick={() => handleOpenCheckout(clientData)}
                        className="min-w-[140px]"
                      >
                        <DollarSign className="h-4 w-4 mr-2" />
                        Fechar Conta
                      </Button>
                    )}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Modal de Checkout */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fechar Conta</DialogTitle>
            <DialogDescription>
              Finalize o pagamento do cliente {selectedClient?.client.name}
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-6 py-4">
              {/* Resumo de Serviços */}
              <div className="space-y-3">
                <Label>Serviços Prestados</Label>
                <div className="space-y-2">
                  {selectedClient.bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between text-sm p-3 rounded-lg bg-background-alt/50"
                    >
                      <div>
                        <p className="font-medium">{booking.service.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.staff.name}
                        </p>
                      </div>
                      <span className="font-medium">
                        R$ {booking.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desconto */}
              <div className="space-y-2">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max={selectedClient.subtotal}
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-2">
                <Label htmlFor="payment">Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="payment">
                    <SelectValue placeholder="Selecione..." />
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
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R$ {selectedClient.subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-red-500">- R$ {discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">R$ {calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckoutModal(false)}
                  disabled={processing}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCloseAccount}
                  disabled={processing || !paymentMethod}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar Pagamento
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
