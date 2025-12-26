'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  MessageSquare, 
  Loader2, 
  CheckCircle2,
  XCircle,
  Phone,
  RefreshCw
} from 'lucide-react'

export default function WhatsGWPage() {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)
  const [phone, setPhone] = useState('')
  const [testPhone, setTestPhone] = useState('')
  const [testMessage, setTestMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Verificar status ao carregar
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000) // Polling a cada 10s
    return () => clearInterval(interval)
  }, [])

  /**
   * Verificar status da conexão
   */
  const checkStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp-gw/connect')
      const data = await res.json()

      setConnected(data.connected || false)
      setPhone(data.phone || '')
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    }
  }
  }

  /**
   * Desconectar (logout)
   */
  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/whatsapp-gw/disconnect', {
        method: 'POST',
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Desconectado com sucesso')
        setConnected(false)
        setQrCode(null)
        setPhone('')
      } else {
        toast.error(data.error || 'Erro ao desconectar')
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error)
      toast.error('Erro ao desconectar')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Enviar mensagem de teste
   */
  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Preencha telefone e mensagem')
      return
    }

    setSending(true)
    try {
      const res = await fetch('/api/whatsapp-gw/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testMessage,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('✅ Mensagem enviada com sucesso!')
        setTestMessage('')
      } else {
        toast.error(data.error || 'Erro ao enviar mensagem')
      }
    } catch (error) {
      console.error('Erro ao enviar:', error)
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp (WhatsGW)</h1>
        <p className="text-muted-foreground mt-2">
          Envie mensagens automáticas via WhatsGW Gateway
        </p>
      </div>

      {/* Status Card */}
      <Card className={connected ? 'border-green-500' : 'border-orange-500'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                WhatsApp Conectado
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-orange-600" />
                WhatsApp Desconectado
              </>
            )}
          </CardTitle>
          {phone && (
            <CardDescription>
              Número conectado: {phone}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Botões Conectar/Desconectar */}
          <div className="flex gap-2">
            {!connected ? (
              <Button onClick={handleConnect} disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Conectar WhatsApp
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleDisconnect} disabled={loading} variant="destructive" className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desconectando...
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Desconectar
                  </>
                )}
              </Button>
            )}
          </div>

          {/* QR Code */}
          {qrCode && !connected && (
            <div className="border rounded-lg p-6 bg-white flex flex-col items-center gap-4">
              <div className="text-center">
                <h3 className="font-semibold mb-2">Escaneie o QR Code</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Abra o WhatsApp no celular e escaneie este código
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <Image
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  width={256}
                  height={256}
                  className="w-64 h-64"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando conexão...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enviar Mensagem de Teste */}
      {connected && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensagem de Teste</CardTitle>
            <CardDescription>
              Teste o envio de mensagens via WhatsGW
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Número do Destinatário</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="testPhone"
                  type="tel"
                  placeholder="5541996123839"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: DDI + DDD + Número (ex: 5541996123839)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Mensagem</Label>
              <Textarea
                id="testMessage"
                placeholder="Digite sua mensagem de teste..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
              />
            </div>

            <Button onClick={handleSendTest} disabled={sending || !connected} className="w-full">
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info WhatsGW */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <AlertCircle className="h-5 w-5" />
            Configuração WhatsGW
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
          <p>📌 Configure as variáveis de ambiente no arquivo <code>.env</code>:</p>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded font-mono text-xs space-y-1">
            <div>WHATSGW_URL=http://localhost:3000</div>
            <div>WHATSGW_TOKEN=seu_token_aqui (opcional)</div>
          </div>
          <p className="pt-2">
            💡 Certifique-se de que o servidor WhatsGW está rodando antes de conectar
          </p>
          <p>
            📚 <a href="https://documenter.getpostman.com/view/3741041/SztBa7ku" target="_blank" rel="noopener noreferrer" className="underline">
              Documentação WhatsGW
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
