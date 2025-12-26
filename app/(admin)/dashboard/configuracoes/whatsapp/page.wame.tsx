'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, ExternalLink, Phone, CheckCircle2, Clock, Calendar, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

/**
 * Página de Envio Manual de WhatsApp
 * Usa links wa.me para abrir WhatsApp com mensagem pré-pronta
 */
export default function WhatsAppPage() {
  const [phone, setPhone] = useState('')
  const [customMessage, setCustomMessage] = useState('')

  // Templates de mensagens pré-prontas
  const templates = [
    {
      id: 'confirmacao',
      title: 'Confirmação de Agendamento',
      icon: CheckCircle2,
      color: 'text-green-600',
      message: `Olá! ✅

Seu agendamento foi confirmado:

📅 Data: [DATA]
🕐 Horário: [HORARIO]
💇 Serviço: [SERVICO]
👤 Profissional: [PROFISSIONAL]

Endereço: [ENDERECO]

Aguardamos você!`
    },
    {
      id: 'lembrete',
      title: 'Lembrete 24h Antes',
      icon: Clock,
      color: 'text-blue-600',
      message: `Olá! ⏰

Lembrando que você tem um agendamento amanhã:

📅 Data: [DATA]
🕐 Horário: [HORARIO]
💇 Serviço: [SERVICO]
👤 Profissional: [PROFISSIONAL]

Confirme sua presença respondendo esta mensagem.

Até breve!`
    },
    {
      id: 'cancelamento',
      title: 'Aviso de Cancelamento',
      icon: Calendar,
      color: 'text-red-600',
      message: `Olá! ❌

Informamos que seu agendamento foi cancelado:

📅 Data: [DATA]
🕐 Horário: [HORARIO]
💇 Serviço: [SERVICO]

Entre em contato para remarcar.`
    },
    {
      id: 'boas-vindas',
      title: 'Boas-vindas Cliente Novo',
      icon: User,
      color: 'text-purple-600',
      message: `Olá! 👋

Bem-vindo(a) ao nosso salão!

Estamos muito felizes em ter você como cliente. 

Ficou com alguma dúvida? É só responder esta mensagem.

Até breve! ✨`
    }
  ]

  /**
   * Formata número de telefone para formato internacional
   * Remove caracteres especiais e adiciona 55 se necessário
   */
  const formatPhone = (phoneNumber: string): string => {
    // Remove tudo exceto números
    let cleaned = phoneNumber.replace(/\D/g, '')
    
    // Adiciona código do Brasil se não tiver
    if (!cleaned.startsWith('55')) {
      cleaned = '55' + cleaned
    }
    
    return cleaned
  }

  /**
   * Abre WhatsApp Web/App com mensagem pré-pronta
   */
  const sendWhatsApp = (message: string) => {
    if (!phone) {
      alert('Por favor, digite o número do telefone')
      return
    }

    const formattedPhone = formatPhone(phone)
    const encodedMessage = encodeURIComponent(message)
    const url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    
    // Abre em nova aba
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-muted-foreground mt-2">
          Envie mensagens para seus clientes via WhatsApp Web/App
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <MessageSquare className="h-5 w-5" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-600 dark:text-blue-300">
          <p>✅ Digite o número do cliente</p>
          <p>✅ Escolha um template ou escreva uma mensagem personalizada</p>
          <p>✅ Clique em "Enviar WhatsApp"</p>
          <p>✅ O WhatsApp abrirá com a mensagem pré-pronta - só clicar Enviar!</p>
        </CardContent>
      </Card>

      {/* Formulário de Envio */}
      <Card>
        <CardHeader>
          <CardTitle>Enviar Mensagem</CardTitle>
          <CardDescription>
            Digite o número e escolha uma mensagem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Número */}
          <div className="space-y-2">
            <Label htmlFor="phone">Número do Cliente</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="(41) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Exemplo: 41999999999 ou (41) 99999-9999
            </p>
          </div>

          {/* Templates Pré-prontos */}
          <div className="space-y-3">
            <Label>Templates Pré-prontos</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                  onClick={() => sendWhatsApp(template.message)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg bg-gray-100 dark:bg-gray-800 p-2`}>
                        <template.icon className={`h-5 w-5 ${template.color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-sm">{template.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.message.split('\n')[0]}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Mensagem Personalizada */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem Personalizada</Label>
            <Textarea
              id="message"
              placeholder="Digite sua mensagem aqui..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={6}
            />
          </div>

          {/* Botão Enviar */}
          <Button
            size="lg"
            className="w-full"
            onClick={() => sendWhatsApp(customMessage || templates[0].message)}
            disabled={!phone}
          >
            <MessageSquare className="mr-2 h-5 w-5" />
            Enviar WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Dicas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 Dicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Substitua [DATA], [HORARIO], [SERVICO], etc. pelos dados reais antes de enviar</p>
          <p>• Use emojis para deixar as mensagens mais amigáveis ✨</p>
          <p>• Salve mensagens que você usa com frequência como favoritos no WhatsApp</p>
          <p>• O WhatsApp abrirá automaticamente - você só precisa clicar em Enviar</p>
        </CardContent>
      </Card>

      {/* Integração Futura */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">🚀 Quer Automação Total?</CardTitle>
          <CardDescription>
            Para envio automático de mensagens, considere integrar a WhatsApp Business API oficial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✅ Envio automático de confirmações</p>
          <p>✅ Lembretes 24h antes</p>
          <p>✅ Templates aprovados pelo WhatsApp</p>
          <p>✅ Webhooks e callbacks</p>
          <p className="text-xs pt-2">
            <strong>Custo:</strong> ~R$0,15 por mensagem | 
            <strong> Setup:</strong> Requer conta WhatsApp Business
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
