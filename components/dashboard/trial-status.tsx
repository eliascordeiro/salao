"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
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
    <Card className={cn("border-2", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-3 rounded-lg text-white", getStatusColor())}>
              {getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-lg">{getStatusText()}</CardTitle>
              <CardDescription>{getStatusDescription()}</CardDescription>
            </div>
          </div>
          <Badge
            variant={isExpired ? "destructive" : isEnding ? "secondary" : "default"}
            className="text-sm px-3 py-1"
          >
            {isExpired ? "Expirado" : `${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expira em: {new Date(endsAt).toLocaleDateString("pt-BR")}
            </span>
            <span className="font-semibold">{Math.round(percentage)}%</span>
          </div>

          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                getStatusColor()
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Trial Benefits */}
          {!isExpired && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Durante o trial você tem acesso a:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Agendamentos ilimitados</li>
                <li>• Gestão completa de profissionais e serviços</li>
                <li>• Notificações automáticas por email</li>
                <li>• Dashboard com estatísticas básicas</li>
              </ul>
            </div>
          )}

          {/* Warning for ending trial */}
          {isEnding && !isExpired && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                💡 <strong>Lembre-se:</strong> Após o trial, você só pagará R$ 39/mês se seu
                faturamento ultrapassar R$ 1.000 no mês. Abaixo disso, é grátis para sempre!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
