"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, QrCode, Phone, Send, LogOut } from "lucide-react";
import { FeatureGate, PremiumBadge } from "@/components/subscription/feature-gate";

interface WhatsAppStatus {
  configured: boolean;
  connected: boolean;
  status?: string;
  instance?: any;
  qrCode?: string;
}

export default function WhatsAppConfigPage() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema de agendamentos. 🎉");
  const [sendingTest, setSendingTest] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [directQrCode, setDirectQrCode] = useState<string | null>(null);
  const [loadingDirectQR, setLoadingDirectQR] = useState(false);

  const fetchDirectQRCode = async () => {
    setLoadingDirectQR(true);
    try {
      // Buscar o QR Code diretamente da Evolution API
      const evolutionUrl = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'https://evolution-api-production-1e60.up.railway.app';
      const evolutionKey = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || 'bedb4e0217e8c56c614744381abfe24a569c71aba568764e3035db899901e224';
      const instanceName = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE_NAME || 'salon-booking';

      console.log('🔍 Buscando QR Code direto da Evolution API...');
      console.log('URL:', `${evolutionUrl}/instance/connect/${instanceName}`);

      const response = await fetch(`${evolutionUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('📱 Resposta da Evolution API:', data);

      if (data.base64 || data.code) {
        const qrCodeData = data.base64 || data.code;
        setDirectQrCode(qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`);
        toast.success('QR Code carregado com sucesso!');
      } else if (data.pairingCode) {
        toast.info(`Código de pareamento: ${data.pairingCode}`);
      } else {
        toast.warning('QR Code ainda não disponível. Aguarde alguns segundos e tente novamente.');
      }
    } catch (error) {
      console.error('❌ Erro ao buscar QR Code direto:', error);
      toast.error('Erro ao carregar QR Code. Verifique as configurações.');
    } finally {
      setLoadingDirectQR(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();

      if (res.status === 403) {
        setHasAccess(false);
        return;
      }

      setHasAccess(true);
      setStatus(data);
    } catch (error) {
      console.error("Erro ao buscar status:", error);
      toast.error("Erro ao carregar status do WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/whatsapp/status", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "QR Code gerado!");
        await fetchStatus();
      } else {
        // Se precisa configuração manual
        if (data.needsManualSetup) {
          toast.error(data.error || "Configuração manual necessária", {
            description: data.message,
            duration: 10000,
          });
          
          // Mostrar instruções em um alert
          const instructions = data.instructions?.join('\n\n') || '';
          alert(
            `⚠️ Configuração Manual Necessária\n\n` +
            `${data.message}\n\n` +
            `Instruções:\n\n${instructions}`
          );
        } else {
          toast.error(data.error || "Erro ao conectar");
        }
      }
    } catch (error) {
      console.error("Erro ao conectar:", error);
      toast.error("Erro ao gerar QR Code");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Deseja realmente desconectar o WhatsApp?")) return;

    setDisconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/status", {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Desconectado com sucesso!");
        await fetchStatus();
      } else {
        toast.error(data.error || "Erro ao desconectar");
      }
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast.error("Erro ao desconectar WhatsApp");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Preencha o telefone e a mensagem");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Mensagem enviada com sucesso!");
        setTestPhone("");
      } else {
        toast.error(data.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("Erro ao enviar teste:", error);
      toast.error("Erro ao enviar mensagem de teste");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <FeatureGate
      hasAccess={hasAccess}
      featureName="Notificações WhatsApp"
      showUpgrade={true}
    >
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Configuração WhatsApp</h1>
            <PremiumBadge />
          </div>
          <p className="text-muted-foreground mt-1">
            Conecte o WhatsApp para enviar notificações automáticas aos clientes
          </p>
        </div>

        {/* Status Card */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Status da Conexão
            </CardTitle>
            <CardDescription>
              Acompanhe o status da conexão com o WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                {status?.configured ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Configurado</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.configured ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status?.connected ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Conectado</p>
                  <p className="text-xs text-muted-foreground">
                    {status?.connected ? "Sim" : "Não"}
                  </p>
                </div>
              </div>
            </div>

            {status?.status && (
              <div>
                <p className="text-sm font-medium">Status da Instância:</p>
                <p className="text-sm text-muted-foreground">{status.status}</p>
              </div>
            )}

            <div className="flex gap-2">
              {!status?.connected ? (
                <>
                  <Button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full sm:w-auto"
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Conectar WhatsApp
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={fetchDirectQRCode}
                    disabled={loadingDirectQR}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    {loadingDirectQR ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Ver QR Code Direto
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  {disconnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Desconectando...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Desconectar
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={fetchStatus}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Atualizar Status
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card */}
        {(status?.qrCode || directQrCode) && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code de Conexão {directQrCode && '(Direto da Evolution API)'}
              </CardTitle>
              <CardDescription>
                Escaneie este QR Code com o WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={directQrCode || status.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados
                → Conectar um aparelho → Escaneie este QR Code
              </p>
              {directQrCode && (
                <Button
                  onClick={fetchDirectQRCode}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  Atualizar QR Code
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Code Card */}
        {status?.qrCode && false && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code de Conexão
              </CardTitle>
              <CardDescription>
                Escaneie este QR Code com o WhatsApp Business
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <img
                  src={status.qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center max-w-md">
                Abra o WhatsApp no seu celular → Menu (⋮) → Aparelhos conectados
                → Conectar um aparelho → Escaneie este QR Code
              </p>
            </CardContent>
          </Card>
        )}

        {/* Test Message Card */}
        {status?.connected && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Enviar Mensagem de Teste
              </CardTitle>
              <CardDescription>
                Teste o envio de mensagens WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testPhone">Telefone (com DDD)</Label>
                <Input
                  id="testPhone"
                  placeholder="11999999999"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="glass-card"
                />
                <p className="text-xs text-muted-foreground">
                  Digite apenas números (DDD + telefone)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testMessage">Mensagem</Label>
                <textarea
                  id="testMessage"
                  className="glass-card w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-primary/20 bg-background-alt/50 focus:outline-none focus:ring-2 focus:ring-primary/50 backdrop-blur-sm resize-none"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSendTest}
                disabled={sendingTest}
                className="w-full sm:w-auto"
              >
                {sendingTest ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensagem Teste
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle>ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• As notificações são enviadas automaticamente nos seguintes momentos:</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Novo agendamento criado</li>
              <li>Agendamento confirmado</li>
              <li>Lembrete 24h antes do horário</li>
              <li>Agendamento cancelado</li>
              <li>Agendamento concluído (pedido de avaliação)</li>
            </ul>
            <p className="mt-4">
              • O email sempre é enviado como backup, mesmo com WhatsApp ativo
            </p>
            <p>• Use um número com WhatsApp Business para melhor experiência</p>
          </CardContent>
        </Card>
      </div>
    </FeatureGate>
  );
}
