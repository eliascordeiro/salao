"use client";

import { useEffect, useState } from "react";
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
  Minus,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface PlanInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  featuresList?: string[];
}

export default function LandingPage() {
  const [plan, setPlan] = useState<PlanInfo | null>(null);
  const [seats, setSeats] = useState(2);

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((plans: PlanInfo[]) => {
        if (plans && plans.length > 0) setPlan(plans[0]);
      })
      .catch(() => {});
  }, []);

  const pricePerSeat = plan?.price ?? 39.9;
  const total = pricePerSeat * seats;

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
                <Button size="lg" className="gap-2 text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-5 sm:py-6 w-full group shadow-lg shadow-primary/25 h-auto">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex-shrink-0" />
                  <span className="whitespace-nowrap">Encontrar Salões</span>
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 group-hover:translate-x-1 transition-transform flex-shrink-0" />
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
            
            {/* Cobrança — Simples, transparente e por cadeira */}
            <div className="mt-12 sm:mt-16 md:mt-20 mb-12 sm:mb-16">
              <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10 md:mb-12 px-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4">
                  <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span>Cobrança 100% transparente</span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
                  Um único plano, <span className="text-primary">todos os recursos liberados</span>
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                  Você paga só pelo número de profissionais (cadeiras) do seu salão.
                  Sem letras miúdas, sem taxa escondida.
                </p>
              </div>

              <div className="max-w-3xl mx-auto">
                <GlassCard className="p-6 sm:p-8 md:p-10 border-2 border-primary/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl rounded-full -z-10" />

                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6 sm:mb-8">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3">
                        <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Plano {plan?.name || "Premium"}</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-bold">
                          R$ {pricePerSeat.toFixed(2)}
                        </span>
                        <span className="text-sm sm:text-base text-muted-foreground">
                          / profissional / mês
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                        Ex.: 1 profissional = R$ {pricePerSeat.toFixed(2)}/mês. 5 profissionais = R$ {(pricePerSeat * 5).toFixed(2)}/mês.
                      </p>
                    </div>

                    {/* Calculadora rápida de cadeiras */}
                    <div className="w-full md:w-auto bg-background-alt/50 rounded-xl p-4 sm:p-5 border border-border/50">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 text-center md:text-left">
                        Simule para o seu salão
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 shrink-0"
                          onClick={() => setSeats((s) => Math.max(1, s - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="text-center min-w-[90px]">
                          <div className="text-2xl font-bold">{seats}</div>
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            profissional{seats > 1 ? "is" : ""}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-9 w-9 p-0 shrink-0"
                          onClick={() => setSeats((s) => s + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs sm:text-sm text-muted-foreground">Total: </span>
                        <span className="text-lg sm:text-xl font-bold text-primary">
                          R$ {total.toFixed(2)}/mês
                        </span>
                      </div>
                    </div>
                  </div>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
                    {[
                      "Todas as funcionalidades liberadas, sem plano limitado",
                      "Agendamentos e profissionais ilimitados",
                      "Pagamentos online, WhatsApp e relatórios avançados",
                      "Chat com IA e suporte prioritário",
                      "PIX (sem taxa) ou cartão de crédito via Mercado Pago",
                      "14 dias grátis para testar tudo antes de pagar",
                    ].map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 sm:gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-sm sm:text-base">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/cadastro-salao" className="flex-1">
                      <Button className="w-full" size="lg">
                        Começar grátis por 14 dias
                      </Button>
                    </Link>
                    <Link href="/planos" className="flex-1">
                      <Button className="w-full" size="lg" variant="outline">
                        Ver detalhes do plano
                      </Button>
                    </Link>
                  </div>
                </GlassCard>
              </div>

              {/* Fair Pricing Alert */}
              <div className="max-w-3xl mx-auto mt-6">
                <div className="p-4 sm:p-5 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-sm sm:text-base text-center">
                    <span className="font-semibold">💡 Como funciona:</span> você cresce, a cadeira acompanha — cadastrou mais um profissional, o valor do mês seguinte é recalculado automaticamente. Diminuiu a equipe? Paga menos. Sem plano fixo que não faz sentido pro tamanho do seu salão.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-center px-4">
              <Link href="/cadastro-salao">
                <Button size="lg" className="gap-2 group w-full sm:w-auto">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-12 transition-transform" />
                  Começar Grátis por 14 Dias
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                🎉 Sem cartão de crédito para começar. Acesso completo por 14 dias. Cancele quando quiser.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
