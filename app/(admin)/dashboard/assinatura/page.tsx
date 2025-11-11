"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  TrendingUp,
  FileText
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionData {
  subscription: {
    id: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    trialStartedAt: string | null;
    trialEndsAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    canceledAt: string | null;
  };
  plan: {
    name: string;
    price: number;
    interval: string;
  };
  revenue: {
    currentMonth: number;
    willBeCharged: boolean;
    nextChargeAmount: number;
  };
  trial: {
    isActive: boolean;
    daysLeft: number;
    percentage: number;
  };
  invoices: Array<{
    id: string;
    amount: number;
    status: string;
    monthlyRevenue: number;
    wasCharged: boolean;
    paidAt: string | null;
    periodStart: string;
    periodEnd: string;
  }>;
}

export default function AssinaturaPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  async function loadSubscriptionData() {
    try {
      const res = await fetch("/api/subscription/status");
      if (!res.ok) throw new Error("Erro ao carregar dados");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Erro ao carregar dados da assinatura");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao abrir portal");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
      setPortalLoading(false);
    }
  }

  async function setupStripeCustomer() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/subscription/create-customer", {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao configurar assinatura");
      }

      await loadSubscriptionData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error || "Erro ao carregar dados"}</AlertDescription>
      </Alert>
    );
  }

  const statusColors = {
    trialing: "bg-blue-500",
    active: "bg-green-500",
    past_due: "bg-yellow-500",
    canceled: "bg-red-500",
    paused: "bg-gray-500",
  };

  const statusLabels = {
    trialing: "Período Trial",
    active: "Ativa",
    past_due: "Pagamento Pendente",
    canceled: "Cancelada",
    paused: "Pausada",
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Minha Assinatura</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seu plano e método de pagamento
          </p>
        </div>
        {data.subscription.stripeCustomerId ? (
          <Button onClick={openBillingPortal} disabled={portalLoading}>
            {portalLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Abrindo...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Gerenciar Pagamento
              </>
            )}
          </Button>
        ) : (
          <Button onClick={setupStripeCustomer} disabled={portalLoading}>
            {portalLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Adicionar Método de Pagamento
              </>
            )}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Status da Assinatura */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Badge className={statusColors[data.subscription.status as keyof typeof statusColors]}>
              {statusLabels[data.subscription.status as keyof typeof statusLabels]}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.plan.name}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.plan.price)}/{data.plan.interval}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue.currentMonth)}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.revenue.currentMonth >= 1000 
                ? "Será cobrado R$ 39,00"
                : "Grátis este mês"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próxima Cobrança</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.revenue.nextChargeAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(data.subscription.currentPeriodEnd), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        {data.trial.isActive && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Restante</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.trial.daysLeft} dias</div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${data.trial.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Informações Importantes */}
      {data.trial.isActive && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você está no período trial de 30 dias. Adicione um método de pagamento para garantir que não haja interrupção no serviço após o término do trial.
          </AlertDescription>
        </Alert>
      )}

      {data.subscription.status === "past_due" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Seu pagamento está pendente. Por favor, atualize seu método de pagamento para continuar usando o serviço.
          </AlertDescription>
        </Alert>
      )}

      {data.subscription.cancelAtPeriodEnd && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sua assinatura será cancelada em {format(new Date(data.subscription.currentPeriodEnd), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}. Reative para continuar usando o serviço.
          </AlertDescription>
        </Alert>
      )}

      {/* Como Funciona a Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Como Funciona a Cobrança
          </CardTitle>
          <CardDescription>
            Sistema de cobrança condicional baseado em receita
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Receita abaixo de R$ 1.000/mês</p>
              <p className="text-sm text-muted-foreground">
                Você usa a plataforma <strong>gratuitamente</strong>. Não há cobrança.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Receita acima de R$ 1.000/mês</p>
              <p className="text-sm text-muted-foreground">
                Cobramos apenas <strong>R$ 39,00</strong> fixos no mês seguinte. Simples assim!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">30 dias grátis para testar</p>
              <p className="text-sm text-muted-foreground">
                Teste todos os recursos sem compromisso durante o período trial.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Faturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Histórico de Faturas
          </CardTitle>
          <CardDescription>
            Suas cobranças mensais
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma fatura gerada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {format(new Date(invoice.periodStart), "MMM yyyy", { locale: ptBR }).toUpperCase()}
                      </p>
                      <Badge
                        variant={invoice.status === "paid" ? "default" : "secondary"}
                        className={invoice.status === "paid" ? "bg-green-500" : ""}
                      >
                        {invoice.status === "paid" ? "Pago" : invoice.status}
                      </Badge>
                      {!invoice.wasCharged && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600">
                          GRÁTIS
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Receita: {formatCurrency(invoice.monthlyRevenue)} • 
                      {invoice.paidAt && ` Pago em ${format(new Date(invoice.paidAt), "dd/MM/yyyy")}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
