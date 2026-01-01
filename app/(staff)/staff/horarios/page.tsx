"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Clock } from "lucide-react";

export default function StaffHorariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
          Meus Horários
        </h1>
        <p className="text-foreground-muted">
          Gerencie sua disponibilidade
        </p>
      </div>

      <GlassCard>
        <div className="p-12 text-center">
          <Clock className="h-16 w-16 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            Em Desenvolvimento
          </h3>
          <p className="text-muted-foreground">
            Em breve você poderá gerenciar seus horários de trabalho por aqui
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
