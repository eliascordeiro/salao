"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Search, HelpCircle, MessageCircle, Mail } from "lucide-react";
import Link from "next/link";

const FAQ_DATA = [
  {
    category: "Para Clientes",
    questions: [
      {
        q: "Como faço para agendar um serviço?",
        a: "É simples! Navegue pelos salões disponíveis, escolha o serviço desejado, selecione o profissional e o horário. Você receberá uma confirmação por email.",
      },
      {
        q: "Posso cancelar meu agendamento?",
        a: "Sim! Acesse 'Meus Agendamentos', encontre o agendamento e clique em 'Cancelar'. Recomendamos avisar com antecedência.",
      },
      {
        q: "Como faço o pagamento?",
        a: "Você pode pagar online via cartão de crédito/débito através do Stripe, ou diretamente no salão após o atendimento.",
      },
      {
        q: "Não recebi email de confirmação. O que fazer?",
        a: "Verifique sua caixa de spam. Se não encontrar, entre em contato conosco através do WhatsApp ou formulário de contato.",
      },
      {
        q: "Posso remarcar um agendamento?",
        a: "Sim! Cancele o agendamento atual e faça um novo. Em breve teremos a função de remarcação direta.",
      },
    ],
  },
  {
    category: "Para Proprietários de Salões",
    questions: [
      {
        q: "Como cadastro meu salão na plataforma?",
        a: "Clique em 'Cadastrar Salão', preencha os dados (nome, endereço, horários) e crie sua conta. Após aprovação, seu salão estará visível.",
      },
      {
        q: "Quanto custa usar a plataforma?",
        a: "Temos planos flexíveis. O plano básico é gratuito com recursos essenciais. Planos pagos oferecem funcionalidades avançadas.",
      },
      {
        q: "Como adiciono meus profissionais e serviços?",
        a: "No painel administrativo, vá em 'Profissionais' e 'Serviços' para cadastrar. Você pode associar profissionais aos serviços que eles oferecem.",
      },
      {
        q: "Posso bloquear horários específicos?",
        a: "Sim! Na página de cada profissional, acesse 'Disponibilidade' para bloquear horários de almoço, folgas ou eventos especiais.",
      },
      {
        q: "Como vejo os relatórios financeiros?",
        a: "Acesse 'Dashboard > Financeiro' para visualizar receitas, despesas, lucro e gráficos detalhados por período.",
      },
      {
        q: "Posso ter múltiplos usuários no sistema?",
        a: "Sim! Você pode criar contas para sua equipe com permissões personalizadas (visualizar, editar, etc).",
      },
    ],
  },
  {
    category: "Pagamentos e Cobrança",
    questions: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Aceitamos cartões de crédito e débito via Stripe. Pagamentos presenciais também podem ser registrados no sistema.",
      },
      {
        q: "O pagamento é seguro?",
        a: "Sim! Usamos Stripe, uma das plataformas de pagamento mais seguras do mundo, com criptografia de ponta.",
      },
      {
        q: "Posso solicitar reembolso?",
        a: "Sim, em casos de cancelamento com antecedência ou problemas no atendimento. Entre em contato conosco.",
      },
      {
        q: "Como recebo os pagamentos do meu salão?",
        a: "Os pagamentos são processados via Stripe e transferidos para sua conta bancária automaticamente.",
      },
    ],
  },
  {
    category: "Suporte Técnico",
    questions: [
      {
        q: "O sistema funciona no celular?",
        a: "Sim! Nossa plataforma é 100% responsiva e funciona perfeitamente em smartphones e tablets.",
      },
      {
        q: "Esqueci minha senha. Como recupero?",
        a: "Na página de login, clique em 'Esqueci minha senha' e siga as instruções enviadas por email.",
      },
      {
        q: "Meus horários não estão aparecendo corretamente.",
        a: "Verifique se configurou os horários de trabalho do profissional e se não há bloqueios ativos. Se persistir, entre em contato.",
      },
      {
        q: "Como atualizo os dados do meu salão?",
        a: "Vá em 'Dashboard > Meu Salão' e edite as informações (endereço, telefone, horários, fotos).",
      },
    ],
  },
  {
    category: "Privacidade e Segurança",
    questions: [
      {
        q: "Meus dados estão seguros?",
        a: "Sim! Seguimos as melhores práticas de segurança e criptografia. Seus dados nunca são compartilhados sem consentimento.",
      },
      {
        q: "Posso excluir minha conta?",
        a: "Sim. Entre em contato conosco e processaremos a exclusão conforme a LGPD.",
      },
      {
        q: "Como vocês usam meus dados?",
        a: "Apenas para fornecer nossos serviços. Leia nossa Política de Privacidade para detalhes completos.",
      },
    ],
  },
];

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFAQ, setFilteredFAQ] = useState(FAQ_DATA);

  const handleSearch = (term: string) => {
    setSearchTerm(term);

    if (!term.trim()) {
      setFilteredFAQ(FAQ_DATA);
      return;
    }

    const filtered = FAQ_DATA.map((category) => ({
      ...category,
      questions: category.questions.filter(
        (item) =>
          item.q.toLowerCase().includes(term.toLowerCase()) ||
          item.a.toLowerCase().includes(term.toLowerCase())
      ),
    })).filter((category) => category.questions.length > 0);

    setFilteredFAQ(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold mb-4">Central de Ajuda</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encontre respostas rápidas para as perguntas mais comuns
          </p>
        </div>

        {/* Search */}
        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Busque sua dúvida..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Accordion */}
        {filteredFAQ.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Nenhum resultado encontrado para "{searchTerm}"
              </p>
              <Button onClick={() => handleSearch("")}>Limpar Busca</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredFAQ.map((category, idx) => (
              <Card key={idx} className="glass-card">
                <CardContent className="pt-6">
                  <h2 className="text-2xl font-bold mb-4">{category.category}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <Card className="glass-card mt-12 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10">
          <CardContent className="pt-8 pb-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Não encontrou o que procurava?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está pronta para ajudar você!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/contato">
                  <Mail className="w-5 h-5 mr-2" />
                  Abrir Ticket de Suporte
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                onClick={() =>
                  window.open(
                    "https://wa.me/5511999999999?text=Olá!%20Preciso%20de%20ajuda",
                    "_blank"
                  )
                }
              >
                <a>
                  <MessageCircle className="w-5 h-5 mr-2" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="mb-2">Links úteis:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/termos" className="hover:text-primary">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-primary">
              Política de Privacidade
            </Link>
            <Link href="/" className="hover:text-primary">
              Página Inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
