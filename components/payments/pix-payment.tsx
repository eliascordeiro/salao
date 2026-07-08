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
  seats?: number;
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

export function PixPayment({ planSlug, planName, amount, seats, onSuccess, onCancel }: PixPaymentProps) {
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
    // Cancelar polling anterior se existir
    if (pollingControllerRef.current) {
      console.log('🛑 Cancelando polling anterior');
      pollingControllerRef.current.cancelled = true;
    }
    
    setLoading(true);
    try {
      const response = await fetch("/api/subscriptions/create-pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug, seats }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao gerar PIX");
      }

      const data = await response.json();
      setPixData(data);

      // Iniciar novo polling
      pollingControllerRef.current = { cancelled: false };
      console.log('🟢 Iniciando polling para pagamento:', data.paymentId);
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
      if (controller.cancelled) {
        console.log('🛑 Polling PIX cancelado pelo usuário');
        return;
      }
      attempts++;
      console.log(`🔍 Verificando pagamento ${paymentId} - tentativa ${attempts}`);
      try {
        const response = await fetch(`/api/subscriptions/check-payment?paymentId=${paymentId}`);
        if (!response.ok) throw new Error('Erro ao verificar pagamento');
        const data = await response.json();

        // Se aprovado, chama onSuccess e para o polling
        if (data.status === "approved") {
          console.log('✅ Pagamento aprovado! Finalizando polling.');
          pollingControllerRef.current = null;
          onSuccess();
          return;
        }

        // Se rejeitado, notifica e para
        if (data.status === "rejected") {
          console.log('❌ Pagamento rejeitado! Finalizando polling.');
          pollingControllerRef.current = null;
          alert('Pagamento rejeitado. Por favor, tente novamente.');
          onCancel();
          return;
        }

        // Recomenda intervalo enviado pelo servidor (ajusta para pending PIX)
        const nextMs = data.nextCheckInMs ?? (attempts < 10 ? 3000 : 10000);
        console.log(`⏱️ Próxima verificação em ${nextMs}ms (status: ${data.status})`);

        // Limite de tentativas razoável (ex.: 30 minutos)
        const maxAttempts = Math.max(10, Math.floor((30 * 60 * 1000) / nextMs));
        if (attempts >= maxAttempts) {
          console.log('⏰ Polling PIX: limite de tentativas atingido, parando verificações');
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
      <Card className="p-4 sm:p-6 md:p-8">
        <div className="text-center space-y-4 sm:space-y-6">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10">
            <QrCodeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          
          <div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">Pagamento via PIX</h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Pague R$ {amount.toFixed(2)} via PIX de forma rápida e segura
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
              <strong>Vantagens do PIX:</strong>
              <br />
              • Aprovação instantânea
              <br />
              • Sem taxas adicionais
              <br />
              • 100% seguro
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 min-h-[44px]"
            >
              Voltar
            </Button>
            <Button
              onClick={generatePix}
              className="flex-1 min-h-[44px]"
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
      <Card className="p-6 sm:p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
          <p className="text-sm sm:text-base text-muted-foreground">Gerando QR Code PIX...</p>
        </div>
      </Card>
    );
  }

  // Exibir QR Code
  return (
    <Card className="p-4 sm:p-6 md:p-8">
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Escaneie o QR Code</h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Use o app do seu banco para pagar
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-lg max-w-full">
            <Image
              src={`data:image/png;base64,${pixData!.qrCodeBase64}`}
              alt="QR Code PIX"
              width={256}
              height={256}
              className="w-full h-auto max-w-[200px] sm:max-w-[256px] md:max-w-[280px] mx-auto"
            />
          </div>
        </div>

        {/* Valor */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-muted-foreground mb-1">Valor a pagar</p>
          <p className="text-2xl sm:text-3xl font-bold text-primary">
            R$ {pixData!.amount.toFixed(2)}
          </p>
        </div>

        {/* Código Copia e Cola */}
        <div>
          <label className="text-xs sm:text-sm font-medium mb-2 block">
            Ou copie o código PIX:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={pixData!.qrCode}
              readOnly
              className="flex-1 px-3 py-2 text-xs sm:text-sm bg-muted border rounded-md font-mono overflow-hidden text-ellipsis min-h-[44px]"
            />
            <Button
              onClick={copyPixCode}
              variant="outline"
              size="sm"
              className="min-h-[44px] w-full sm:w-auto"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copiado!</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Copiar</span>
                  <span className="sm:hidden">Copiar Código</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
          <p className="font-semibold">Como pagar:</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Abra o app do seu banco</li>
            <li>Escolha pagar com PIX QR Code</li>
            <li>Escaneie o código acima</li>
            <li>Confirme o pagamento</li>
          </ol>
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="hidden sm:inline">Aguardando confirmação do pagamento...</span>
          <span className="sm:hidden">Aguardando pagamento...</span>
        </div>

        {/* Botão Cancelar */}
        <Button
          onClick={() => {
            console.log('🔴 Botão Cancelar clicado - versão atualizada');
            if (pollingControllerRef.current) {
              pollingControllerRef.current.cancelled = true;
              console.log('✅ Polling marcado para cancelamento');
            }
            onCancel();
          }}
          variant="ghost"
          className="w-full min-h-[44px]"
        >
          Cancelar
        </Button>
      </div>
    </Card>
  );
}
