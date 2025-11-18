"use client"

import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { GridBackground } from "@/components/ui/grid-background"
import { Scissors, AlertCircle, ArrowLeft, Sparkles } from "lucide-react"
import { getFirstAccessibleRoute } from "@/lib/navigation-helper"
import { Permission } from "@/lib/permissions"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl")
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou senha incorretos")
      } else {
        // Se tem callbackUrl, usa ele; senão, usa rota baseada em permissões
        if (callbackUrl) {
          console.log("🔐 Login successful, redirecting to:", callbackUrl)
          router.push(callbackUrl)
          router.refresh()
        } else {
          // Fetch session to get user permissions
          const response = await fetch("/api/auth/session")
          const session = await response.json()
          
          if (session?.user) {
            const permissions = (session.user as any).permissions || []
            const roleType = (session.user as any).roleType
            
            // Get the first accessible route based on user permissions
            const redirectRoute = getFirstAccessibleRoute(permissions as Permission[], roleType)
            
            console.log("🔐 Login successful:", {
              user: session.user.name,
              role: session.user.role,
              roleType,
              permissions: permissions.length,
              redirectTo: redirectRoute
            })
            
            router.push(redirectRoute)
            router.refresh()
          } else {
            // Fallback if session fetch fails
            router.push("/dashboard")
            router.refresh()
          }
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Ocorreu um erro. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <GridBackground className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      </GridBackground>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Scissors className="h-10 w-10 text-primary group-hover:rotate-12 transition-transform" />
              <Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-3xl font-bold text-foreground">AgendaSalão</span>
          </Link>
        </div>

        {/* Card de Login */}
        <GlassCard glow="primary" className="p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-foreground-muted">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="glass-card border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background-alt border-border-hover focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-background-alt border-border-hover focus:border-primary transition-colors"
                />
              </div>

              <GradientButton
                type="submit"
                variant="primary"
                className="w-full py-3"
                disabled={isLoading}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </GradientButton>

              <div className="text-sm text-center text-foreground-muted">
                Ainda não tem uma conta?{" "}
                <Link href="/register" className="text-primary hover:text-accent font-medium transition-colors">
                  Cadastre-se
                </Link>
              </div>
            </form>

            {/* Credenciais de Teste */}
            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs text-foreground-muted mb-3 font-semibold flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-accent" />
                Credenciais de teste:
              </p>
              <div className="glass-card bg-background-alt/50 p-3 rounded-lg text-xs space-y-2 font-mono">
                <p className="text-foreground-muted">
                  <span className="text-primary font-semibold">Admin:</span> admin@agendasalao.com.br / admin123
                </p>
                <p className="text-foreground-muted">
                  <span className="text-accent font-semibold">Cliente:</span> pedro@exemplo.com / cliente123
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Link para Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-foreground-muted hover:text-primary transition-colors inline-flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}
