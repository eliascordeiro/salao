"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Crown, Loader2, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  features: string[];
  featuresList?: string[];
  active: boolean;
}

export default function PlanosPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [seats, setSeats] = useState(2);
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
            Um único plano, sem letras miúdas
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Você paga só pelo tamanho da sua equipe
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Todas as funcionalidades liberadas para qualquer assinante. 14 dias grátis. Cancele quando quiser.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid gap-8 max-w-md mx-auto">
          {plans.map((plan) => {
            const isPopular = true;
            const total = plan.price * seats;
            
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
                    Plano único
                  </Badge>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      R$ {plan.price.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground">/cadeira/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pague apenas pelo número de profissionais do seu salão.
                  </p>
                </div>

                {/* Calculadora de cadeiras */}
                <div className="bg-background-alt/50 rounded-xl p-4 mb-6 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 text-center">
                    Quantos profissionais tem seu salão?
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
                      <div className="text-[10px] text-muted-foreground">
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
                    <span className="text-xs text-muted-foreground">Sua mensalidade: </span>
                    <span className="text-xl font-bold text-primary">
                      R$ {total.toFixed(2)}/mês
                    </span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.featuresList?.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={`/checkout?plan=${plan.slug}&seats=${seats}`}>
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

        {/* Fair Pricing */}
        <div className="max-w-md mx-auto mt-6">
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
            <p className="text-sm text-center">
              <span className="font-semibold">💡 Como funciona:</span> a
              mensalidade é recalculada automaticamente conforme o número de
              profissionais ativos no seu salão. Cresceu a equipe? O valor sobe.
              Diminuiu? Você paga menos, sem precisar trocar de plano.
            </p>
          </div>
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
