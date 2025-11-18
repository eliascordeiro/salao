"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardHeader } from "@/components/dashboard/header";
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
  FileText,
  Sparkles,
  Zap
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  const router = useRouter();
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  // Verificar se é OWNER
  const isOwner = (session?.user as any)?.roleType === "OWNER";

  useEffect(() => {
    // Redirecionar se não for OWNER
    if (session && !isOwner) {
      router.push("/dashboard");
      return;
    }
    
    if (session && isOwner) {
      loadSubscriptionData();
    }
  }, [session, isOwner, router]);

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

  // Bloquear acesso para não-owners
  if (!isOwner) {
    return (
      <>
        <DashboardHeader user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role,
        }} />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Acesso negado. Apenas proprietários podem visualizar informações de assinatura.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <DashboardHeader user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role,
        }} />
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <DashboardHeader user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role,
        }} />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Erro ao carregar dados"}</AlertDescription>
        </Alert>
      </>
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
    <>
      <DashboardHeader user={{
        name: session?.user?.name,
        email: session?.user?.email,
        role: session?.user?.role,
      }} />
      
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
        <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 blur-2xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6 border-b border-border/50">
            <h3 className="text-sm font-medium flex items-center gap-2">
              Status
              <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            </h3>
            <Badge className={cn(statusColors[data.subscription.status as keyof typeof statusColors], "shadow-md")}>
              {statusLabels[data.subscription.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          <div className="p-6">
            <div className="text-2xl font-bold text-primary">{data.plan.name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.plan.price)}/{data.plan.interval}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 blur-2xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6 border-b border-border/50">
            <h3 className="text-sm font-medium">Receita do Mês</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md transform transition-all duration-300 group-hover:scale-110">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="p-6">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.revenue.currentMonth)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.revenue.currentMonth >= 1000 
                ? "Será cobrado R$ 39,00"
                : "Grátis este mês"}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6 border-b border-border/50">
            <h3 className="text-sm font-medium">Próxima Cobrança</h3>
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md transform transition-all duration-300 group-hover:scale-110">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="p-6">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(data.revenue.nextChargeAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(data.subscription.currentPeriodEnd), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </GlassCard>

        {data.trial.isActive && (
          <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-2xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
            <div className="flex flex-row items-center justify-between space-y-0 pb-2 p-6 border-b border-border/50">
              <h3 className="text-sm font-medium">Trial Restante</h3>
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md transform transition-all duration-300 group-hover:scale-110">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="p-6">
              <div className="text-2xl font-bold text-primary">{data.trial.daysLeft} dias</div>
              <div className="w-full bg-secondary/50 rounded-full h-3 mt-3 backdrop-blur-sm border border-border/50 shadow-inner overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-700 relative shadow-lg"
                  style={{ width: `${data.trial.percentage}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          </GlassCard>
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
      <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Como Funciona a Cobrança
                <Zap className="h-4 w-4 text-primary animate-pulse" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Sistema de cobrança condicional baseado em receita
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl border border-green-200/20 backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base mb-1">Receita abaixo de R$ 1.000/mês</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Você usa a plataforma <strong className="text-green-600 dark:text-green-400">gratuitamente</strong>. Não há cobrança.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/20 backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-accent text-white shadow-md">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base mb-1">Receita acima de R$ 1.000/mês</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cobramos apenas <strong className="text-primary">R$ 39,00</strong> fixos no mês seguinte. Simples assim!
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-xl border border-blue-200/20 backdrop-blur-sm">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-base mb-1">30 dias grátis para testar</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Teste todos os recursos sem compromisso durante o período trial.
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Histórico de Faturas */}
      <GlassCard className="border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                Histórico de Faturas
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </h3>
              <p className="text-sm text-muted-foreground">
                Suas cobranças mensais
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {data.invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Nenhuma fatura gerada ainda
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-5 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/10 rounded-xl hover:border-primary/30 hover:shadow-lg transition-all duration-300 backdrop-blur-sm group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-bold text-base">
                        {format(new Date(invoice.periodStart), "MMM yyyy", { locale: ptBR }).toUpperCase()}
                      </p>
                      <Badge
                        variant={invoice.status === "paid" ? "default" : "secondary"}
                        className={cn(
                          "shadow-md",
                          invoice.status === "paid" && "bg-gradient-to-r from-green-500 to-emerald-500"
                        )}
                      >
                        {invoice.status === "paid" ? "Pago" : invoice.status}
                      </Badge>
                      {!invoice.wasCharged && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-200/50 shadow-sm">
                          GRÁTIS
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span>Receita: <strong className="text-foreground">{formatCurrency(invoice.monthlyRevenue)}</strong></span>
                      {invoice.paidAt && (
                        <>
                          <span>•</span>
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>Pago em <strong className="text-foreground">{format(new Date(invoice.paidAt), "dd/MM/yyyy")}</strong></span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </div>
    </>
  );
}
