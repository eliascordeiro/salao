"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
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
  AlertCircle,
  Loader2,
  Crown,
  Package,
  Zap,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionStatus {
  id: string;
  status: string;
  planName: string;
  planPrice: number;
  startDate: string | null;
  trialEndsAt: string | null;
  nextBillingDate: string | null;
  paymentMethod: string;
  lastPaymentDate: string | null;
  lastPaymentAmount: number | null;
  lastPaymentStatus: string | null;
}

export default function AssinaturaPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch("/api/subscriptions/status");
      if (!res.ok) {
        if (res.status === 404) {
          setError("not_found");
          return;
        }
        throw new Error("Erro ao carregar dados");
      }
      const result = await res.json();
      setSubscription(result);
    } catch (err) {
      console.error("Erro ao carregar assinatura:", err);
      setError("error");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
      ACTIVE: { label: "Ativa", variant: "default" },
      PENDING: { label: "Pendente", variant: "secondary" },
      CANCELED: { label: "Cancelada", variant: "destructive" },
      EXPIRED: { label: "Expirada", variant: "destructive" },
      SUSPENDED: { label: "Suspensa", variant: "destructive" },
    };
    return statusMap[status] || { label: status, variant: "secondary" };
  };

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

  // Sem assinatura - direcionar para planos
  if (error === "not_found") {
    return (
      <>
        <DashboardHeader user={{
          name: session?.user?.name,
          email: session?.user?.email,
          role: session?.user?.role,
        }} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="p-8 text-center">
            <div className="mb-6">
              <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Nenhuma assinatura ativa</h2>
              <p className="text-muted-foreground">
                Assine um de nossos planos para desbloquear todos os recursos da plataforma.
              </p>
            </div>

            <Button size="lg" onClick={() => router.push("/planos")}>
              <Crown className="h-5 w-5 mr-2" />
              Ver Planos e Preços
            </Button>
          </Card>
        </div>
      </>
    );
  }

  // Erro genérico
  if (error === "error") {
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
            <AlertDescription>Erro ao carregar dados da assinatura. Tente novamente.</AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  if (!subscription) {
    return null;
  }

  const statusBadge = getStatusBadge(subscription.status);
  const isTrialActive = subscription.trialEndsAt && new Date(subscription.trialEndsAt) > new Date();
  
  return (
    <>
      <DashboardHeader user={{
        name: session?.user?.name,
        email: session?.user?.email,
        role: session?.user?.role,
      }} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">Minha Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie seu plano e informações de pagamento
            </p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Plano Atual */}
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <h3 className="text-2xl font-bold">{subscription.planName}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">
                R$ {subscription.planPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Badge variant={statusBadge.variant} className="mt-4">
              {statusBadge.label}
            </Badge>
          </Card>

          {/* Forma de Pagamento */}
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                {subscription.paymentMethod === "pix" ? (
                  <Zap className="h-6 w-6 text-green-500" />
                ) : (
                  <CreditCard className="h-6 w-6 text-green-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
                <h3 className="text-xl font-bold">
                  {subscription.paymentMethod === "pix" ? "PIX" : "Cartão de Crédito"}
                </h3>
              </div>
            </div>
            {subscription.lastPaymentDate && (
              <div className="text-sm text-muted-foreground">
                Último pagamento: {formatDate(subscription.lastPaymentDate)}
              </div>
            )}
          </Card>

          {/* Próxima Cobrança */}
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
                <h3 className="text-xl font-bold">
                  {subscription.nextBillingDate
                    ? formatDate(subscription.nextBillingDate)
                    : "—"}
                </h3>
              </div>
            </div>
            {subscription.nextBillingDate && (
              <div className="text-sm text-muted-foreground">
                Valor: R$ {subscription.planPrice.toFixed(2)}
              </div>
            )}
          </Card>
        </div>

        {/* Trial Alert */}
        {isTrialActive && (
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Clock className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <strong>Período trial ativo!</strong> Você tem até{" "}
              <strong>{formatDate(subscription.trialEndsAt)}</strong> para testar gratuitamente.
              A primeira cobrança será feita automaticamente após o término do trial.
            </AlertDescription>
          </Alert>
        )}

        {/* Benefícios do Plano */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Benefícios do seu Plano
          </h3>

          {subscription.planName === "Essencial" && (
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Até 2 profissionais cadastrados</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Agendamentos ilimitados</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Catálogo de serviços completo</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Calendário e gestão de horários</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Notificações por email</span>
              </li>
            </ul>
          )}

          {subscription.planName === "Profissional" && (
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span><strong>Profissionais ilimitados</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Pagamentos online via Stripe</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>WhatsApp Business integrado</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Relatórios financeiros avançados</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Controle de despesas e receitas</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Multi-usuários (até 5 admins)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Chat com IA (assistente virtual)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>Suporte prioritário</span>
              </li>
            </ul>
          )}
        </Card>

        {/* Ações */}
        <div className="grid gap-4 md:grid-cols-2">
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.push("/planos")}
            className="w-full"
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Ver Outros Planos
          </Button>

          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push("/contato")}
            className="w-full"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            Falar com Suporte
          </Button>
        </div>

        {/* Informações de Pagamento */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Como Funciona o Pagamento
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • <strong>PIX:</strong> Renovação mensal via PIX. Você receberá um email com QR Code 5 dias antes.
            </p>
            <p>
              • <strong>Cartão:</strong> Cobrança automática no Mercado Pago todo mês.
            </p>
            <p>
              • <strong>Trial:</strong> 14 dias grátis para testar. Primeira cobrança após o término.
            </p>
            <p>
              • <strong>Cancelamento:</strong> Sem multas ou taxas. Cancele quando quiser.
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
