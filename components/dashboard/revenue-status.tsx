"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RevenueStatusProps {
  currentMonth: number;
  lastMonth: number;
  growth: number;
  shouldCharge: boolean;
  chargeAmount: number;
  threshold: number;
  remaining: number;
  percentageToThreshold: number;
  willBeFree: boolean;
  className?: string;
}

export function RevenueStatus({
  currentMonth,
  lastMonth,
  growth,
  shouldCharge,
  chargeAmount,
  threshold,
  remaining,
  percentageToThreshold,
  willBeFree,
  className,
}: RevenueStatusProps) {
  const getStatusColor = () => {
    if (shouldCharge) return "bg-gradient-to-r from-purple-500 to-pink-500";
    return "bg-gradient-to-r from-green-500 to-emerald-500";
  };

  const getStatusIcon = () => {
    if (shouldCharge) return <DollarSign className="h-5 w-5" />;
    return <CheckCircle className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (shouldCharge) return "Plano Premium";
    return "Plano FREE";
  };

  return (
    <Card className={cn("border-2", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg text-white", getStatusColor())}>
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">Receita do Mês</CardTitle>
              <CardDescription>
                {willBeFree ? "Você está no plano FREE" : "Você está no plano PREMIUM"}
              </CardDescription>
            </div>
          </div>
          <div className="text-right">
            <Badge
              variant={shouldCharge ? "default" : "secondary"}
              className="text-sm px-3 py-1 mb-1"
            >
              {getStatusText()}
            </Badge>
            <p className="text-2xl font-bold text-foreground">
              R$ {currentMonth.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Progress to threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Meta: R$ {threshold.toFixed(2)}
              </span>
              <span className="font-semibold">{percentageToThreshold.toFixed(1)}%</span>
            </div>

            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500 rounded-full",
                  getStatusColor()
                )}
                style={{ width: `${Math.min(100, percentageToThreshold)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Mês Anterior</p>
              <p className="text-lg font-semibold">R$ {lastMonth.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Crescimento</p>
              <p className={cn(
                "text-lg font-semibold flex items-center gap-1",
                growth >= 0 ? "text-green-600" : "text-red-600"
              )}>
                {growth >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Charging Info */}
          <div className={cn(
            "p-4 rounded-lg border-2",
            willBeFree ? "bg-green-50 border-green-200" : "bg-purple-50 border-purple-200"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-full",
                willBeFree ? "bg-green-100" : "bg-purple-100"
              )}>
                {willBeFree ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Info className="h-5 w-5 text-purple-600" />
                )}
              </div>
              <div className="flex-1">
                {willBeFree ? (
                  <>
                    <p className="font-semibold text-green-800 mb-1">
                      🎉 Parabéns! Você não paga nada este mês
                    </p>
                    <p className="text-sm text-green-700">
                      Sua receita está abaixo de R$ 1.000. Faltam{" "}
                      <strong>R$ {remaining.toFixed(2)}</strong> para atingir o threshold.
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      💡 Continue assim! Você só paga quando ganhar mais de R$ 1.000/mês.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-purple-800 mb-1">
                      🚀 Ótimo trabalho! Sua receita passou de R$ 1.000
                    </p>
                    <p className="text-sm text-purple-700">
                      Cobrança do mês: <strong>R$ {chargeAmount.toFixed(2)}</strong>
                    </p>
                    <p className="text-xs text-purple-600 mt-2">
                      💡 Você ultrapassou em R$ {(currentMonth - threshold).toFixed(2)}. Continue crescendo!
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              <strong>Como funciona:</strong> Sua assinatura é cobrada automaticamente apenas
              se sua receita mensal ultrapassar R$ 1.000. Abaixo disso, é 100% grátis!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
