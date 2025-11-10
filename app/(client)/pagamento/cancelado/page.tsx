'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { GlassCard } from '@/components/ui/glass-card';
import { GradientButton } from '@/components/ui/gradient-button';
import { XCircle, Calendar, CreditCard, ArrowRight, Home, RotateCcw } from 'lucide-react';
import { GridBackground } from '@/components/ui/grid-background';

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const bookingId = searchParams.get('booking_id');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <GridBackground />
        <GlassCard className="w-full max-w-2xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg">Carregando...</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <GridBackground />
      
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header de Cancelamento */}
        <GlassCard className="p-8 text-center">
          <div className="w-20 h-20 bg-warning/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-warning" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-muted-foreground text-lg mb-4">
            Você cancelou o processo de pagamento
          </p>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning/10 border border-warning/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-warning" />
            <span className="font-semibold text-warning">
              Nenhuma cobrança foi realizada
            </span>
          </div>
        </GlassCard>

        {/* Informações */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">O que aconteceu?</h2>
          
          <div className="space-y-3 text-muted-foreground">
            <p>
              O processo de pagamento foi interrompido e nenhuma cobrança foi realizada no seu cartão.
            </p>
            <p>
              Seu agendamento ainda está ativo e aguardando pagamento. Você pode tentar pagar novamente a qualquer momento.
            </p>
          </div>
        </GlassCard>

        {/* Próximos Passos */}
        <GlassCard className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <h3 className="font-semibold mb-3">Próximos Passos</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Acesse "Meus Agendamentos" para ver seu agendamento</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Clique em "Pagar Agendamento" para tentar novamente</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">•</span>
              <span>Se preferir, você pode cancelar o agendamento</span>
            </li>
          </ul>
        </GlassCard>

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3">
          {bookingId && (
            <GradientButton
              onClick={() => router.push(`/agendar/checkout/${bookingId}`)}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Tentar Pagar Novamente
              <ArrowRight className="w-4 h-4" />
            </GradientButton>
          )}
          
          <GradientButton
            onClick={() => router.push('/meus-agendamentos')}
            variant="outline"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Meus Agendamentos
          </GradientButton>
        </div>

        <div className="flex justify-center">
          <GradientButton
            onClick={() => router.push('/dashboard')}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao Início
          </GradientButton>
        </div>

        {/* Suporte */}
        <p className="text-center text-sm text-muted-foreground">
          Encontrou algum problema?{' '}
          <a href="/contato" className="text-primary hover:underline">
            Entre em contato
          </a>
        </p>
      </div>
    </div>
  );
}
