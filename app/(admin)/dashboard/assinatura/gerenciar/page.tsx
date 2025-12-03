"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CreditCard, 
  Calendar, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

interface SubscriptionDetails {
  id: string;
  status: string;
  planName: string;
  planPrice: number;
  startDate: string | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  paymentMethod: string;
  mpSubscriptionId: string | null;
}

interface PaymentHistory {
  id: string;
  amount: number;
  mpStatus: string;
  paymentMethod: string;
  paidAt: string | null;
  createdAt: string;
}

export default function ManageSubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [payments, setPayments] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      // Carregar dados da assinatura
      const subRes = await fetch("/api/subscriptions/status");
      const subData = await subRes.json();
      setSubscription(subData.subscription);

      // Carregar histórico de pagamentos
      const payRes = await fetch("/api/subscriptions/payments");
      const payData = await payRes.json();
      setPayments(payData.payments || []);

      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura?")) {
      return;
    }

    setCanceling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      });

      if (res.ok) {
        alert("Assinatura cancelada com sucesso!");
        loadSubscriptionData();
      } else {
        alert("Erro ao cancelar assinatura. Tente novamente.");
      }
    } catch (error) {
      alert("Erro ao cancelar assinatura. Tente novamente.");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhuma Assinatura Ativa</h2>
          <p className="text-muted-foreground mb-6">
            Você ainda não possui uma assinatura ativa.
          </p>
          <Link href="/planos">
            <Button>Ver Planos Disponíveis</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Badge className="bg-green-500">Ativa</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "SUSPENDED":
        return <Badge className="bg-orange-500">Suspensa</Badge>;
      case "CANCELED":
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura e histórico de pagamentos
        </p>
      </div>

      {/* Status da Assinatura */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Status da Assinatura</h2>
          {getStatusBadge(subscription.status)}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Plano Atual</p>
            <p className="font-semibold">{subscription.planName}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Valor Mensal</p>
            <p className="font-semibold">
              R$ {subscription.planPrice.toFixed(2)}
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">
              Forma de Pagamento
            </p>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <p className="font-semibold">
                {subscription.paymentMethod === "credit_card"
                  ? "Cartão de Crédito"
                  : "PIX"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-1">Início</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <p className="font-semibold">{formatDate(subscription.startDate)}</p>
            </div>
          </div>

          {subscription.trialEndsAt && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Trial até</p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <p className="font-semibold">
                  {formatDate(subscription.trialEndsAt)}
                </p>
              </div>
            </div>
          )}

          {subscription.nextBillingDate && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Próxima Cobrança
              </p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <p className="font-semibold">
                  {formatDate(subscription.nextBillingDate)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          <Link href="/planos">
            <Button variant="outline">Alterar Plano</Button>
          </Link>

          {subscription.status === "ACTIVE" && (
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Cancelar Assinatura"
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* Histórico de Pagamentos */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h2>

        {payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum pagamento registrado ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getPaymentStatusIcon(payment.mpStatus)}
                  <div>
                    <p className="font-medium">
                      R$ {payment.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(payment.paidAt || payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <Badge
                    variant={
                      payment.mpStatus === "approved"
                        ? "default"
                        : payment.mpStatus === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {payment.mpStatus === "approved"
                      ? "Aprovado"
                      : payment.mpStatus === "rejected"
                      ? "Rejeitado"
                      : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
