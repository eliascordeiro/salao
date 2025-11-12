"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import {
  Calendar,
  Search,
  Star,
  Users,
  User,
  Briefcase,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  MapPin,
  DollarSign,
  BarChart3,
  Bell,
  CreditCard,
  Clock,
  Sparkles,
  Crown,
  Check,
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <GridBackground>
        <section className="container mx-auto px-4 py-12 sm:py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <div className="inline-block">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">A maior plataforma de agendamentos do Brasil</span>
                <span className="xs:hidden">Agendamentos Online</span>
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight px-2">
              Transforme seu salão
              <br />
              em um <span className="text-primary">negócio digital</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-6">
              Plataforma completa com agendamento online, frente de caixa, relatórios analytics,
              sistema de assinaturas e pagamentos integrados. Tudo que você precisa em um só lugar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link href="/saloes" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto group">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Buscar Salões
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  Fazer Login
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 lg:gap-8 pt-8 sm:pt-12 max-w-2xl mx-auto px-2">
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">R$ 0</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Taxa de adesão</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">30 dias</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Trial gratuito</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-600 dark:text-amber-400">R$ 39</div>
                <div className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">Por mês depois</div>
              </div>
            </div>
          </div>
        </section>
      </GridBackground>
      
      {/* Features Section */}
      <section className="container px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Tudo que seu salão precisa em{" "}
            <span className="text-primary">
              uma única plataforma
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Ferramentas profissionais para modernizar sua gestão e aumentar seu faturamento
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-7xl mx-auto">
          {/* Cashier/POS */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Frente de Caixa</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Sistema completo de fechamento de contas com múltiplos métodos de pagamento, descontos e geração de recibos automáticos.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Pagamento em dinheiro, cartão e PIX</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Aplicação de descontos</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                <span>Histórico completo de transações</span>
              </li>
            </ul>
          </GlassCard>

          {/* Analytics */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Relatórios Analytics</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Dashboard profissional com gráficos, métricas de desempenho e relatórios exportáveis em CSV.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Acompanhamento de receita em tempo real</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Análise de serviços mais populares</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                <span>Exportação de dados para Excel</span>
              </li>
            </ul>
          </GlassCard>

          {/* Online Scheduling */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Agendamento Online</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Seus clientes agendam 24/7 através da plataforma, sem ligações ou mensagens. Tudo automatizado.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span>Disponível 24 horas por dia</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span>Confirmação automática por email</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                <span>Sistema anti-conflito de horários</span>
              </li>
            </ul>
          </GlassCard>

          {/* Payments */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Pagamentos Integrados</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Integração com Stripe para cobranças automáticas da plataforma com transparência total.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span>Cobrança automática mensal</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span>Cartão de crédito seguro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-500 flex-shrink-0" />
                <span>Histórico de faturas</span>
              </li>
            </ul>
          </GlassCard>

          {/* Notifications */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Notificações Automáticas</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Sistema de emails automáticos para confirmar, lembrar e atualizar clientes sobre agendamentos.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                <span>Confirmação imediata por email</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                <span>Lembretes 24h antes</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 flex-shrink-0" />
                <span>Avisos de cancelamento</span>
              </li>
            </ul>
          </GlassCard>

          {/* Premium UI */}
          <GlassCard className="p-4 sm:p-5 md:p-6 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Interface Premium</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
              Design moderno com efeitos glass morphism, animações 3D e experiência profissional.
            </p>
            <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 flex-shrink-0" />
                <span>Design responsivo mobile-first</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 flex-shrink-0" />
                <span>Tema claro e escuro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-rose-500 flex-shrink-0" />
                <span>Animações suaves</span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Planos{" "}
            <span className="text-primary">
              simples e transparentes
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
            Sem surpresas. Pague apenas pelo que usar com cobrança condicional inteligente.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
          {/* Free Trial */}
          <GlassCard className="p-6 sm:p-7 md:p-8 hover:shadow-2xl transition-all duration-300">
            <div className="mb-4 sm:mb-5 md:mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Recomendado para começar</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold mb-2">Trial Gratuito</h3>
              <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                <span className="text-3xl sm:text-4xl font-bold">R$ 0</span>
                <span className="text-sm sm:text-base text-muted-foreground">por 30 dias</span>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground">
                Teste todas as funcionalidades premium sem compromisso. Cancele quando quiser.
              </p>
            </div>
            <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-7 md:mb-8">
              <li className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm sm:text-base">Acesso completo a todas as funcionalidades</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm sm:text-base">Sistema de frente de caixa</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm sm:text-base">Relatórios e analytics</span>
              </li>
              <li className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm sm:text-base">Suporte por email</span>
              </li>
            </ul>
            <Link href="/cadastro-salao" className="block">
              <Button className="w-full" size="lg">
                Começar Grátis
              </Button>
            </Link>
          </GlassCard>

          {/* Paid Plan */}
          <GlassCard className="p-8 hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full -z-10" />
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Crown className="h-4 w-4" />
                Plano Pro
              </div>
              <h3 className="text-2xl font-bold mb-2">Assinatura Mensal</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold">R$ 39</span>
                <span className="text-muted-foreground">por mês</span>
              </div>
              <p className="text-muted-foreground">
                Cobrança inteligente: pague apenas se faturar mais de R$ 1.000 no mês.
              </p>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Tudo do plano gratuito</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Agendamentos ilimitados</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Profissionais ilimitados</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="font-medium">Cobrança condicional: só paga se faturar R$ 1.000+</span>
              </li>
            </ul>
            <Link href="/cadastro-salao">
              <Button className="w-full" size="lg" variant="default">
                Iniciar Trial de 30 Dias
              </Button>
            </Link>
          </GlassCard>
        </div>

        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 max-w-2xl mx-auto px-4">
          💡 <strong>Sistema Justo:</strong> Nos primeiros 30 dias é grátis. Depois, você só paga R$ 39/mês se seu salão faturar mais de R$ 1.000 no período. 
          Faturou menos? <strong>Não paga nada</strong> naquele mês!
        </p>
      </section>
      
      {/* Benefícios - Clientes */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-8 sm:mb-10 md:mb-12 px-2">
            Para <span className="text-primary">Clientes</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-5xl mx-auto">
            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Agende a Qualquer Hora</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Marque seu horário 24/7 sem precisar ligar ou esperar resposta no WhatsApp
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Encontre Salões Próximos</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Veja avaliações, fotos, serviços disponíveis e escolha o melhor para você
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Receba Lembretes</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Notificações automáticas por email 24h antes do seu horário marcado
              </p>
            </GlassCard>
          </div>

          <div className="text-center mt-6 sm:mt-8">
            <Link href="/saloes">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                Buscar Salões
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Para Proprietários */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 md:mb-12 px-2">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Para <span className="text-primary">Proprietários de Salões</span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                Modernize seu negócio com tecnologia profissional e aumente seu faturamento
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Controle Financeiro Total</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Frente de caixa completa, relatórios de receita, análise de performance e exportação de dados
                </p>
              </GlassCard>
              
              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Dashboard Profissional</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Gráficos em tempo real, métricas de crescimento, serviços mais populares e muito mais
                </p>
              </GlassCard>
              
              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Agenda Automatizada</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Agendamentos 24/7, confirmação automática, lembretes e zero conflitos de horário
                </p>
              </GlassCard>

              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Múltiplas Formas de Pagamento</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Aceite dinheiro, cartão, PIX ou múltiplos métodos no fechamento de conta
                </p>
              </GlassCard>
              
              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Gestão de Equipe</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Cadastre profissionais ilimitados, configure horários e vincule aos serviços oferecidos
                </p>
              </GlassCard>
              
              <GlassCard className="p-5 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-xl transition-all duration-300">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">Interface Premium</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Design moderno glass morphism que impressiona clientes e facilita o uso
                </p>
              </GlassCard>
            </div>
            
            <div className="text-center px-4">
              <Link href="/cadastro-salao">
                <Button size="lg" className="gap-2 group w-full sm:w-auto">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                  Começar Grátis por 30 Dias
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                🎉 Sem cartão de crédito. Acesso completo por 30 dias. Cancele quando quiser.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <GlassCard className="p-8 sm:p-10 md:p-12 text-center space-y-4 sm:space-y-5 md:space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full -z-10" />
            <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-gradient-to-br from-accent/20 to-primary/20 blur-3xl rounded-full -z-10" />
            
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold px-2">
              Pronto para{" "}
              <span className="text-primary">
                transformar seu salão?
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Junte-se aos salões que já modernizaram sua gestão com nossa plataforma completa.
              Experimente grátis por 30 dias e veja a diferença.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2 sm:pt-4 px-4">
              <Link href="/cadastro-salao" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 group w-full sm:w-auto">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                  Criar Minha Conta Grátis
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/saloes" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ver Demonstração
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
