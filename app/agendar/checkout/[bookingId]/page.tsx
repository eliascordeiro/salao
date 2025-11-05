import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
import CheckoutButton from "@/components/payments/CheckoutButton";
import PaymentStatus from "@/components/payments/PaymentStatus";
import { Calendar, Clock, User, Scissors, DollarSign, Shield, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface CheckoutPageProps {
  params: {
    bookingId: string;
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Buscar agendamento
  const booking = await prisma.booking.findUnique({
    where: {
      id: params.bookingId,
    },
    include: {
      service: true,
      staff: true,
      client: true,
      salon: true,
      payment: true,
    },
  });

  if (!booking) {
    redirect("/meus-agendamentos");
  }

  // Verificar se o usuário tem permissão
  if (
    booking.clientId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/meus-agendamentos");
  }

  // Se já foi pago, redirecionar
  if (booking.payment && booking.payment.status === "COMPLETED") {
    redirect("/meus-agendamentos");
  }

  // Se foi cancelado, redirecionar
  if (booking.status === "CANCELLED") {
    redirect("/meus-agendamentos");
  }

  const bookingDate = new Date(booking.date);
  const formattedDate = format(bookingDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(bookingDate, "HH:mm", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header Railway */}
          <div className="mb-8 animate-fadeInUp">
            <Link
              href="/meus-agendamentos"
              className="group inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-primary mb-4 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Voltar para agendamentos
            </Link>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              <span className="text-primary font-bold">Finalizar Pagamento</span>
            </h1>
            <p className="text-foreground-muted text-lg">
              Confirme os detalhes e realize o pagamento de forma segura
            </p>
          </div>

          {/* Status do Pagamento Existente Railway */}
          {booking.payment && (
            <GlassCard 
              className="p-6 mb-6 animate-fadeInUp border-primary/30"
              glow="primary"
              style={{ animationDelay: "100ms" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-2">
                    Status do Pagamento
                  </p>
                  <PaymentStatus status={booking.payment.status} />
                </div>
              </div>
            </GlassCard>
          )}

          <div className="grid gap-6">
            {/* Resumo do Agendamento Railway */}
            <GlassCard 
              className="p-8 animate-fadeInUp" 
              hover 
              glow="primary"
              style={{ animationDelay: "200ms" }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                Resumo do Agendamento
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Scissors className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Serviço
                    </p>
                    <p className="text-xl font-bold text-foreground">{booking.service.name}</p>
                    {booking.service.description && (
                      <p className="text-sm text-foreground-muted mt-2">
                        {booking.service.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Profissional
                    </p>
                    <p className="text-xl font-bold text-foreground">{booking.staff.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Data
                    </p>
                    <p className="text-xl font-bold text-foreground capitalize">{formattedDate}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-1">
                      Horário
                    </p>
                    <p className="text-xl font-bold text-foreground">
                      {formattedTime} <span className="text-foreground-muted text-base">({booking.service.duration} min)</span>
                    </p>
                  </div>
                </div>

                {booking.notes && (
                  <div className="pt-6 border-t border-border">
                    <p className="text-sm font-medium text-foreground-muted uppercase tracking-wide mb-2">
                      Observações
                    </p>
                    <p className="text-foreground">{booking.notes}</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Resumo do Pagamento Railway */}
            <GlassCard 
              className="p-8 animate-fadeInUp" 
              hover 
              glow="success"
              style={{ animationDelay: "300ms" }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
                Detalhes do Pagamento
              </h2>

              <div className="space-y-6">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-foreground-muted">Valor do serviço</span>
                  <span className="font-semibold text-foreground">
                    R$ {booking.service.price.toFixed(2)}
                  </span>
                </div>

                <div className="pt-6 border-t border-success/30">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-foreground">Total</span>
                    <span className="text-4xl font-bold text-success">
                      R$ {booking.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <CheckoutButton
                  bookingId={booking.id}
                  amount={booking.totalPrice}
                  disabled={
                    booking.payment?.status === "PROCESSING" ||
                    booking.payment?.status === "COMPLETED"
                  }
                />
              </div>
            </GlassCard>

            {/* Informações de Segurança Railway */}
            <GlassCard 
              className="p-8 bg-success/5 border-success/20 animate-fadeInUp" 
              style={{ animationDelay: "400ms" }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Pagamento Seguro
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-foreground-muted">
                      <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-success font-bold text-sm">✓</span>
                      </span>
                      Processamento seguro via Stripe
                    </li>
                    <li className="flex items-center gap-3 text-foreground-muted">
                      <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-success font-bold text-sm">✓</span>
                      </span>
                      Seus dados são criptografados
                    </li>
                    <li className="flex items-center gap-3 text-foreground-muted">
                      <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-success font-bold text-sm">✓</span>
                      </span>
                      Não armazenamos dados do cartão
                    </li>
                    <li className="flex items-center gap-3 text-foreground-muted">
                      <span className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-success font-bold text-sm">✓</span>
                      </span>
                      Confirmação por email
                    </li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </GridBackground>
    </div>
  );
}
