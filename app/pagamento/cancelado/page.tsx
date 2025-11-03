"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import Link from "next/link";

function PaymentCancelledContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("booking_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Pagamento Cancelado
          </h1>

          <p className="text-gray-600 mb-6">
            Você cancelou o processo de pagamento. Não se preocupe, nenhuma
            cobrança foi realizada.
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">O que aconteceu?</p>
                <p>
                  O pagamento foi cancelado antes de ser processado. Seu
                  agendamento ainda está reservado, mas precisa ser confirmado
                  através do pagamento.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2 text-gray-900">
              Quer tentar novamente?
            </h3>
            <p className="text-sm text-gray-600">
              Você pode retornar ao processo de pagamento a qualquer momento
              através da página de agendamentos.
            </p>
          </div>

          <div className="space-y-3">
            {bookingId ? (
              <Link
                href={`/agendar/checkout/${bookingId}`}
                className="block w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
              >
                Tentar Pagamento Novamente
              </Link>
            ) : (
              <Link
                href="/meus-agendamentos"
                className="block w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
              >
                Ver Meus Agendamentos
              </Link>
            )}

            <Link
              href="/agendar"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Fazer Novo Agendamento
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Precisa de ajuda com o pagamento?
            </p>
            <a
              href="mailto:suporte@agendasalao.com.br"
              className="text-sm text-blue-600 hover:underline"
            >
              Fale com nosso suporte
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentCancelledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        </Card>
      </div>
    }>
      <PaymentCancelledContent />
    </Suspense>
  );
}
