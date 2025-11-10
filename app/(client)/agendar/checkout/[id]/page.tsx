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
  Calendar,
  Clock,
  DollarSign,
  User,
  Briefcase,
  CreditCard,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  totalPrice: number;
  notes?: string | null;
  service: {
    id: string;
    name: string;
    description?: string | null;
    duration: number;
    price: number;
  };
  staff: {
    id: string;
    name: string;
    specialty?: string | null;
  };
  salon: {
    id: string;
    name: string;
    address: string;
    phone: string;
  };
  payment?: {
    id: string;
    status: string;
    amount: number;
  } | null;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do agendamento
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=${encodeURIComponent(`/agendar/checkout/${bookingId}`)}`);
      return;
    }

    loadBooking();
  }, [bookingId, status, router]);

  async function loadBooking() {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`);
      
      if (!response.ok) {
        throw new Error("Agendamento não encontrado");
      }

      const data = await response.json();
      setBooking(data);

      // Verificar se já foi pago
      if (data.payment && data.payment.status === "COMPLETED") {
        router.push(`/meus-agendamentos`);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamento:", error);
      setError(error instanceof Error ? error.message : "Erro ao carregar agendamento");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayment() {
    if (!booking) return;

    setProcessing(true);
    setError(null);

    try {
      // Criar sessão de checkout no Stripe
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar checkout");
      }

      // Redirecionar para o Stripe Checkout
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      setError(error instanceof Error ? error.message : "Erro ao processar pagamento");
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <GridBackground>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GridBackground>
    );
  }

  if (error && !booking) {
    return (
      <GridBackground>
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <ArrowLeft className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Agendamento não encontrado</h1>
            <p className="text-foreground-muted mb-6">{error}</p>
            <Button onClick={() => router.push("/meus-agendamentos")}>
              Voltar para Meus Agendamentos
            </Button>
          </GlassCard>
        </div>
      </GridBackground>
    );
  }

  if (!booking) return null;

  return (
    <GridBackground>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/meus-agendamentos")}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Meus Agendamentos
          </Button>

          <h1 className="text-3xl font-bold mb-2">Pagamento do Agendamento</h1>
          <p className="text-foreground-muted">
            Complete o pagamento para confirmar seu agendamento
          </p>
        </div>

        <div className="grid gap-6">
          {/* Resumo do Agendamento */}
          <GlassCard className="p-6" glow="primary">
            <h2 className="text-xl font-semibold mb-4">Resumo do Agendamento</h2>

            <div className="space-y-4">
              {/* Serviço */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                    Serviço
                  </p>
                  <p className="font-semibold text-lg">{booking.service.name}</p>
                  <p className="text-sm text-foreground-muted mt-1">
                    {booking.service.duration} minutos • R$ {booking.service.price.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Profissional */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                    Profissional
                  </p>
                  <p className="font-semibold text-lg">{booking.staff.name}</p>
                  {booking.staff.specialty && (
                    <p className="text-sm text-foreground-muted mt-1">
                      {booking.staff.specialty}
                    </p>
                  )}
                </div>
              </div>

              {/* Data e Horário */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-success/5">
                <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                    Data e horário
                  </p>
                  <p className="font-semibold text-lg">
                    {format(new Date(booking.date), "EEEE, dd 'de' MMMM 'de' yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p className="text-sm text-foreground-muted mt-1">às {booking.time}</p>
                </div>
              </div>

              {/* Local */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-info/5">
                <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-foreground-muted uppercase tracking-wider mb-1">
                    Local
                  </p>
                  <p className="font-semibold text-lg">{booking.salon.name}</p>
                  <p className="text-sm text-foreground-muted mt-1">{booking.salon.address}</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total a pagar:</span>
                <span className="text-3xl font-bold text-primary">
                  R$ {booking.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Segurança */}
          <GlassCard className="p-6 bg-success/5 border-success/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Pagamento Seguro</h3>
                <ul className="space-y-2 text-sm text-foreground-muted">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Processado pelo Stripe (certificado PCI-DSS)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Seus dados de cartão são criptografados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    Não armazenamos informações do seu cartão
                  </li>
                </ul>
              </div>
            </div>
          </GlassCard>

          {/* Erro */}
          {error && (
            <GlassCard className="p-4 bg-destructive/10 border-destructive/20">
              <p className="text-destructive font-medium">{error}</p>
            </GlassCard>
          )}

          {/* Botão de Pagamento */}
          <GradientButton
            size="lg"
            onClick={handlePayment}
            disabled={processing}
            className="w-full text-lg py-6"
          >
            {processing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Pagar R$ {booking.totalPrice.toFixed(2)}
              </>
            )}
          </GradientButton>

          <p className="text-center text-sm text-foreground-muted">
            Ao clicar em "Pagar", você será redirecionado para o checkout seguro do Stripe
          </p>
        </div>
      </div>
    </GridBackground>
  );
}
