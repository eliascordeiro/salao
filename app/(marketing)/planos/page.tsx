"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  features: string[];
  active: boolean;
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/plans")
      .then((res) => res.json())
      .then((data) => {
        setPlans(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao buscar planos:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Planos e Preços
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha o plano ideal para seu salão
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece com 14 dias grátis. Cancele quando quiser, sem compromisso.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.slug === "profissional";
            
            return (
              <Card
                key={plan.id}
                className={`relative p-8 ${
                  isPopular
                    ? "border-primary shadow-xl shadow-primary/20"
                    : ""
                }`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Crown className="h-3 w-3 mr-1" />
                    Mais Popular
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      R$ {plan.price.toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/checkout?plan=${plan.slug}`}>
                  <Button
                    size="lg"
                    className="w-full"
                    variant={isPopular ? "default" : "outline"}
                  >
                    Começar agora
                  </Button>
                </Link>

                <p className="text-xs text-center text-muted-foreground mt-4">
                  14 dias grátis • Cancele quando quiser
                </p>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Não há
                multas ou taxas de cancelamento.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">
                Como funciona o período de teste?
              </h3>
              <p className="text-sm text-muted-foreground">
                Você tem 14 dias para testar todas as funcionalidades do plano
                escolhido. Se não gostar, cancele antes do fim do período e não
                será cobrado.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">
                Quais formas de pagamento são aceitas?
              </h3>
              <p className="text-sm text-muted-foreground">
                Aceitamos PIX (sem taxa adicional) e cartão de crédito via Mercado
                Pago.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-sm text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer
                momento através do painel administrativo.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
