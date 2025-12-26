"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, QrCode, Send, LogOut, Wifi } from "lucide-react";
import Image from "next/image";

interface WhatsAppStatus {
  connected: boolean;
  qrCode?: string;
  phone?: string;
  message?: string;
}

export default function WhatsAppConfigPage() {
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema de agendamentos. 🎉");
  const [sendingTest, setSendingTest] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch status inicial
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/connect");
      const data = await res.json();
      setStatus(data);
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar status:", error);
      toast.error("Erro ao carregar status do WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Conectar ao WhatsApp com SSE
  const handleConnect = async () => {
    setConnecting(true);
    setQrCode(null);
    
    try {
      toast.info("🔌 Iniciando conexão WhatsApp...");
      
      // Iniciar conexão
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao conectar");
      }

      if (data.connected) {
        toast.success("✅ WhatsApp já está conectado!");
        setStatus({ connected: true, phone: data.phone });
        setConnecting(false);
        return;
      }

      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast.success("📱 QR Code gerado!");
      }

      // Iniciar SSE para receber atualizações em tempo real
      console.log("📡 Iniciando SSE...");
      const eventSource = new EventSource('/api/whatsapp/qrcode-stream');
      eventSourceRef.current = eventSource;

      eventSource.addEventListener('qrcode', (event) => {
        const data = JSON.parse(event.data);
        console.log("📱 QR Code recebido via SSE:", data);
        setQrCode(data.qrCode);
        toast.success("📱 QR Code atualizado!");
      });

      eventSource.addEventListener('connected', (event) => {
        const data = JSON.parse(event.data);
        console.log("✅ WhatsApp conectado via SSE:", data);
        toast.success("✅ WhatsApp conectado com sucesso!");
        setStatus({ connected: true });
        setQrCode(null);
        setConnecting(false);
        eventSource.close();
        fetchStatus(); // Atualizar status
      });

      eventSource.addEventListener('waiting', (event) => {
        const data = JSON.parse(event.data);
        console.log("⏳ Aguardando QR Code:", data);
      });

      eventSource.addEventListener('error', (event) => {
        const data = JSON.parse(event.data);
        console.error("❌ Erro no SSE:", data);
        toast.error(data.error || "Erro na conexão");
      });

      eventSource.addEventListener('timeout', (event) => {
        const data = JSON.parse(event.data);
        console.log("⏱️ Timeout:", data);
        toast.error("⏱️ Tempo limite excedido. Tente novamente.");
        setConnecting(false);
        eventSource.close();
      });

      eventSource.onerror = () => {
        console.error("❌ Erro na conexão SSE");
        eventSource.close();
        setConnecting(false);
      };

    } catch (error) {
      console.error("❌ Erro ao conectar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao conectar WhatsApp");
      setConnecting(false);
    }
  };

  // Desconectar
  const handleDisconnect = async () => {
    try {
      toast.info("🔌 Desconectando...");
      
      const res = await fetch("/api/whatsapp/disconnect", {
        method: "DELETE",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Erro ao desconectar");
      }

      toast.success("✅ WhatsApp desconectado!");
      setStatus({ connected: false });
      setQrCode(null);
      
      // Fechar SSE se estiver aberto
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
    } catch (error) {
      console.error("❌ Erro ao desconectar:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao desconectar");
    }
  };

  // Enviar mensagem de teste
  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error("Preencha o telefone e a mensagem");
      return;
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar mensagem");
      }

      toast.success("✅ Mensagem enviada com sucesso!");
      setTestPhone("");
    } catch (error) {
      console.error("❌ Erro ao enviar mensagem:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    } finally {
      setSendingTest(false);
    }
  };

  // Cleanup SSE
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Configuração WhatsApp</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Conecte o WhatsApp (Baileys nativo) para enviar notificações automáticas
        </p>
      </div>

      {/* Status Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
          <CardDescription>
            WhatsApp integrado via Baileys (sem Evolution API)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            {status.connected ? (
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {status.connected ? "✅ WhatsApp Conectado" : "⚠️ WhatsApp Desconectado"}
              </p>
              {status.phone && (
                <p className="text-sm text-muted-foreground">
                  Número: +{status.phone}
                </p>
              )}
              {status.message && (
                <p className="text-sm text-muted-foreground">
                  {status.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {!status.connected ? (
              <Button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full"
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
            ) : (
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* QR Code Card */}
      {qrCode && !status.connected && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code de Conexão
            </CardTitle>
            <CardDescription>
              Escaneie este código com o WhatsApp no seu celular
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <Image
                src={qrCode}
                alt="QR Code WhatsApp"
                width={300}
                height={300}
                className="w-72 h-72"
              />
            </div>
            <div className="text-center max-w-md space-y-2">
              <p className="text-sm font-medium">Como conectar:</p>
              <ol className="text-sm text-muted-foreground text-left space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em Menu (⋮) → <strong>Aparelhos conectados</strong></li>
                <li>3. Toque em <strong>Conectar um aparelho</strong></li>
                <li>4. Aponte a câmera para este QR Code</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Aguardando QR Code */}
      {connecting && !qrCode && !status.connected && (
        <Card className="glass-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg font-medium">Gerando QR Code...</p>
            <p className="text-sm text-muted-foreground">Aguarde alguns segundos</p>
          </CardContent>
        </Card>
      )}

      {/* Teste de Mensagem */}
      {status.connected && (
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
            <div>
              <Label htmlFor="testPhone">Telefone (com DDI e DDD)</Label>
              <Input
                id="testPhone"
                placeholder="5541999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="glass-card"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Exemplo: 5541999999999 (55 = Brasil, 41 = Curitiba)
              </p>
            </div>

            <div>
              <Label htmlFor="testMessage">Mensagem</Label>
              <textarea
                id="testMessage"
                className="glass-card w-full min-h-[100px] p-3 rounded-md border border-primary/20 bg-background-alt/50 backdrop-blur-sm"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>

            <Button
              onClick={handleSendTest}
              disabled={sendingTest || !testPhone || !testMessage}
              className="w-full"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem de Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
