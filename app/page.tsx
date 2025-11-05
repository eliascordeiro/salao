"use client";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
import { Calendar, Clock, Scissors, Star, Users, Sparkles, Menu, X, ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header/Navbar - Railway Style */}
      <nav className="border-b border-border/50 glass-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">AgendaSalão</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8 items-center">
              <Link href="#recursos" className="text-foreground-muted hover:text-primary transition-colors">
                Recursos
              </Link>
              <Link href="#como-funciona" className="text-foreground-muted hover:text-primary transition-colors">
                Como Funciona
              </Link>
              <Link href="#precos" className="text-foreground-muted hover:text-primary transition-colors">
                Preços
              </Link>
              <Link href="/login">
                <Button variant="outline" className="border-border-hover hover:bg-background-alt">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <GradientButton variant="primary" className="px-6 py-2">
                  Começar Grátis
                </GradientButton>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground-muted hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 animate-fadeIn">
              <div className="flex flex-col gap-4">
                <Link 
                  href="#recursos" 
                  className="text-foreground-muted hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Recursos
                </Link>
                <Link 
                  href="#como-funciona" 
                  className="text-foreground-muted hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Como Funciona
                </Link>
                <Link 
                  href="#precos" 
                  className="text-foreground-muted hover:text-primary transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Preços
                </Link>
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="w-full border-border-hover">Entrar</Button>
                </Link>
                <Link href="/register" className="w-full">
                  <GradientButton variant="primary" className="w-full px-6 py-2">
                    Começar Grátis
                  </GradientButton>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section - Railway Style */}
      <GridBackground>
        <section className="container mx-auto px-4 py-32 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 glass-card px-5 py-2 rounded-full mb-8 animate-fadeIn">
              <Sparkles className="h-4 w-4 text-accent animate-pulseGlow" />
              <span className="text-sm font-medium text-foreground-muted">Sistema completo de agendamento</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-foreground mb-8 animate-fadeInUp">
              Transforme seu Salão em um{" "}
              <AnimatedText gradient="primary" animation="fadeInUp" className="inline-block">
                Negócio Digital
              </AnimatedText>
            </h1>
            
            <p className="text-xl text-foreground-muted mb-12 max-w-3xl mx-auto leading-relaxed animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              Facilite a vida dos seus clientes com agendamento online 24/7. 
              Aumente seus lucros, reduza faltas e profissionalize sua gestão com tecnologia de ponta.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
              <Link href="/register">
                <GradientButton variant="primary" className="px-8 py-4 text-lg group">
                  <Calendar className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Experimente Grátis
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </Link>
              <Link href="#recursos">
                <Button size="lg" variant="outline" className="text-lg border-border-hover hover:bg-background-alt px-8 py-4">
                  Ver Demonstração
                </Button>
              </Link>
            </div>
            
            {/* Stats com glass effect */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 animate-fadeInUp" style={{ animationDelay: "600ms" }}>
              <GlassCard hover glow="primary" className="text-center">
                <div className="text-5xl font-bold gradient-text-primary mb-2">98%</div>
                <div className="text-foreground-muted font-medium">Satisfação dos Clientes</div>
              </GlassCard>
              <GlassCard hover glow="accent" className="text-center">
                <div className="text-5xl font-bold gradient-text-accent mb-2">+5k</div>
                <div className="text-foreground-muted font-medium">Salões Ativos</div>
              </GlassCard>
              <GlassCard hover glow="success" className="text-center">
                <div className="text-5xl font-bold text-success mb-2">+50k</div>
                <div className="text-foreground-muted font-medium">Agendamentos/mês</div>
              </GlassCard>
            </div>
          </div>
        </section>
      </GridBackground>

      {/* Features Section - Railway Style */}
      <section id="recursos" className="container mx-auto px-4 py-32">
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-foreground mb-6">
            Tudo que você precisa para{" "}
            <AnimatedText gradient="accent">crescer</AnimatedText>
          </h2>
          <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
            Ferramentas profissionais para gerenciar seu salão com facilidade e tecnologia de ponta
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-primary rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Agendamento Online</h3>
            <p className="text-foreground-muted leading-relaxed">
              Seus clientes agendam quando quiserem, de onde estiverem. 
              Disponível 24 horas por dia, 7 dias por semana.
            </p>
          </GlassCard>

          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-accent rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Clock className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Lembretes Automáticos</h3>
            <p className="text-foreground-muted leading-relaxed">
              Reduza faltas em até 70% com lembretes automáticos por email. 
              Notificações 24h antes do agendamento.
            </p>
          </GlassCard>

          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-success rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Gestão de Clientes</h3>
            <p className="text-foreground-muted leading-relaxed">
              Histórico completo, preferências e análise de comportamento dos seus clientes.
              Fidelize com experiência personalizada.
            </p>
          </GlassCard>

          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-primary rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Pagamento Online</h3>
            <p className="text-foreground-muted leading-relaxed">
              Integração completa com Stripe. Receba pagamentos online de forma segura.
              Confirmação automática via webhooks.
            </p>
          </GlassCard>

          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-accent rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Relatórios Avançados</h3>
            <p className="text-foreground-muted leading-relaxed">
              Analytics completo com gráficos e métricas. 
              Acompanhe receita, taxa de conversão e serviços mais populares.
            </p>
          </GlassCard>

          <GlassCard hover className="group">
            <div className="p-3 bg-gradient-success rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">Múltiplos Profissionais</h3>
            <p className="text-foreground-muted leading-relaxed">
              Gerencie a agenda de toda sua equipe em um único lugar.
              Horários personalizados e gestão de disponibilidade.
            </p>
          </GlassCard>
        </div>
      </section>

      {/* CTA Section - Railway Style */}
      <section className="relative py-32 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-primary opacity-20" />
        <GridBackground className="absolute inset-0" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <GlassCard glow="primary" className="max-w-4xl mx-auto p-12">
            <h2 className="text-5xl font-bold text-foreground mb-6">
              Pronto para{" "}
              <AnimatedText gradient="primary">modernizar</AnimatedText>
              {" "}seu salão?
            </h2>
            <p className="text-xl text-foreground-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Comece hoje mesmo e transforme a gestão do seu negócio. 
              Experimente grátis por 30 dias, sem cartão de crédito.
            </p>
            <Link href="/register">
              <GradientButton variant="primary" className="px-12 py-5 text-lg group">
                Criar Minha Conta Grátis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </Link>
            
            {/* Features mini */}
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span>Sem cartão de crédito</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Suporte 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                <span>Cancele quando quiser</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer - Railway Style */}
      <footer className="border-t border-border/50 py-12 bg-background-alt">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Scissors className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-foreground">AgendaSalão</span>
            </div>
            
            <p className="text-foreground-muted max-w-md">
              Sistema completo de agendamento para salões e barbearias. 
              Tecnologia profissional para impulsionar seu negócio.
            </p>
            
            <div className="flex gap-6 text-sm text-foreground-muted">
              <Link href="#recursos" className="hover:text-primary transition-colors">
                Recursos
              </Link>
              <Link href="#como-funciona" className="hover:text-primary transition-colors">
                Como Funciona
              </Link>
              <Link href="#precos" className="hover:text-primary transition-colors">
                Preços
              </Link>
              <Link href="/login" className="hover:text-primary transition-colors">
                Login
              </Link>
            </div>
            
            <div className="border-t border-border/50 w-full pt-6 mt-4">
              <p className="text-sm text-foreground-muted">
                &copy; 2025 AgendaSalão. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
