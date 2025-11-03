"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("ID da sessão não encontrado");
      setLoading(false);
      return;
    }

    // Verificar status do pagamento
    async function checkPayment() {
      try {
        const response = await fetch(
          `/api/payments/verify-session?session_id=${sessionId}`
        );

        if (!response.ok) {
          throw new Error("Erro ao verificar pagamento");
        }

        const data = await response.json();
        setPaymentData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    checkPayment();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">
            Processando pagamento...
          </h2>
          <p className="text-gray-600">
            Aguarde enquanto confirmamos seu pagamento
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Erro ao verificar pagamento
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/meus-agendamentos"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Voltar para Agendamentos
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-2xl font-bold mb-2 text-gray-900">
            Pagamento Confirmado!
          </h1>

          <p className="text-gray-600 mb-6">
            Seu agendamento foi confirmado com sucesso
          </p>

          {paymentData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3 text-gray-900">
                Detalhes do Pagamento
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor pago:</span>
                  <span className="font-semibold">
                    R$ {paymentData.amount?.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Método:</span>
                  <span className="font-semibold">
                    {paymentData.method || "Cartão de Crédito"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmado
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900">
              📧 Um email de confirmação foi enviado para você com todos os
              detalhes do seu agendamento
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/meus-agendamentos"
              className="block w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-center"
            >
              Ver Meus Agendamentos
            </Link>

            <Link
              href="/agendar"
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              Fazer Novo Agendamento
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
            <p className="text-gray-600">Verificando pagamento...</p>
          </div>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
