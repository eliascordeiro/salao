"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8">
          {/* Pending Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-500/10 rounded-full p-4">
              <Clock className="h-16 w-16 text-yellow-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Pagamento Pendente
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Estamos aguardando a confirmação do seu pagamento
          </p>

          {/* Status Badge */}
          <div className="flex justify-center mb-8">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              Aguardando pagamento
            </Badge>
          </div>

          {/* PIX Info */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8 space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-2">Pagamento via PIX</p>
                <p className="text-muted-foreground">
                  Se você escolheu pagar via PIX, complete o pagamento usando o QR Code ou código copia e cola fornecido pelo Mercado Pago.
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Próximos passos:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Abra o app do seu banco</li>
                <li>2. Escolha a opção PIX</li>
                <li>3. Escaneie o QR Code ou cole o código</li>
                <li>4. Confirme o pagamento</li>
                <li>5. Aguarde a confirmação (geralmente instantânea)</li>
              </ol>
            </div>
          </div>

          {/* Time Info */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8">
            <p className="text-sm text-center text-muted-foreground">
              ⏱️ O pagamento PIX expira em <strong>30 minutos</strong>. Após a confirmação, sua assinatura será ativada automaticamente.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button size="lg" className="w-full" onClick={() => window.location.reload()}>
              <RefreshCw className="h-5 w-5 mr-2" />
              Verificar Status
            </Button>

            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <Home className="h-5 w-5 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>

          {/* Help */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            Pagamento não confirmado após 30 minutos?{" "}
            <Link href="/contato" className="underline">
              Fale conosco
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
