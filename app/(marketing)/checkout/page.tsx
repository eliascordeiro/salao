"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CreditCard, QrCode, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Força rendering dinâmico
export const dynamic = 'force-dynamic';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  features: string[];
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [planSlug, setPlanSlug] = useState<string | null>(null);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [processing, setProcessing] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  // Verificar se já tem assinatura ativa
  useEffect(() => {
    // TEMPORARIAMENTE DESABILITADO PARA TESTES
    /*
    fetch("/api/subscriptions/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.subscription && (data.subscription.status === "active" || data.subscription.status === "trialing")) {
          setHasActiveSubscription(true);
        }
      })
      .catch(() => {
        // Ignorar erro (usuário pode não estar logado)
      });
    */
  }, []);

  // Pegar planSlug apenas no cliente
  useEffect(() => {
    const slug = searchParams.get("plan");
    setPlanSlug(slug);
  }, [searchParams]);

  useEffect(() => {
    if (planSlug === null) return; // Aguardar planSlug ser definido
    
    if (!planSlug) {
      router.push("/planos");
      return;
    }

    fetch("/api/plans")
      .then((res) => res.json())
      .then((plans: Plan[]) => {
        const selectedPlan = plans.find((p) => p.slug === planSlug);
        if (!selectedPlan) {
          router.push("/planos");
          return;
        }
        setPlan(selectedPlan);
        setLoading(false);
      })
      .catch(() => {
        router.push("/planos");
      });
  }, [planSlug, router]);

  const handleCheckout = async () => {
    if (!plan) return;

    console.log("🚀 Iniciando checkout...", { planSlug: plan.slug, paymentMethod });
    setProcessing(true);

    try {
      console.log("📡 Enviando requisição para /api/subscriptions/create-preference...");
      const response = await fetch("/api/subscriptions/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planSlug: plan.slug,
          paymentMethod,
        }),
      });

      console.log("📨 Resposta recebida:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Erro na API:", error);
        alert(error.error || "Erro ao processar pagamento");
        setProcessing(false);
        return;
      }

      const data = await response.json();
      console.log("✅ Dados recebidos:", data);

      // Redirecionar para checkout do Mercado Pago
      const isProduction = window.location.hostname !== "localhost";
      const checkoutUrl = isProduction
        ? data.initPoint
        : data.sandboxInitPoint;

      console.log("🔗 Redirecionando para:", checkoutUrl);
      
      if (!checkoutUrl) {
        console.error("❌ URL de checkout não encontrada!", data);
        alert("Erro: URL de checkout não disponível");
        setProcessing(false);
        return;
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("💥 Erro fatal:", error);
      alert(`Erro ao processar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/planos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para planos
        </Link>

        {/* Alerta de assinatura ativa */}
        {hasActiveSubscription && (
          <Card className="p-6 mb-6 border-amber-500/50 bg-amber-500/10">
            <div className="flex items-start gap-3">
              <div className="shrink-0 text-amber-500">⚠️</div>
              <div>
                <h3 className="font-semibold mb-2">Você já possui uma assinatura ativa</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Para fazer upgrade ou alterar seu plano, entre em contato com o suporte ou cancele sua assinatura atual primeiro.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/assinatura")}>
                    Ver Minha Assinatura
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => router.push("/contato")}>
                    Falar com Suporte
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Resumo do Plano */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Resumo do Pedido</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Mensalidade</span>
                  <span className="font-semibold">
                    R$ {plan.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Período trial</span>
                  <Badge variant="secondary">14 dias grátis</Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total hoje</span>
                  <span className="text-2xl font-bold text-primary">R$ 0,00</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Primeira cobrança em 14 dias
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">Incluído no plano:</h4>
                <ul className="space-y-2">
                  {plan.features.slice(0, 5).map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 5 && (
                    <li className="text-sm text-muted-foreground">
                      + {plan.features.length - 5} outros recursos
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          {/* Forma de Pagamento */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Forma de Pagamento</h2>

            <div className="space-y-4">
              {/* PIX */}
              <button
                onClick={() => setPaymentMethod("pix")}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    paymentMethod === "pix" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">PIX</div>
                    <div className="text-sm text-muted-foreground">
                      Aprovação instantânea
                    </div>
                  </div>
                  {paymentMethod === "pix" && (
                    <Badge>Sem taxa adicional</Badge>
                  )}
                </div>
              </button>

              {/* Cartão de Crédito */}
              <button
                onClick={() => setPaymentMethod("credit_card")}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === "credit_card"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    paymentMethod === "credit_card" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Cartão de Crédito</div>
                    <div className="text-sm text-muted-foreground">
                      Renovação automática
                    </div>
                  </div>
                  {paymentMethod === "credit_card" && (
                    <Badge variant="secondary">Recomendado</Badge>
                  )}
                </div>
              </button>

              {/* Info */}
              <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                {paymentMethod === "pix" ? (
                  <>
                    <p className="font-semibold">Como funciona:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Gere o QR Code do PIX</li>
                      <li>• Pague pelo app do seu banco</li>
                      <li>• Confirmação em até 1 minuto</li>
                      <li>• Cobrança mensal via PIX</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Como funciona:</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Informe os dados do cartão</li>
                      <li>• Renovação automática todo mês</li>
                      <li>• Cancele quando quiser</li>
                      <li>• Processamento seguro via Mercado Pago</li>
                    </ul>
                  </>
                )}
              </div>

              {/* Botão Confirmar */}
              <Button
                size="lg"
                className="w-full"
                onClick={handleCheckout}
                disabled={processing || hasActiveSubscription}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : hasActiveSubscription ? (
                  "Você já possui uma assinatura ativa"
                ) : (
                  <>
                    {paymentMethod === "pix" ? (
                      <>
                        <QrCode className="h-5 w-5 mr-2" />
                        Gerar QR Code PIX
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" />
                        Ir para pagamento
                      </>
                    )}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Ao continuar, você concorda com nossos{" "}
                <Link href="/termos" className="underline">
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link href="/privacidade" className="underline">
                  Política de Privacidade
                </Link>
              </p>
            </div>
          </Card>
        </div>

        {/* Garantias */}
        <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Pagamento Seguro</h3>
            <p className="text-sm text-muted-foreground">
              Processado pelo Mercado Pago
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">✅</div>
            <h3 className="font-semibold mb-1">14 Dias Grátis</h3>
            <p className="text-sm text-muted-foreground">
              Teste sem compromisso
            </p>
          </div>
          <div>
            <div className="text-4xl mb-2">❌</div>
            <h3 className="font-semibold mb-1">Cancele Quando Quiser</h3>
            <p className="text-sm text-muted-foreground">
              Sem multas ou taxas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper com Suspense
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
