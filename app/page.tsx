import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Scissors, Star, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header/Navbar */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scissors className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AgendaSalão</span>
          </div>
          <div className="hidden md:flex gap-6 items-center">
            <Link href="#recursos" className="text-gray-600 hover:text-blue-600 transition">
              Recursos
            </Link>
            <Link href="#como-funciona" className="text-gray-600 hover:text-blue-600 transition">
              Como Funciona
            </Link>
            <Link href="#precos" className="text-gray-600 hover:text-blue-600 transition">
              Preços
            </Link>
            <Link href="/login">
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button>Começar Grátis</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Sistema completo de agendamento</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Transforme seu Salão em um
            <span className="text-blue-600"> Negócio Digital</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Facilite a vida dos seus clientes com agendamento online 24/7. 
            Aumente seus lucros, reduza faltas e profissionalize sua gestão.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg">
              <Calendar className="mr-2 h-5 w-5" />
              Experimente Grátis
            </Button>
            <Button size="lg" variant="outline" className="text-lg">
              Ver Demonstração
            </Button>
          </div>
          
          <div className="mt-12 flex justify-center gap-12 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">98%</div>
              <div className="text-gray-600">Satisfação</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">+5k</div>
              <div className="text-gray-600">Salões</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">+50k</div>
              <div className="text-gray-600">Agendamentos/mês</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Tudo que você precisa para crescer
          </h2>
          <p className="text-xl text-gray-600">
            Ferramentas profissionais para gerenciar seu salão com facilidade
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Agendamento Online</CardTitle>
              <CardDescription>
                Seus clientes agendam quando quiserem, de onde estiverem. 
                Disponível 24 horas por dia.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Clock className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Lembretes Automáticos</CardTitle>
              <CardDescription>
                Reduza faltas em até 70% com lembretes por SMS, WhatsApp ou email.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Gestão de Clientes</CardTitle>
              <CardDescription>
                Histórico completo, preferências e análise de comportamento dos seus clientes.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Star className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Avaliações</CardTitle>
              <CardDescription>
                Colete feedback dos clientes e construa sua reputação online.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Scissors className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Catálogo de Serviços</CardTitle>
              <CardDescription>
                Mostre seus serviços com fotos, preços e duração de cada atendimento.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-blue-300 transition">
            <CardHeader>
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <CardTitle>Múltiplos Profissionais</CardTitle>
              <CardDescription>
                Gerencie a agenda de toda sua equipe em um único lugar.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Pronto para modernizar seu salão?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Comece hoje mesmo e tenha 30 dias grátis para testar
          </p>
          <Button size="lg" variant="outline" className="bg-white text-blue-600 hover:bg-blue-50 border-0 text-lg">
            Criar Minha Conta Grátis
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">AgendaSalão</span>
          </div>
          <p className="mb-4">Sistema completo de agendamento para salões e barbearias</p>
          <p className="text-sm">&copy; 2025 AgendaSalão. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
