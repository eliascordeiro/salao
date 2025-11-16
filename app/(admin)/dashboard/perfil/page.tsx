"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, Save, Eye, EyeOff, Mail, Shield, Calendar } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/header"

export default function PerfilPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const securitySectionRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || "",
        email: session.user.email || "",
      })
    }
  }, [session])

  // Scroll para seção de segurança se tab=security
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab === "security" && securitySectionRef.current) {
      setTimeout(() => {
        securitySectionRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "center" 
        })
      }, 100)
    }
  }, [searchParams])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileData.name }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Perfil atualizado com sucesso!" })
        // Atualizar sessão
        await update({ name: profileData.name })
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao atualizar perfil" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao atualizar perfil" })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: "", text: "" })

    // Validações
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "A nova senha deve ter no mínimo 6 caracteres" })
      setLoading(false)
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem" })
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: "success", text: "Senha alterada com sucesso!" })
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } else {
        setMessage({ type: "error", text: data.error || "Erro ao alterar senha" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Erro ao alterar senha" })
    } finally {
      setLoading(false)
    }
  }

  const roleType = (session?.user as any)?.roleType
  const permissions = (session?.user as any)?.permissions || []

  return (
    <>
      {/* Dashboard Header */}
      {session?.user && (
        <DashboardHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      )}

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas informações pessoais e segurança
          </p>
        </div>

        {/* Mensagem de Feedback */}
        {message.text && (
          <Card className={`p-4 ${
            message.type === "success" 
              ? "bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400" 
              : "bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400"
          }`}>
            {message.text}
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Perfil */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Dados Pessoais</h2>
                <p className="text-sm text-muted-foreground">
                  Atualize suas informações pessoais
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </Card>

          {/* Alterar Senha */}
          <Card className="p-6" ref={securitySectionRef}>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Segurança</h2>
                <p className="text-sm text-muted-foreground">
                  Altere sua senha de acesso
                </p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Digite sua senha atual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Digite a nova senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Digite a nova senha novamente"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="gap-2">
                <Lock className="h-4 w-4" />
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Informações da Conta */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Informações da Conta
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tipo de Conta</p>
                <div className="flex items-center gap-2">
                  {roleType === "OWNER" && (
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-400 text-sm font-medium">
                      👑 Proprietário
                    </span>
                  )}
                  {roleType === "STAFF" && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium">
                      👤 Funcionário
                    </span>
                  )}
                  {roleType === "CUSTOM" && (
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm font-medium">
                      ⚙️ Personalizado
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{session?.user?.email}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Permissões</p>
                <p className="text-sm font-medium">
                  {roleType === "OWNER" 
                    ? "Acesso Total" 
                    : `${permissions.length} permissões configuradas`
                  }
                </p>
              </div>

              {session?.user && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Membro desde</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      {new Date((session.user as any).createdAt || Date.now()).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        </div>
      </div>
    </>
  )
}
