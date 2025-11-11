"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Sparkles, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrialStatusProps {
  daysLeft: number;
  percentage: number;
  isEnding: boolean;
  isExpired: boolean;
  endsAt: Date;
  className?: string;
}

export function TrialStatus({
  daysLeft,
  percentage,
  isEnding,
  isExpired,
  endsAt,
  className,
}: TrialStatusProps) {
  const getStatusColor = () => {
    if (isExpired) return "bg-red-500";
    if (isEnding) return "bg-orange-500";
    return "bg-gradient-to-r from-primary to-accent";
  };

  const getStatusIcon = () => {
    if (isExpired) return <AlertTriangle className="h-5 w-5" />;
    if (isEnding) return <Clock className="h-5 w-5" />;
    return <Sparkles className="h-5 w-5" />;
  };

  const getStatusText = () => {
    if (isExpired) return "Trial Expirado";
    if (isEnding) return "Trial Terminando";
    return "Trial Ativo";
  };

  const getStatusDescription = () => {
    if (isExpired) {
      return "Seu período de teste expirou. Configure o pagamento para continuar.";
    }
    if (isEnding) {
      return `Restam apenas ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} do seu trial gratuito!`;
    }
    return `Aproveite seus ${daysLeft} dias grátis para explorar todos os recursos.`;
  };

  return (
    <GlassCard className={cn("border-2 border-primary/20 relative overflow-hidden group hover:shadow-xl transition-all duration-300", className)}>
      {/* Gradient Background Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-accent/10 blur-3xl rounded-full -z-10 group-hover:scale-110 transition-transform" />
      
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
                <h3 className="text-xl font-bold">{getStatusText()}</h3>
                <Zap className="h-4 w-4 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {getStatusDescription()}
              </p>
            </div>
          </div>
          
          {/* Days Badge with gradient */}
          <Badge
            variant={isExpired ? "destructive" : "default"}
            className={cn(
              "text-base px-4 py-2 font-bold shadow-md",
              !isExpired && "bg-gradient-to-r from-primary to-accent"
            )}
          >
            {isExpired ? "Expirado" : `${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
          </Badge>
        </div>
      </div>
      {/* Content Section */}
      <div className="p-6">
        {/* Progress Bar with modern design */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <Calendar className="h-4 w-4 text-primary" />
              Expira em: <span className="text-foreground font-semibold">{new Date(endsAt).toLocaleDateString("pt-BR")}</span>
            </span>
            <span className="font-bold text-lg text-primary">
              {Math.round(percentage)}%
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
              style={{ width: `${percentage}%` }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          {/* Trial Benefits with modern cards */}
          {!isExpired && (
            <div className="mt-6 p-5 bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl border border-primary/10 backdrop-blur-sm">
              <p className="text-sm font-bold mb-3 flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                Durante o trial você tem acesso a:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Agendamentos ilimitados",
                  "Gestão completa de profissionais",
                  "Notificações automáticas",
                  "Dashboard com estatísticas"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
                    {benefit}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning for ending trial with premium style */}
          {isEnding && !isExpired && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-2 border-orange-200/50 dark:border-orange-800/50 rounded-xl backdrop-blur-sm">
              <p className="text-sm leading-relaxed">
                <span className="text-2xl mr-2">💡</span>
                <strong className="text-orange-800 dark:text-orange-200">Lembre-se:</strong>{" "}
                <span className="text-orange-700 dark:text-orange-300">
                  Após o trial, você só pagará <strong>R$ 39/mês</strong> se seu
                  faturamento ultrapassar <strong>R$ 1.000</strong> no mês. Abaixo disso, é grátis para sempre!
                </span>
              </p>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
