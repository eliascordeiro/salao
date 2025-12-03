"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Calendar, CreditCard, Home } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatus {
  id: string;
  status: string;
  planName: string;
  planPrice: number;
  startDate: string | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  paymentMethod: string;
}

export default function SuccessPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aguarda alguns segundos para o webhook processar
    const timer = setTimeout(() => {
      fetch("/api/subscriptions/status")
        .then((res) => res.json())
        .then((data) => {
          console.log("📥 Resposta da API:", data);
          setSubscription(data.subscription); // A API retorna { subscription: {...} }
          setLoading(false);
        })
        .catch((error) => {
          console.error("❌ Erro ao carregar status:", error);
          setLoading(false);
        });
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Card className="p-8 max-w-md text-center">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Processando pagamento...</h2>
          <p className="text-muted-foreground">
            Aguarde enquanto confirmamos sua assinatura
          </p>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-green-500/10 rounded-full p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Sua assinatura foi ativada com sucesso
          </p>

          {/* Subscription Details */}
          {subscription && (
            <div className="space-y-4 mb-8">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-semibold">{subscription.planName}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-semibold">
                    R$ {(subscription.planPrice || 0).toFixed(2)}/mês
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={subscription.status === "ACTIVE" ? "default" : "secondary"}>
                    {subscription.status === "ACTIVE" ? "Ativa" : subscription.status}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Forma de pagamento</span>
                  <span className="font-semibold">
                    {subscription.paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"}
                  </span>
                </div>

                {subscription.trialEndsAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trial até</span>
                    <span className="font-semibold">
                      {formatDate(subscription.trialEndsAt)}
                    </span>
                  </div>
                )}

                {subscription.nextBillingDate && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Próxima cobrança</span>
                    <span className="font-semibold">
                      {formatDate(subscription.nextBillingDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                <Calendar className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">
                    🔄 Cobrança Recorrente Ativada
                  </p>
                  <p className="text-muted-foreground">
                    Você tem <strong>14 dias grátis</strong> para testar todas as funcionalidades do plano{" "}
                    <strong>{subscription.planName}</strong>. Após o período de teste, 
                    será cobrado automaticamente <strong>R$ {subscription.planPrice.toFixed(2)}/mês</strong> no 
                    cartão cadastrado. Você pode cancelar a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button size="lg" className="w-full" asChild>
              <Link href="/dashboard">
                <Home className="h-5 w-5 mr-2" />
                Ir para o Dashboard
              </Link>
            </Button>

            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/dashboard/assinatura/gerenciar">
                <CreditCard className="h-5 w-5 mr-2" />
                Gerenciar Assinatura
              </Link>
            </Button>
          </div>

          {/* Help */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Dúvidas? Entre em contato pelo{" "}
            <Link href="/contato" className="underline">
              suporte
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
