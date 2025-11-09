import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { AnimatedText } from "@/components/ui/animated-text";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  Zap,
  Shield,
  Users,
  TrendingUp,
  Heart,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function SobrePage() {
  return (
    <GridBackground>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">Sobre Nós</span>
            </div>
            
            <AnimatedText
              text="Transformando a gestão do tempo em experiências memoráveis"
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
            />
            
            <p className="text-xl text-foreground-muted max-w-3xl mx-auto leading-relaxed">
              Mais do que um sistema de agendamentos. Somos a ponte entre profissionais que 
              amam o que fazem e clientes que valorizam seu tempo.
            </p>
          </div>
        </section>

        {/* Story Section */}
        <section className="container mx-auto px-4 py-16">
          <GlassCard className="p-12 max-w-5xl mx-auto" glow="primary">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <Heart className="h-8 w-8 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-4">
                  <h2 className="text-3xl font-bold text-foreground">Nossa História</h2>
                  <div className="space-y-4 text-foreground-muted leading-relaxed">
                    <p>
                      Nascemos da observação de uma verdade simples: <strong className="text-foreground">o tempo é o recurso 
                      mais valioso que existe</strong>. Não pode ser comprado, armazenado ou recuperado. Cada minuto 
                      desperdiçado é uma oportunidade perdida de criar, conectar e crescer.
                    </p>
                    <p>
                      Em salões de beleza e barbearias, essa verdade se torna ainda mais evidente. Profissionais 
                      talentosos perdem tempo com ligações intermináveis, anotações em cadernos bagunçados e 
                      conflitos de horário. Clientes esperam, frustrados, por confirmações que nunca chegam. 
                      <strong className="text-foreground"> O caos organizacional rouba a alegria do trabalho bem feito</strong>.
                    </p>
                    <p>
                      Foi assim que surgiu nosso propósito: <strong className="text-primary">devolver o tempo para 
                      quem realmente importa</strong>. Tempo para o cabeleireiro aperfeiçoar sua técnica. Tempo 
                      para o barbeiro conversar com seu cliente. Tempo para o gestor expandir seu negócio. 
                      Tempo para o cliente relaxar sabendo que está tudo sob controle.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Nossos Valores
              </h2>
              <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                Os princípios que guiam cada decisão, cada linha de código, cada interação
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Valor 1 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Simplicidade Inteligente</h3>
                <p className="text-foreground-muted leading-relaxed">
                  Tecnologia poderosa não precisa ser complicada. Criamos interfaces tão intuitivas 
                  que qualquer pessoa pode dominar em minutos, não em semanas.
                </p>
              </GlassCard>

              {/* Valor 2 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Confiabilidade Absoluta</h3>
                <p className="text-foreground-muted leading-relaxed">
                  Seu negócio depende de nós. Por isso, construímos cada funcionalidade pensando 
                  em estabilidade, segurança e performance impecável.
                </p>
              </GlassCard>

              {/* Valor 3 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Empatia Genuína</h3>
                <p className="text-foreground-muted leading-relaxed">
                  Entendemos as dores reais de gestores e clientes. Cada feature nasce de conversas 
                  verdadeiras com quem vive o dia a dia dos salões.
                </p>
              </GlassCard>

              {/* Valor 4 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Evolução Constante</h3>
                <p className="text-foreground-muted leading-relaxed">
                  O mundo muda, as necessidades evoluem. Estamos sempre um passo à frente, 
                  inovando sem perder a essência que nos define.
                </p>
              </GlassCard>

              {/* Valor 5 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Precisão Impecável</h3>
                <p className="text-foreground-muted leading-relaxed">
                  Cada minuto conta. Nosso sistema sincroniza perfeitamente horários, notificações 
                  e disponibilidade para eliminar qualquer margem de erro.
                </p>
              </GlassCard>

              {/* Valor 6 */}
              <GlassCard hover className="p-8 space-y-4">
                <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Paixão pelo Detalhe</h3>
                <p className="text-foreground-muted leading-relaxed">
                  Acreditamos que a excelência está nos pequenos gestos. Cada animação, cada 
                  mensagem, cada notificação é cuidadosamente pensada.
                </p>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="container mx-auto px-4 py-16">
          <GlassCard className="p-12 max-w-5xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5" glow="accent">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-accent" />
                <h2 className="text-3xl font-bold text-foreground">Nossa Visão</h2>
              </div>
              
              <div className="space-y-4 text-lg text-foreground-muted leading-relaxed">
                <p>
                  Imaginamos um futuro onde <strong className="text-foreground">nenhum profissional de beleza 
                  precise se preocupar com agendas bagunçadas</strong>. Onde cada cliente sinta-se valorizado 
                  desde o primeiro clique. Onde tecnologia e humanidade se encontram para criar experiências 
                  extraordinárias.
                </p>
                <p>
                  Queremos ser a plataforma que <strong className="text-accent">empodera pequenos negócios 
                  a competirem com grandes redes</strong>, oferecendo a mesma profissionalização, organização 
                  e praticidade — mas mantendo o toque pessoal que faz toda a diferença.
                </p>
                <p className="text-xl font-semibold text-foreground">
                  Nossa missão é clara: <strong className="text-primary">transformar caos em harmonia, 
                  burocracia em simplicidade, e compromissos perdidos em relacionamentos duradouros</strong>.
                </p>
              </div>
            </div>
          </GlassCard>
        </section>

        {/* Features Highlight */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Por Que Nos Escolher?
              </h2>
              <p className="text-xl text-foreground-muted">
                Não somos apenas mais um software. Somos seu parceiro de crescimento.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "Inteligência Artificial nos Horários",
                  desc: "Nosso sistema aprende os padrões do seu negócio e sugere os melhores horários automaticamente"
                },
                {
                  title: "Notificações Inteligentes",
                  desc: "Lembretes automáticos que reduzem faltas em até 70%, mantendo sua agenda sempre otimizada"
                },
                {
                  title: "Gestão Multi-Profissional",
                  desc: "Controle completo de múltiplos profissionais, serviços e horários em uma única plataforma"
                },
                {
                  title: "Pagamentos Integrados",
                  desc: "Receba online de forma segura com Stripe, eliminando inadimplência e facilitando o controle financeiro"
                },
                {
                  title: "Relatórios Estratégicos",
                  desc: "Dashboards visuais que transformam dados em insights acionáveis para seu negócio crescer"
                },
                {
                  title: "Experiência Mobile Perfeita",
                  desc: "Interface responsiva que funciona perfeitamente em qualquer dispositivo, a qualquer hora"
                }
              ].map((feature, index) => (
                <GlassCard key={index} hover className="p-6 group">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-foreground-muted">{feature.desc}</p>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <GlassCard className="p-12 max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 to-accent/10" glow="primary">
            <div className="space-y-6">
              <Calendar className="h-16 w-16 text-primary mx-auto animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Pronto para Transformar seu Negócio?
              </h2>
              <p className="text-xl text-foreground-muted max-w-2xl mx-auto">
                Junte-se a centenas de profissionais que já descobriram a forma mais 
                inteligente de gerenciar agendamentos
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-primary hover:opacity-90 group">
                    Começar Gratuitamente
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/">
                  <Button size="lg" variant="outline" className="glass-card">
                    Ver Demonstração
                  </Button>
                </Link>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </GridBackground>
  );
}
