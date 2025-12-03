"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface MercadoPagoCardFormProps {
  publicKey: string;
  amount: number;
  planSlug: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

export function MercadoPagoCardForm({
  publicKey,
  amount,
  planSlug,
  onSuccess,
  onError,
}: MercadoPagoCardFormProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [mp, setMp] = useState<any>(null);

  useEffect(() => {
    // Carregar SDK do Mercado Pago
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => {
      const mercadopago = new window.MercadoPago(publicKey);
      setMp(mercadopago);
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [publicKey]);

  useEffect(() => {
    if (!mp || loading) return;

    // Criar formulário de cartão
    const cardForm = mp.cardForm({
      amount: amount.toString(),
      iframe: true,
      form: {
        id: "form-checkout",
        cardNumber: {
          id: "form-checkout__cardNumber",
          placeholder: "Número do cartão",
        },
        expirationDate: {
          id: "form-checkout__expirationDate",
          placeholder: "MM/AA",
        },
        securityCode: {
          id: "form-checkout__securityCode",
          placeholder: "CVV",
        },
        cardholderName: {
          id: "form-checkout__cardholderName",
          placeholder: "Titular do cartão",
        },
        issuer: {
          id: "form-checkout__issuer",
          placeholder: "Banco emissor",
        },
        installments: {
          id: "form-checkout__installments",
          placeholder: "Parcelas",
        },
        identificationType: {
          id: "form-checkout__identificationType",
          placeholder: "Tipo de documento",
        },
        identificationNumber: {
          id: "form-checkout__identificationNumber",
          placeholder: "Número do documento",
        },
      },
      callbacks: {
        onFormMounted: (error: any) => {
          if (error) {
            console.error("Erro ao montar formulário:", error);
            onError("Erro ao carregar formulário de pagamento");
          }
        },
        onSubmit: async (event: any) => {
          event.preventDefault();
          setProcessing(true);

          const {
            paymentMethodId: payment_method_id,
            issuerId: issuer_id,
            amount,
            token,
            installments,
            identificationNumber,
            identificationType,
          } = cardForm.getCardFormData();

          // Remover máscara do CPF (apenas números)
          const cleanIdentificationNumber = identificationNumber.replace(/\D/g, '');

          console.log("📤 Dados do pagamento:", {
            payment_method_id,
            issuer_id,
            amount,
            installments,
            identificationType,
            identificationNumber: cleanIdentificationNumber,
            token: token ? `${token.substring(0, 10)}...` : 'TOKEN_VAZIO',
            tokenLength: token?.length,
          });

          // Validar se o token foi gerado
          if (!token || token.length < 10) {
            console.error("❌ Token inválido ou não gerado pelo Mercado Pago");
            onError("Erro ao processar dados do cartão. Tente novamente.");
            setProcessing(false);
            return;
          }

          try {
            // Enviar para nossa API processar o pagamento
            const response = await fetch("/api/subscriptions/process-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token,
                payment_method_id,
                issuer_id: issuer_id ? Number(issuer_id) : undefined,
                amount: Number(amount),
                installments: Number(installments),
                identification: {
                  type: identificationType,
                  number: cleanIdentificationNumber, // CPF sem máscara
                },
                planSlug,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || "Erro ao processar pagamento");
            }

            const data = await response.json();
            onSuccess(data.paymentId);
          } catch (error: any) {
            console.error("Erro no pagamento:", error);
            onError(error.message || "Erro ao processar pagamento");
          } finally {
            setProcessing(false);
          }
        },
        onFetching: (resource: string) => {
          console.log("Buscando recurso:", resource);
        },
      },
    });

    return () => {
      // Cleanup
    };
  }, [mp, loading, amount, planSlug, onSuccess, onError]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <form id="form-checkout" className="space-y-4">
        {/* Número do Cartão */}
        <div>
          <label htmlFor="form-checkout__cardNumber" className="block text-sm font-medium mb-2">
            Número do cartão
          </label>
          <div id="form-checkout__cardNumber" className="input-field"></div>
        </div>

        {/* Validade e CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="form-checkout__expirationDate" className="block text-sm font-medium mb-2">
              Validade (MM/AA)
            </label>
            <div id="form-checkout__expirationDate" className="input-field"></div>
          </div>
          <div>
            <label htmlFor="form-checkout__securityCode" className="block text-sm font-medium mb-2">
              CVV
            </label>
            <div id="form-checkout__securityCode" className="input-field"></div>
          </div>
        </div>

        {/* Nome do Titular */}
        <div>
          <label htmlFor="form-checkout__cardholderName" className="block text-sm font-medium mb-2">
            Nome do titular (como está no cartão)
          </label>
          <input
            type="text"
            id="form-checkout__cardholderName"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Para teste: APRO"
            defaultValue="APRO"
          />
          <p className="text-xs text-green-600 mt-1">
            ✅ Use: <strong>APRO</strong> (para pagamento aprovado em teste)
          </p>
        </div>

        {/* CPF/CNPJ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="form-checkout__identificationType" className="block text-sm font-medium mb-2">
              Tipo de documento
            </label>
            <select
              id="form-checkout__identificationType"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione</option>
            </select>
          </div>
          <div>
            <label htmlFor="form-checkout__identificationNumber" className="block text-sm font-medium mb-2">
              CPF
            </label>
            <input
              type="text"
              id="form-checkout__identificationNumber"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Apenas números: 12345678909"
              maxLength={11}
              defaultValue="12345678909"
              onInput={(e: any) => {
                // Permitir apenas números
                e.target.value = e.target.value.replace(/\D/g, '');
              }}
            />
            <p className="text-xs text-green-600 mt-1">
              ✅ Use: <strong>12345678909</strong> (CPF para pagamento aprovado)
            </p>
          </div>
        </div>

        {/* Banco Emissor (hidden, mas precisa ser SELECT) */}
        <select id="form-checkout__issuer" className="hidden">
          <option value="">Carregando...</option>
        </select>

        {/* Parcelas */}
        <div>
          <label htmlFor="form-checkout__installments" className="block text-sm font-medium mb-2">
            Parcelas
          </label>
          <select
            id="form-checkout__installments"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Carregando...</option>
          </select>
        </div>

        {/* Botão de Pagamento */}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={processing}
        >
          {processing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processando pagamento...
            </>
          ) : (
            `Pagar R$ ${amount.toFixed(2)}`
          )}
        </Button>

        {/* Selos de Segurança */}
        <div className="text-center text-xs text-muted-foreground mt-4">
          🔒 Pagamento seguro processado pelo Mercado Pago
        </div>
      </form>

      <style jsx global>{`
        .input-field iframe {
          height: 40px !important;
          border-radius: 0.5rem !important;
        }
      `}</style>
    </Card>
  );
}
