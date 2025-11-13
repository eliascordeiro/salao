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
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Mais de 500 salões cadastrados</span>
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight px-2">
              Encontre e agende em
              <br />
              seu <span className="text-primary">salão favorito</span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 sm:px-6">
              Milhares de horários disponíveis em salões e barbearias perto de você.
              Agende online em segundos, 24 horas por dia.
            </p>
            
            <div className="flex flex-col gap-3 sm:gap-4 justify-center px-4 sm:px-0 max-w-md mx-auto">
              <Link href="/saloes" className="w-full">
                <Button size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full group shadow-lg shadow-primary/25">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6" />
                  Encontrar Salões Próximos
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link 
                href="/cadastro-salao" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Briefcase className="h-3.5 w-3.5" />
                Sou proprietário de salão
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-8 sm:pt-12 max-w-2xl mx-auto px-2">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">500+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Salões</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">10k+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Agendamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold">⭐ 4.8</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Avaliação</div>
              </div>
            </div>
          </div>
        </section>
      </GridBackground>
      
      {/* Como Funciona - 3 Passos */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 px-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Agende em <span className="text-primary">3 passos simples</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Rápido, fácil e sem complicação
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <GlassCard className="p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl sm:text-6xl mb-4">🔍</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm mb-3">
                1
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Busque</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Encontre salões e barbearias perto de você
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl sm:text-6xl mb-4">📅</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm mb-3">
                2
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Escolha</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Selecione o serviço, profissional e horário ideal
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl sm:text-6xl mb-4">✅</div>
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm mb-3">
                3
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Confirme</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Receba confirmação por email e lembretes automáticos
              </p>
            </GlassCard>
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <Link href="/saloes">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Search className="h-5 w-5" />
                Começar Agora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Benefícios - Clientes */}
      <section className="py-12 sm:py-16 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-3 sm:mb-4 px-2">
            Por que agendar online?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
            Praticidade e conforto na palma da sua mão
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 max-w-4xl mx-auto">
            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Agende 24/7</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                A qualquer hora, de qualquer lugar. Sem depender de telefone ou WhatsApp
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Lembretes Automáticos</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Nunca mais esqueça! Receba confirmação e lembretes 24h antes
              </p>
            </GlassCard>

            <GlassCard className="p-5 sm:p-6 hover:shadow-xl transition-all duration-300">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3 sm:mb-4 flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Sem Conflitos</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Veja horários disponíveis em tempo real. Agende com segurança
              </p>
            </GlassCard>
          </div>

          <div className="text-center mt-8">
            <Link href="/saloes">
              <Button size="lg" className="gap-2 w-full sm:w-auto shadow-lg">
                <Search className="h-5 w-5" />
                Ver Salões Disponíveis
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Para Proprietários - Condensado */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8 sm:mb-10 px-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4">
                <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Para Proprietários de Salões</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                Modernize seu salão e <span className="text-primary">aumente o faturamento</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Plataforma completa de gestão com frente de caixa, relatórios e agendamento online automatizado
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-2 flex-shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Frente de Caixa</h3>
              </GlassCard>
              
              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2 flex-shrink-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Relatórios</h3>
              </GlassCard>
              
              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mb-2 flex-shrink-0">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Agenda Online</h3>
              </GlassCard>

              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-2 flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Pagamentos</h3>
              </GlassCard>
              
              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-2 flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Gestão de Equipe</h3>
              </GlassCard>
              
              <GlassCard className="p-4 sm:p-5 hover:shadow-lg transition-all">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center mb-2 flex-shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="font-semibold text-sm sm:text-base">Interface Premium</h3>
              </GlassCard>
            </div>
            
            {/* Pricing Section Before CTA */}
            <div className="mt-12 sm:mt-16 md:mt-20 mb-12 sm:mb-16">
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

              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-8">
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
                <GlassCard className="p-6 sm:p-7 md:p-8 hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full -z-10" />
                  <div className="mb-4 sm:mb-5 md:mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
                      <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span>Plano Pro</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">Assinatura Mensal</h3>
                    <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                      <span className="text-3xl sm:text-4xl font-bold">R$ 39</span>
                      <span className="text-sm sm:text-base text-muted-foreground">por mês</span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Cobrança inteligente: pague apenas se faturar mais de R$ 1.000 no mês.
                    </p>
                  </div>
                  <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-7 md:mb-8">
                    <li className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base">Tudo do plano gratuito</span>
                    </li>
                    <li className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base">Agendamentos ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base">Profissionais ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base">Suporte prioritário</span>
                    </li>
                    <li className="flex items-start gap-2.5 sm:gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm sm:text-base font-semibold">Cobrança condicional: só paga se faturar R$ 1.000+</span>
                    </li>
                  </ul>
                  <Link href="/cadastro-salao" className="block">
                    <Button className="w-full" size="lg" variant="default">
                      Iniciar Trial de 30 Dias
                    </Button>
                  </Link>
                </GlassCard>
              </div>

              {/* Fair Pricing Alert */}
              <div className="max-w-4xl mx-auto">
                <div className="p-4 sm:p-5 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm sm:text-base text-center">
                    <span className="font-semibold">💡 Sistema Justo:</span> Nos primeiros 30 dias é grátis. Depois, você só paga R$ 39/mês se seu salão faturar mais de R$ 1.000 no período. Faturou menos? Não paga nada naquele mês!
                  </p>
                </div>
              </div>
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
    </div>
  );
}
