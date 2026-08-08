"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("subscription");
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
      console.log("📡 Fetching subscription status...");
      const res = await fetch("/api/subscriptions/status");
      console.log("📡 Response status:", res.status);
      console.log("📡 Response ok:", res.ok);
      
      const result = await res.json();
      console.log("📡 Response data:", result);
      
      if (!res.ok) {
        console.error("❌ Response not OK:", res.status, result);
        throw new Error(result.error || "Erro ao carregar dados");
      }
      
      // API agora retorna { subscription: {...} } ou { subscription: null }
      if (!result.subscription) {
        console.log("⚠️ No subscription found");
        setError("not_found");
        return;
      }
      
      console.log("✅ Subscription loaded:", result.subscription);
      setSubscription(result.subscription);
    } catch (err) {
      console.error("❌ Erro ao carregar assinatura:", err);
      console.error("❌ Error details:", {
        message: (err as Error).message,
        stack: (err as Error).stack,
      });
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
      ACTIVE: { label: t("statusActive"), variant: "default" },
      active: { label: t("statusActive"), variant: "default" },
      PENDING: { label: t("statusPending"), variant: "secondary" },
      pending: { label: t("statusPending"), variant: "secondary" },
      CANCELED: { label: t("statusCanceled"), variant: "destructive" },
      canceled: { label: t("statusCanceled"), variant: "destructive" },
      EXPIRED: { label: t("statusExpired"), variant: "destructive" },
      expired: { label: t("statusExpired"), variant: "destructive" },
      SUSPENDED: { label: t("statusSuspended"), variant: "destructive" },
      suspended: { label: t("statusSuspended"), variant: "destructive" },
      trialing: { label: t("statusTrialing"), variant: "default" },
      TRIALING: { label: t("statusTrialing"), variant: "default" },
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
              {t("accessDenied")}
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
              <h2 className="text-2xl font-bold mb-2">{t("noActiveSubscription")}</h2>
              <p className="text-muted-foreground">
                {t("noActiveSubscriptionDesc")}
              </p>
            </div>

            <Button size="lg" onClick={() => router.push("/planos")}>
              <Crown className="h-5 w-5 mr-2" />
              {t("viewPlans")}
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
            <AlertDescription>{t("loadError")}</AlertDescription>
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
            <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("subtitle")}
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
                <p className="text-sm text-muted-foreground">{t("currentPlan")}</p>
                <h3 className="text-2xl font-bold">{subscription.planName}</h3>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">
                R$ {subscription.planPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground">{t("perMonth")}</span>
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
                <p className="text-sm text-muted-foreground">{t("paymentMethodTitle")}</p>
                <h3 className="text-xl font-bold">
                  {subscription.paymentMethod === "pix" ? "PIX" : t("creditCard")}
                </h3>
              </div>
            </div>
            {subscription.lastPaymentDate && (
              <div className="text-sm text-muted-foreground">
                {t("lastPayment")} {formatDate(subscription.lastPaymentDate)}
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
                <p className="text-sm text-muted-foreground">{t("nextBilling")}</p>
                <h3 className="text-xl font-bold">
                  {subscription.nextBillingDate
                    ? formatDate(subscription.nextBillingDate)
                    : "—"}
                </h3>
              </div>
            </div>
            {subscription.nextBillingDate && (
              <div className="text-sm text-muted-foreground">
                {t("amountLabel")} R$ {subscription.planPrice.toFixed(2)}
              </div>
            )}
          </Card>
        </div>

        {/* Trial Alert */}
        {isTrialActive && (
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Clock className="h-4 w-4 text-blue-500" />
            <AlertDescription>
              <strong>{t("trialActiveTitle")}</strong> {t("trialActivePrefix")}{" "}
              <strong>{formatDate(subscription.trialEndsAt)}</strong> {t("trialActiveSuffix")}
            </AlertDescription>
          </Alert>
        )}

        {/* Benefícios do Plano */}
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("planBenefitsTitle")}
          </h3>

          {subscription.planName === "Essencial" && (
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("essentialBenefit1")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("essentialBenefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("essentialBenefit3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("essentialBenefit4")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("essentialBenefit5")}</span>
              </li>
            </ul>
          )}

          {subscription.planName === "Profissional" && (
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span><strong>{t("professionalBenefit1")}</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit2")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit3")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit4")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit5")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit6")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit7")}</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                <span>{t("professionalBenefit8")}</span>
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
            {t("viewOtherPlans")}
          </Button>

          <Button 
            variant="outline" 
            size="lg"
            onClick={() => router.push("/contato")}
            className="w-full"
          >
            <AlertCircle className="h-5 w-5 mr-2" />
            {t("talkToSupport")}
          </Button>
        </div>

        {/* Informações de Pagamento */}
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("howPaymentWorksTitle")}
          </h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              • <strong>{t("paymentPixLabel")}</strong> {t("paymentPixDesc")}
            </p>
            <p>
              • <strong>{t("paymentCardLabel")}</strong> {t("paymentCardDesc")}
            </p>
            <p>
              • <strong>{t("paymentTrialLabel")}</strong> {t("paymentTrialDesc")}
            </p>
            <p>
              • <strong>{t("paymentCancelLabel")}</strong> {t("paymentCancelDesc")}
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
