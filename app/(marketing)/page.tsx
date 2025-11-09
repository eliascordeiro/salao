"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GridBackground } from "@/components/ui/grid-background";
import {
  Calendar,
  Search,
  Star,
  Users,
  Briefcase,
  TrendingUp,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  MapPin,
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
            
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Encontre o{" "}
              <span className="text-primary">salão perfeito</span>
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              para você
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
              Descubra, compare e agende serviços nos melhores salões e barbearias
              da sua região. Tudo em um só lugar, de forma rápida e segura.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
              <Link href="/saloes" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  Buscar Salões
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/cadastro-salao" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="gap-2 text-base sm:text-lg px-6 sm:px-8 w-full sm:w-auto">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5" />
                  Cadastrar Meu Salão
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 sm:pt-12 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">1000+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Salões Parceiros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">50k+</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Agendamentos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-primary">4.8</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Avaliação Média</div>
              </div>
            </div>
          </div>
        </section>
      </GridBackground>
      
      {/* Como Funciona - Clientes */}
      <section className="py-12 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              Como Funciona para Você
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg px-4">
              Agende seu horário em 3 passos simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <Card className="p-6 text-center space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Search className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">1. Busque</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Encontre salões próximos a você, filtre por serviço e veja avaliações reais
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">2. Agende</h3>
              <p className="text-muted-foreground">
                Escolha o serviço, profissional e horário que melhor se encaixa na sua agenda
              </p>
            </Card>
            
            <Card className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">3. Aproveite</h3>
              <p className="text-muted-foreground">
                Compareça no horário marcado e curta seu momento. Depois, avalie sua experiência
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Benefícios - Clientes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">
                  Por que usar o AgendaSalão?
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Agende a qualquer hora</h3>
                      <p className="text-muted-foreground">
                        Marque seu horário 24/7, mesmo fora do expediente
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Sem ligações ou espera</h3>
                      <p className="text-muted-foreground">
                        Esqueça filas telefônicas. Agende em poucos cliques
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Avaliações verificadas</h3>
                      <p className="text-muted-foreground">
                        Veja opiniões reais de outros clientes antes de agendar
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Lembretes automáticos</h3>
                      <p className="text-muted-foreground">
                        Receba notificações para não esquecer seu horário
                      </p>
                    </div>
                  </div>
                </div>
                
                <Link href="/saloes">
                  <Button size="lg" className="gap-2">
                    Começar Agora
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
              
              <div className="relative">
                <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <MapPin className="h-32 w-32 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Para Proprietários */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Tem um salão ou barbearia?
              </h2>
              <p className="text-muted-foreground text-lg">
                Aumente seus agendamentos e gerencie seu negócio com facilidade
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Mais Clientes</h3>
                <p className="text-muted-foreground">
                  Seja descoberto por milhares de clientes em potencial na sua região
                </p>
              </Card>
              
              <Card className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Gestão Completa</h3>
                <p className="text-muted-foreground">
                  Dashboard profissional para gerenciar serviços, profissionais e agendamentos
                </p>
              </Card>
              
              <Card className="p-6 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Pagamentos Online</h3>
                <p className="text-muted-foreground">
                  Receba pagamentos de forma segura direto na plataforma
                </p>
              </Card>
            </div>
            
            <div className="text-center mt-12">
              <Link href="/cadastro-salao">
                <Button size="lg" className="gap-2">
                  <Briefcase className="h-5 w-5" />
                  Cadastrar Meu Salão Gratuitamente
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground mt-4">
                Sem taxas de adesão. Comece grátis hoje mesmo!
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Final */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="p-12 text-center space-y-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para transformar sua experiência?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já descobriram uma forma mais inteligente
              de agendar serviços de beleza
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/saloes">
                <Button size="lg" className="gap-2">
                  <Search className="h-5 w-5" />
                  Buscar Salões Agora
                </Button>
              </Link>
              <Link href="/cadastro-salao">
                <Button size="lg" variant="outline" className="gap-2">
                  <Briefcase className="h-5 w-5" />
                  Sou Proprietário
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
