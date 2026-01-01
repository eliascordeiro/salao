"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { User } from "lucide-react";

export default function StaffPerfilPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Meu Perfil
        </h1>
        <p className="text-foreground-muted">
          Gerencie suas informações pessoais
        </p>
      </div>

      <GlassCard>
        <div className="p-12 text-center">
          <User className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Em Desenvolvimento
          </h3>
          <p className="text-muted-foreground">
            Em breve você poderá editar seu perfil por aqui
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
