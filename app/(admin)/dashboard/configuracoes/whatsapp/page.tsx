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

  /**
   * Enviar mensagem de teste
   */
  const handleSendTest = async () => {
    if (!testPhone || !testMessage) {
      toast.error('Preencha o número e a mensagem')
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
        toast.success(`✅ Mensagem enviada com sucesso! ID: ${data.messageId}`)
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
          {/* Botão Atualizar Status */}
          <div className="flex gap-2">
            <Button onClick={checkStatus} disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Atualizar Status
                </>
              )}
            </Button>
          </div>

          {/* Mensagem de configuração se não conectado */}
          {!connected && (
            <div className="border border-orange-200 bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4">
              <p className="text-sm text-orange-700 dark:text-orange-400">
                ⚠️ Configure as variáveis WHATSGW_API_KEY e WHATSGW_PHONE_NUMBER no arquivo .env
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enviar Mensagem de Teste */}
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

      {/* Info WhatsGW */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <MessageSquare className="h-5 w-5" />
            Configuração WhatsGW
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
          <p>📌 Configure as variáveis de ambiente no arquivo <code>.env</code>:</p>
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded font-mono text-xs space-y-1">
            <div>WHATSGW_URL=https://app.whatsgw.com.br</div>
            <div>WHATSGW_API_KEY=seu_api_key_aqui</div>
            <div>WHATSGW_PHONE_NUMBER=5541996123839</div>
          </div>
          <p className="pt-2">
            💡 O telefone deve estar previamente conectado no painel WhatsGW
          </p>
          <p>
            📚 <a href="https://app.whatsgw.com.br" target="_blank" rel="noopener noreferrer" className="underline">
              Painel WhatsGW
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
