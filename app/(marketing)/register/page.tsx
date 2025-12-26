"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { GridBackground } from "@/components/ui/grid-background"
import { Scissors, AlertCircle, CheckCircle2, ArrowLeft, Sparkles, UserPlus } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Máscara de telefone
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '')
      let formattedValue = numericValue
      
      if (numericValue.length <= 11) {
        if (numericValue.length <= 2) {
          formattedValue = numericValue
        } else if (numericValue.length <= 7) {
          formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2)}`
        } else {
          formattedValue = `(${numericValue.slice(0, 2)}) ${numericValue.slice(2, 7)}-${numericValue.slice(7, 11)}`
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Validações
    if (!formData.phone || formData.phone.trim() === '') {
      setError("Telefone é obrigatório para receber notificações WhatsApp")
      setIsLoading(false)
      return
    }

    const phoneNumbers = formData.phone.replace(/\D/g, '')
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError("Telefone inválido. Digite um número com DDD")
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não coincidem")
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta")
      }

      setSuccess(true)
      
      // Fazer login automático após registro bem-sucedido
      console.log("✅ Conta criada, fazendo login automático...")
      
      const loginResult = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (loginResult?.error) {
        console.error("❌ Erro ao fazer login automático:", loginResult.error)
        // Se falhar o login automático, redireciona para login manual
        setTimeout(() => {
          router.push("/login")
        }, 2000)
        return
      }

      console.log("✅ Login automático realizado com sucesso")

      // Verificar se há agendamento pendente no localStorage
      const pendingBooking = localStorage.getItem("pendingBooking")
      
      if (pendingBooking) {
        try {
          const booking = JSON.parse(pendingBooking)
          console.log("📅 Agendamento pendente encontrado:", booking)
          
          // Redirecionar para página de agendamento do salão
          setTimeout(() => {
            router.push(`/salao/${booking.salonId}/agendar`)
            router.refresh()
          }, 1500)
        } catch (e) {
          console.error("❌ Erro ao processar agendamento pendente:", e)
          // Se houver erro, vai para rota padrão do cliente
          setTimeout(() => {
            router.push("/saloes")
            router.refresh()
          }, 1500)
        }
      } else {
        // Sem agendamento pendente, vai para lista de salões
        console.log("📋 Sem agendamento pendente, redirecionando para salões...")
        setTimeout(() => {
          router.push("/saloes")
          router.refresh()
        }, 1500)
      }
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <GridBackground className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-accent opacity-10" />
      </GridBackground>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Scissors className="h-10 w-10 text-accent group-hover:rotate-12 transition-transform" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-3xl font-bold text-foreground">AgendaSalão</span>
          </Link>
        </div>

        {/* Card de Registro */}
        <GlassCard glow="accent" className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              <UserPlus className="h-8 w-8 text-accent" />
              Criar sua conta
            </h1>
            <p className="text-foreground-muted">
              Preencha os dados abaixo para começar sua jornada
            </p>
          </div>

          <div>
            {success ? (
              <div className="glass-card border-accent/50 bg-accent/10 text-accent px-6 py-8 rounded-lg flex flex-col items-center gap-4 text-center animate-fadeIn">
                <div className="relative">
                  <CheckCircle2 className="h-16 w-16 animate-pulse" />
                  <Sparkles className="h-6 w-6 text-primary absolute -top-2 -right-2 animate-spin" />
                </div>
                <div>
                  <p className="text-foreground font-semibold text-lg">Conta criada com sucesso!</p>
                  <p className="text-foreground-muted text-sm mt-2">Entrando em sua conta...</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="glass-card border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Nome completo</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="bg-background-alt border-border-hover focus:border-accent transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="bg-background-alt border-border-hover focus:border-accent transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">
                    Telefone <span className="text-xs text-accent">(obrigatório para WhatsApp)</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(41) 99999-9999"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    maxLength={15}
                    className="bg-background-alt border-border-hover focus:border-accent transition-colors"
                  />
                  <p className="text-xs text-foreground-muted">Digite com DDD para receber notificações</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="bg-background-alt border-border-hover focus:border-accent transition-colors"
                  />
                  <p className="text-xs text-foreground-muted">Mínimo de 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="bg-background-alt border-border-hover focus:border-accent transition-colors"
                  />
                </div>

                <GradientButton
                  type="submit"
                  variant="accent"
                  className="w-full py-3 mt-6"
                  disabled={isLoading}
                >
                  {isLoading ? "Criando conta..." : "Criar conta"}
                </GradientButton>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-background text-foreground-muted">ou registre-se com</span>
                  </div>
                </div>

                {/* Google OAuth Button */}
                <button
                  type="button"
                  className="w-full min-h-[48px] py-3 px-4 gap-3 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 rounded-lg transition-all flex items-center justify-center font-medium shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => signIn("google", { callbackUrl: "/saloes" })}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continuar com Google
                </button>

                <div className="text-sm text-center text-foreground-muted pt-2">
                  Já tem uma conta?{" "}
                  <Link href="/login" className="text-accent hover:text-primary font-medium transition-colors">
                    Faça login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </GlassCard>

        {/* Link para Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-foreground-muted hover:text-accent transition-colors inline-flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
