"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, CheckCircle, XCircle, Send, AlertCircle } from "lucide-react"

interface EmailConfig {
  configured: boolean
  host: string | null
  port: string | null
  user: string | null
  secure: boolean
  from: string | null
  message: string
}

export default function ConfiguracoesEmailPage() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [testEmail, setTestEmail] = useState("")
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch("/api/email/send")
      const data = await res.json()
      setConfig(data)
    } catch (error) {
      console.error("Erro ao buscar configuração:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert("Digite um email para teste")
      return
    }

    setTestLoading(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmail,
          subject: "Email de Teste - Sistema de Agendamento",
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .success-icon { font-size: 48px; margin: 20px 0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Email de Teste</h1>
                  </div>
                  <div class="content">
                    <p>Parabéns! Seu sistema de email está funcionando corretamente.</p>
                    <p>Este é um email de teste enviado pelo <strong>Sistema de Agendamento para Salões & Barbearias</strong>.</p>
                    <hr>
                    <p style="color: #6b7280; font-size: 14px;">
                      Data do teste: ${new Date().toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setTestResult({
          success: true,
          message: `Email enviado com sucesso! Message ID: ${data.messageId}`,
        })
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || "Erro ao enviar email",
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "Erro ao enviar email",
      })
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configuração de Email</h1>
        <p className="text-muted-foreground mt-1">
          Configure o serviço de envio de emails SMTP
        </p>
      </div>

      {/* Status Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {config?.configured ? (
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          ) : (
            <div className="p-3 bg-red-500/10 rounded-full">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">
              {config?.configured ? "Email Configurado ✅" : "Email Não Configurado ⚠️"}
            </h2>
            <p className="text-muted-foreground mb-4">{config?.message}</p>

            {config?.configured && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Servidor SMTP</p>
                  <p className="font-medium">{config.host}:{config.port}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Usuário</p>
                  <p className="font-medium">{config.user}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Remetente Padrão</p>
                  <p className="font-medium">{config.from}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">SSL/TLS</p>
                  <p className="font-medium">{config.secure ? "Ativado" : "Desativado"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Configuration Instructions */}
      {!config?.configured && (
        <Card className="p-6 border-orange-500/50 bg-orange-500/5">
          <div className="flex gap-4">
            <AlertCircle className="h-6 w-6 text-orange-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold mb-2">Como Configurar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Adicione as seguintes variáveis de ambiente no arquivo <code>.env.local</code>:
              </p>
              <div className="bg-black/90 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`# Configuração SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com`}</pre>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Opções Populares:</strong></p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                  <li><strong>Gmail:</strong> smtp.gmail.com:587 (requer senha de app)</li>
                  <li><strong>SendGrid:</strong> smtp.sendgrid.net:587</li>
                  <li><strong>Mailtrap (dev):</strong> sandbox.smtp.mailtrap.io:587</li>
                  <li><strong>AWS SES:</strong> email-smtp.us-east-1.amazonaws.com:587</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Test Email */}
      {config?.configured && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Email de Teste
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Teste o envio de email para verificar se está funcionando corretamente
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="testEmail">Email de Teste</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="teste@exemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button onClick={sendTestEmail} disabled={testLoading} className="gap-2">
              {testLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar Teste
                </>
              )}
            </Button>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                testResult.success
                  ? "bg-green-500/10 border border-green-500/20"
                  : "bg-red-500/10 border border-red-500/20"
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    testResult.success ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
                  }`}
                >
                  {testResult.success ? "Sucesso!" : "Erro"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Features Card */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recursos do Sistema de Email</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Convites de Usuário</p>
              <p className="text-sm text-muted-foreground">
                Emails automáticos ao criar novos usuários
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Notificações de Agendamento</p>
              <p className="text-sm text-muted-foreground">
                Confirmações e lembretes automáticos
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Templates HTML</p>
              <p className="text-sm text-muted-foreground">
                Emails responsivos e personalizados
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Recuperação de Senha</p>
              <p className="text-sm text-muted-foreground">
                Sistema de reset de senha por email
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
