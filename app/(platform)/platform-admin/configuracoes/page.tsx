"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Settings,
  Mail,
  CreditCard,
  Shield,
  Bell,
  Database,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface PlatformSettings {
  // Features
  features: {
    allowNewRegistrations: boolean
    allowSalonCreation: boolean
    requireEmailVerification: boolean
    enablePayments: boolean
    enableSubscriptions: boolean
    maintenanceMode: boolean
  }
  // Trial
  trial: {
    enabled: boolean
    durationDays: number
  }
  // Email
  email: {
    fromName: string
    fromEmail: string
    replyTo: string
  }
  // Payment
  payment: {
    stripeEnabled: boolean
    mercadoPagoEnabled: boolean
    currency: string
  }
  // Notifications
  notifications: {
    emailNotifications: boolean
    smsNotifications: boolean
    webhookUrl: string
  }
  // System
  system: {
    maxSalonsPerUser: number
    maxStaffPerSalon: number
    maxServicesPerSalon: number
    sessionTimeout: number
  }
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    setLoading(true)
    try {
      const response = await fetch("/api/platform/settings")
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error)
      // Fallback com configurações padrão
      setSettings({
        features: {
          allowNewRegistrations: true,
          allowSalonCreation: true,
          requireEmailVerification: false,
          enablePayments: true,
          enableSubscriptions: true,
          maintenanceMode: false,
        },
        trial: {
          enabled: true,
          durationDays: 14,
        },
        email: {
          fromName: "SalãoBlza",
          fromEmail: "noreply@salaoblza.com.br",
          replyTo: "suporte@salaoblza.com.br",
        },
        payment: {
          stripeEnabled: true,
          mercadoPagoEnabled: true,
          currency: "BRL",
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          webhookUrl: "",
        },
        system: {
          maxSalonsPerUser: 5,
          maxStaffPerSalon: 50,
          maxServicesPerSalon: 100,
          sessionTimeout: 30,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!settings) return

    setSaving(true)
    setSaveSuccess(false)
    try {
      const response = await fetch("/api/platform/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } else {
        throw new Error("Erro ao salvar configurações")
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
      alert("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Settings className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Configure a plataforma globalmente</p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950 px-4 py-2 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-medium">Configurações salvas!</span>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {settings.features.maintenanceMode && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900 dark:text-orange-100">
                  Modo de Manutenção Ativo
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  A plataforma está em manutenção. Apenas admins podem acessar.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Features */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recursos da Plataforma
            </CardTitle>
            <CardDescription>Ative ou desative recursos globalmente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Novos Registros</Label>
                <p className="text-sm text-muted-foreground">
                  Usuários podem criar novas contas
                </p>
              </div>
              <Switch
                checked={settings.features.allowNewRegistrations}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, allowNewRegistrations: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Permitir Criação de Salões</Label>
                <p className="text-sm text-muted-foreground">
                  Usuários podem cadastrar novos salões
                </p>
              </div>
              <Switch
                checked={settings.features.allowSalonCreation}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, allowSalonCreation: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Verificação de Email</Label>
                <p className="text-sm text-muted-foreground">
                  Exigir verificação de email para novos usuários
                </p>
              </div>
              <Switch
                checked={settings.features.requireEmailVerification}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, requireEmailVerification: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pagamentos Online</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar sistema de pagamentos (Stripe)
                </p>
              </div>
              <Switch
                checked={settings.features.enablePayments}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, enablePayments: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Assinaturas</Label>
                <p className="text-sm text-muted-foreground">
                  Habilitar sistema de assinaturas (Mercado Pago)
                </p>
              </div>
              <Switch
                checked={settings.features.enableSubscriptions}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, enableSubscriptions: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <div className="space-y-0.5">
                <Label className="text-orange-600">Modo de Manutenção</Label>
                <p className="text-sm text-muted-foreground">
                  Bloquear acesso de todos os usuários (exceto admins)
                </p>
              </div>
              <Switch
                checked={settings.features.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    features: { ...settings.features, maintenanceMode: checked },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Trial Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Período de Teste
            </CardTitle>
            <CardDescription>Configure o trial gratuito para novos salões</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Habilitar Trial</Label>
                <p className="text-sm text-muted-foreground">
                  Novos salões terão período de teste gratuito
                </p>
              </div>
              <Switch
                checked={settings.trial.enabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    trial: { ...settings.trial, enabled: checked },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Duração do Trial (dias)</Label>
              <Input
                type="number"
                value={settings.trial.durationDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    trial: { ...settings.trial, durationDays: parseInt(e.target.value) || 14 },
                  })
                }
                min={1}
                max={90}
              />
              <p className="text-sm text-muted-foreground">Padrão: 14 dias</p>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configurações de Email
            </CardTitle>
            <CardDescription>Configure os emails enviados pela plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Remetente</Label>
              <Input
                value={settings.email.fromName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, fromName: e.target.value },
                  })
                }
                placeholder="SalãoBlza"
              />
            </div>

            <div className="space-y-2">
              <Label>Email do Remetente</Label>
              <Input
                type="email"
                value={settings.email.fromEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, fromEmail: e.target.value },
                  })
                }
                placeholder="noreply@salaoblza.com.br"
              />
            </div>

            <div className="space-y-2">
              <Label>Email de Resposta</Label>
              <Input
                type="email"
                value={settings.email.replyTo}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    email: { ...settings.email, replyTo: e.target.value },
                  })
                }
                placeholder="suporte@salaoblza.com.br"
              />
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Configurações de Pagamento
            </CardTitle>
            <CardDescription>Configure os provedores de pagamento</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Stripe</Label>
                <p className="text-sm text-muted-foreground">
                  Pagamentos de agendamentos via Stripe
                </p>
              </div>
              <Switch
                checked={settings.payment.stripeEnabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, stripeEnabled: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Mercado Pago</Label>
                <p className="text-sm text-muted-foreground">
                  Assinaturas mensais via Mercado Pago
                </p>
              </div>
              <Switch
                checked={settings.payment.mercadoPagoEnabled}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, mercadoPagoEnabled: checked },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Moeda</Label>
              <Select
                value={settings.payment.currency}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, currency: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BRL">BRL - Real Brasileiro</SelectItem>
                  <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>Configure as notificações da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar emails de confirmação e lembretes
                </p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, emailNotifications: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações por SMS</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar SMS para agendamentos e lembretes
                </p>
              </div>
              <Switch
                checked={settings.notifications.smsNotifications}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, smsNotifications: checked },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook URL (opcional)</Label>
              <Input
                type="url"
                value={settings.notifications.webhookUrl}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: { ...settings.notifications, webhookUrl: e.target.value },
                  })
                }
                placeholder="https://exemplo.com/webhook"
              />
              <p className="text-sm text-muted-foreground">
                URL para receber eventos da plataforma
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Limits */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Limites do Sistema
            </CardTitle>
            <CardDescription>Defina limites para recursos da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Máximo de Salões por Usuário</Label>
              <Input
                type="number"
                value={settings.system.maxSalonsPerUser}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, maxSalonsPerUser: parseInt(e.target.value) || 5 },
                  })
                }
                min={1}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Máximo de Profissionais por Salão</Label>
              <Input
                type="number"
                value={settings.system.maxStaffPerSalon}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, maxStaffPerSalon: parseInt(e.target.value) || 50 },
                  })
                }
                min={1}
                max={500}
              />
            </div>

            <div className="space-y-2">
              <Label>Máximo de Serviços por Salão</Label>
              <Input
                type="number"
                value={settings.system.maxServicesPerSalon}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: {
                      ...settings.system,
                      maxServicesPerSalon: parseInt(e.target.value) || 100,
                    },
                  })
                }
                min={1}
                max={1000}
              />
            </div>

            <div className="space-y-2">
              <Label>Timeout de Sessão (minutos)</Label>
              <Input
                type="number"
                value={settings.system.sessionTimeout}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    system: { ...settings.system, sessionTimeout: parseInt(e.target.value) || 30 },
                  })
                }
                min={5}
                max={1440}
              />
              <p className="text-sm text-muted-foreground">
                Tempo de inatividade antes de desconectar (padrão: 30 min)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Todas as Configurações"}
        </Button>
      </div>
    </div>
  )
}
