"use client";

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  children: ReactNode;
  hasAccess: boolean;
  featureName: string;
  fallback?: ReactNode;
  showUpgrade?: boolean;
  className?: string;
}

/**
 * Componente que controla acesso a features premium
 * Mostra conteúdo apenas se o usuário tiver acesso
 * Caso contrário, mostra badge de upgrade ou fallback customizado
 */
export function FeatureGate({
  children,
  hasAccess,
  featureName,
  fallback,
  showUpgrade = true,
  className,
}: FeatureGateProps) {
  // Se tem acesso, mostra o conteúdo normal
  if (hasAccess) {
    return <>{children}</>;
  }

  // Se não tem acesso e tem fallback customizado
  if (fallback) {
    return <>{fallback}</>;
  }

  // Se não tem acesso e deve mostrar upgrade
  if (showUpgrade) {
    return (
      <div className={cn("relative", className)}>
        {/* Conteúdo bloqueado com blur */}
        <div className="pointer-events-none select-none opacity-40 blur-sm">
          {children}
        </div>

        {/* Overlay de upgrade */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-3 p-6">
            <Badge variant="default" className="gap-1.5 mb-2">
              <Lock className="h-3 w-3" />
              Premium
            </Badge>
            <p className="text-sm font-medium">{featureName}</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Faça upgrade para o plano Profissional para acessar este recurso
            </p>
            <Link href="/planos">
              <Button size="sm" className="gap-2">
                <Zap className="h-4 w-4" />
                Fazer Upgrade
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Se não deve mostrar nada
  return null;
}

/**
 * Componente para badge de feature premium
 */
export function PremiumBadge({ className }: { className?: string }) {
  return (
    <Badge variant="default" className={cn("gap-1.5", className)}>
      <Zap className="h-3 w-3" />
      Premium
    </Badge>
  );
}

/**
 * Componente para botão bloqueado
 */
interface LockedButtonProps {
  featureName: string;
  className?: string;
  children: ReactNode;
}

export function LockedButton({ featureName, className, children }: LockedButtonProps) {
  return (
    <div className="relative inline-block">
      <Button disabled className={className}>
        <Lock className="h-4 w-4 mr-2" />
        {children}
      </Button>
      <div className="absolute -top-2 -right-2">
        <PremiumBadge />
      </div>
    </div>
  );
}
