"use client"

import { useState, Suspense } from "react"
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
import Image from "next/image"

function LoginForm() {
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
            const role = session.user.role
            
            // Determinar rota de redirecionamento
            let redirectRoute = "/dashboard"
            
            // Se for PLATFORM_ADMIN, redireciona para platform-admin
            if (role === "PLATFORM_ADMIN") {
              redirectRoute = "/platform-admin"
            } 
            // Se for STAFF, redireciona para dashboard de profissional
            else if (roleType === "STAFF" || role === "STAFF") {
              redirectRoute = "/staff/dashboard"
            } else if (roleType === "OWNER" || role === "ADMIN") {
              // Para ADMIN/OWNER, redireciona para dashboard
              redirectRoute = "/dashboard"
            } else {
              // Para CUSTOM e outros, usa a primeira rota acessível baseada em permissões
              try {
                redirectRoute = getFirstAccessibleRoute(permissions as Permission[], roleType)
              } catch (error) {
                console.error("Error getting accessible route:", error)
                redirectRoute = "/dashboard" // Fallback seguro
              }
            }
            
            console.log("🔐 Login successful:", {
              user: session.user.name,
              role,
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Senha</Label>
                  <Link 
                    href="/esqueci-senha" 
                    className="text-xs text-primary hover:text-accent transition-colors font-medium"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
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

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-foreground-muted">ou continue com</span>
                </div>
              </div>

              {/* Google OAuth Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full min-h-[48px] py-3 gap-3 bg-white hover:bg-gray-50 dark:bg-white dark:hover:bg-gray-50 text-gray-700 dark:text-gray-700 border-gray-300 hover:border-gray-400 transition-all font-medium shadow-sm hover:shadow"
                onClick={async () => {
                  // Fetch session antes do signIn para determinar redirecionamento
                  const response = await fetch("/api/auth/session")
                  const session = await response.json()
                  const roleType = (session?.user as any)?.roleType
                  const role = session?.user?.role
                  
                  // Determinar callbackUrl baseado no tipo de usuário
                  let redirectUrl = callbackUrl || "/dashboard"
                  if (role === "PLATFORM_ADMIN") {
                    redirectUrl = "/platform-admin"
                  } else if (roleType === "STAFF" || role === "STAFF") {
                    redirectUrl = "/staff/dashboard"
                  }
                  
                  signIn("google", { callbackUrl: redirectUrl })
                }}
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
              </Button>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
