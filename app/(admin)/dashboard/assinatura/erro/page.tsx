"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, HelpCircle, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-red-500/10 rounded-full p-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-center mb-2">
            Pagamento Não Autorizado
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Houve um problema ao processar seu pagamento
          </p>

          {/* Reasons */}
          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Possíveis motivos:
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Saldo insuficiente ou limite do cartão atingido</li>
              <li>• Dados do cartão incorretos (número, CVV, validade)</li>
              <li>• Cartão bloqueado ou vencido</li>
              <li>• Problemas na conexão durante o pagamento</li>
              <li>• Pagamento PIX não foi confirmado a tempo</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button size="lg" className="w-full" asChild>
              <Link href="/planos">
                <RefreshCw className="h-5 w-5 mr-2" />
                Tentar Novamente
              </Link>
            </Button>

            <Button size="lg" variant="outline" className="w-full" asChild>
              <Link href="/dashboard">
                <Home className="h-5 w-5 mr-2" />
                Voltar ao Dashboard
              </Link>
            </Button>
          </div>

          {/* Help */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-center">
              <strong>Precisa de ajuda?</strong> Entre em contato com nosso{" "}
              <Link href="/contato" className="underline text-blue-600 dark:text-blue-400">
                suporte
              </Link>{" "}
              e resolveremos seu problema rapidamente.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
