'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { CheckCircle2, Calendar, CreditCard, Clock, MapPin, User, Briefcase, ArrowRight, Home, Receipt } from 'lucide-react';
import { GridBackground } from '@/components/ui/grid-background';

interface PaymentDetails {
  booking: {
    id: string;
    date: string;
    status: string;
    service: {
      name: string;
      duration: number;
      price: number;
      description: string | null;
    };
    staff: {
      name: string;
      specialty: string | null;
    };
    salon: {
      name: string;
      address: string;
    };
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    stripePaymentId: string;
    createdAt: string;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (!sessionId) {
      setError('ID da sessão não encontrado');
      setLoading(false);
      return;
    }

    verifyPayment();
  }, [status, sessionId]);

  const verifyPayment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/verify-session?session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento');
      }

      const data = await response.json();
      setPaymentDetails(data);
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      setError('Não foi possível verificar o pagamento. Verifique em "Meus Agendamentos".');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <GridBackground />
        <GlassCard className="w-full max-w-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg">Verificando pagamento...</p>
        </GlassCard>
      </div>
    );
  }

  if (error || !paymentDetails) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <GridBackground />
        <GlassCard className="w-full max-w-2xl p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Erro ao Verificar Pagamento</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <GradientButton
              onClick={() => router.push('/meus-agendamentos')}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Ver Meus Agendamentos
            </GradientButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  const { booking, payment } = paymentDetails;

  return (
    <div className="min-h-screen relative py-12 px-4">
      <GridBackground />
      
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header de Sucesso */}
        <GlassCard className="p-8 text-center">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-success" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Pagamento Confirmado! 🎉
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Seu agendamento foi pago com sucesso
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 border border-success/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-success" />
            <span className="font-semibold text-success">
              {formatCurrency(payment.amount)}
            </span>
          </div>
        </GlassCard>

        {/* Detalhes do Agendamento */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            Detalhes do Agendamento
          </h2>

          <div className="space-y-4">
            {/* Serviço */}
            <div className="flex items-start gap-3 p-4 bg-background-alt/50 rounded-lg border border-primary/10">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-semibold">{booking.service.name}</p>
                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {booking.service.duration} min
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(booking.service.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Profissional */}
            <div className="flex items-start gap-3 p-4 bg-background-alt/50 rounded-lg border border-accent/10">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Profissional</p>
                <p className="font-semibold">{booking.staff.name}</p>
                {booking.staff.specialty && (
                  <p className="text-sm text-muted-foreground">{booking.staff.specialty}</p>
                )}
              </div>
            </div>

            {/* Data e Horário */}
            <div className="flex items-start gap-3 p-4 bg-background-alt/50 rounded-lg border border-success/10">
              <div className="w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Data e Horário</p>
                <p className="font-semibold">{formatDate(booking.date)}</p>
              </div>
            </div>

            {/* Local */}
            <div className="flex items-start gap-3 p-4 bg-background-alt/50 rounded-lg border border-info/10">
              <div className="w-10 h-10 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Local</p>
                <p className="font-semibold">{booking.salon.name}</p>
                <p className="text-sm text-muted-foreground">{booking.salon.address}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Informações do Pagamento */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Informações do Pagamento
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">ID da Transação</span>
              <span className="font-mono text-sm">{payment.id.slice(0, 16)}...</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Status</span>
              <span className="px-3 py-1 bg-success/20 text-success text-sm font-medium rounded-full">
                Pago
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-muted-foreground">Data do Pagamento</span>
              <span className="text-sm">
                {new Intl.DateTimeFormat('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(payment.createdAt))}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 font-semibold text-lg">
              <span>Total Pago</span>
              <span className="text-success">{formatCurrency(payment.amount)}</span>
            </div>
          </div>
        </GlassCard>

        {/* Próximos Passos */}
        <GlassCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Próximos Passos
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Um email de confirmação foi enviado para você</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Você receberá um lembrete 24h antes do agendamento</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Compareça no horário agendado para ser atendido</span>
            </li>
          </ul>
        </GlassCard>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          <GradientButton
            onClick={() => router.push('/meus-agendamentos')}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Ver Meus Agendamentos
            <ArrowRight className="w-4 h-4" />
          </GradientButton>
          
          <GradientButton
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao Início
          </GradientButton>
        </div>

        {/* Suporte */}
        <p className="text-center text-sm text-muted-foreground">
          Tem alguma dúvida? Entre em contato com o salão ou{' '}
          <a href="/contato" className="text-primary hover:underline">
            fale conosco
          </a>
        </p>
      </div>
    </div>
  );
}
