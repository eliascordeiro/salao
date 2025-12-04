"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, Loader2, QrCode as QrCodeIcon } from "lucide-react";
import Image from "next/image";

interface PixPaymentProps {
  planSlug: string;
  planName: string;
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PixData {
  paymentId: number;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  expirationDate?: string;
}

export function PixPayment({ planSlug, planName, amount, onSuccess, onCancel }: PixPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const pollingControllerRef = useRef<{ cancelled: boolean } | null>(null);

  // Limpa polling se o componente desmontar
  useEffect(() => {
    return () => {
      if (pollingControllerRef.current) pollingControllerRef.current.cancelled = true;
    };
  }, []);

  const generatePix = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar PIX");
      }

      const data = await response.json();
      setPixData(data);

      // Iniciar polling para verificar pagamento
      pollingControllerRef.current = { cancelled: false };
      startPaymentPolling(data.paymentId);
    } catch (error: any) {
      alert(error.message || "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (paymentId: number) => {
    let attempts = 0;
    const controller = pollingControllerRef.current || { cancelled: false };

    const poll = async () => {
      if (controller.cancelled) return;
      attempts++;
      try {
        const response = await fetch(`/api/subscriptions/check-payment?paymentId=${paymentId}`);
        if (!response.ok) throw new Error('Erro ao verificar pagamento');
        const data = await response.json();

        // Se aprovado, chama onSuccess e para o polling
        if (data.status === "approved") {
          pollingControllerRef.current = null;
          onSuccess();
          return;
        }

        // Se rejeitado, notifica e para
        if (data.status === "rejected") {
          pollingControllerRef.current = null;
          alert('Pagamento rejeitado. Por favor, tente novamente.');
          onCancel();
          return;
        }

        // Recomenda intervalo enviado pelo servidor (ajusta para pending PIX)
        const nextMs = data.nextCheckInMs ?? (attempts < 10 ? 3000 : 10000);

        // Limite de tentativas razoável (ex.: 30 minutos)
        const maxAttempts = Math.max(10, Math.floor((30 * 60 * 1000) / nextMs));
        if (attempts >= maxAttempts) {
          console.log('Polling PIX: limite de tentativas atingido, parando verificações');
          return;
        }

        setTimeout(poll, nextMs);
      } catch (error) {
        console.error("Erro ao verificar pagamento:", error);
        const backoff = Math.min(30000, attempts * 1000);
        setTimeout(poll, backoff);
      }
    };

    // Iniciar primeira verificação imediatamente
    poll();
  };

  const copyPixCode = () => {
    if (!pixData) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Estado inicial: botão para gerar PIX
  if (!pixData && !loading) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
            <QrCodeIcon className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Pagamento via PIX</h3>
            <p className="text-muted-foreground">
              Pague R$ {amount.toFixed(2)} via PIX de forma rápida e segura
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Vantagens do PIX:</strong>
              <br />
              • Aprovação instantânea
              <br />
              • Sem taxas adicionais
              <br />
              • 100% seguro
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={generatePix}
              className="flex-1"
            >
              Gerar QR Code PIX
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Carregando
  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Gerando QR Code PIX...</p>
        </div>
      </Card>
    );
  }

  // Exibir QR Code
  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Escaneie o QR Code</h3>
          <p className="text-muted-foreground">
            Use o app do seu banco para pagar
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Image
              src={`data:image/png;base64,${pixData!.qrCodeBase64}`}
              alt="QR Code PIX"
              width={256}
              height={256}
              className="w-64 h-64"
            />
          </div>
        </div>

        {/* Valor */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
          <p className="text-3xl font-bold text-primary">
            R$ {pixData!.amount.toFixed(2)}
          </p>
        </div>

        {/* Código Copia e Cola */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Ou copie o código PIX:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pixData!.qrCode}
              readOnly
              className="flex-1 px-3 py-2 text-sm bg-muted border rounded-md font-mono overflow-hidden text-ellipsis"
            />
            <Button
              onClick={copyPixCode}
              variant="outline"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-semibold">Como pagar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar com PIX QR Code</li>
            <li>Escaneie o código acima</li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Aguardando confirmação do pagamento...
        </div>

        {/* Botão Cancelar */}
        <Button
          onClick={() => {
            if (pollingControllerRef.current) pollingControllerRef.current.cancelled = true;
            onCancel();
          }}
          variant="ghost"
          className="w-full"
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
