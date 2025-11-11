"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, Sparkles } from "lucide-react";
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
    <GlassCard className={cn("border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300", className)}>
      {/* Gradient Background Effect */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-3xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
      
      {/* Header Section */}
      <div className="p-6 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            {/* Icon with 3D effect */}
            <div className={cn(
              "p-3 rounded-xl text-white shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
              getStatusColor()
            )}>
              {getStatusIcon()}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold">Receita do Mês</h3>
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {willBeFree ? "Você está no plano FREE" : "Você está no plano PREMIUM"}
              </p>
            </div>
          </div>
          
          {/* Revenue Badge with gradient */}
          <div className="text-right space-y-1">
            <Badge
              variant={shouldCharge ? "default" : "secondary"}
              className={cn(
                "text-base px-4 py-2 font-bold shadow-md",
                shouldCharge && "bg-gradient-to-r from-purple-500 to-pink-500"
              )}
            >
              {getStatusText()}
            </Badge>
            <p className="text-3xl font-bold text-primary">
              R$ {currentMonth.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <div className="space-y-4">
          {/* Progress to threshold with modern design */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium">
                Meta: R$ {threshold.toFixed(2)}
              </span>
              <span className="font-bold text-lg text-primary">
                {percentageToThreshold.toFixed(1)}%
              </span>
            </div>

            {/* Glass morphism progress bar */}
            <div className="h-4 bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm border border-border/50 shadow-inner">
              <div
                className={cn(
                  "h-full transition-all duration-700 ease-out rounded-full relative",
                  getStatusColor(),
                  "shadow-lg"
                )}
                style={{ width: `${Math.min(100, percentageToThreshold)}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>

          {/* Stats Grid with glass effect */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Mês Anterior</p>
              <p className="text-xl font-bold">R$ {lastMonth.toFixed(2)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Crescimento</p>
              <p className={cn(
                "text-xl font-bold flex items-center gap-1",
                growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {growth >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Charging Info with premium design */}
          <div className={cn(
            "p-5 rounded-xl border-2 backdrop-blur-sm",
            willBeFree 
              ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50 dark:border-green-800/50" 
              : "bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50 dark:border-purple-800/50"
          )}>
            <div className="flex items-start gap-3">
              <div className={cn(
                "p-2 rounded-xl shadow-md transform transition-all duration-300 hover:scale-110",
                willBeFree ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-gradient-to-r from-purple-500 to-pink-500"
              )}>
                {willBeFree ? (
                  <CheckCircle className="h-5 w-5 text-white" />
                ) : (
                  <Info className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                {willBeFree ? (
                  <>
                    <p className="font-bold text-base text-green-800 dark:text-green-200 mb-2">
                      🎉 Parabéns! Você não paga nada este mês
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 leading-relaxed">
                      Sua receita está abaixo de R$ 1.000. Faltam{" "}
                      <strong>R$ {remaining.toFixed(2)}</strong> para atingir o threshold.
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                      💡 Você só paga quando ganhar mais de R$ 1.000/mês.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-base text-purple-800 dark:text-purple-200 mb-2">
                      🚀 Ótimo trabalho! Sua receita passou de R$ 1.000
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                      Cobrança do mês: <strong>R$ {chargeAmount.toFixed(2)}</strong>
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                      💡 Você ultrapassou em R$ {(currentMonth - threshold).toFixed(2)}. Continue crescendo!
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Info Box with glass effect */}
          <div className="flex items-start gap-3 p-5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-2 border-blue-300/60 dark:border-blue-700/60 rounded-xl backdrop-blur-sm shadow-lg">
            <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-900 dark:text-orange-100 leading-relaxed font-medium">
              <strong className="text-orange-700 dark:text-orange-300 text-base">Como funciona:</strong> Sua assinatura é cobrada automaticamente apenas
              se sua receita mensal ultrapassar <span className="font-bold text-orange-700 dark:text-orange-300">R$ 1.000</span>. Abaixo disso, é{" "}
              <span className="font-bold text-green-600 dark:text-green-400">100% grátis!</span>
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
