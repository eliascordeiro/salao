"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { ShieldAlert, ArrowLeft, Home } from "lucide-react"
import { useSession } from "next-auth/react"
import { getFirstAccessibleRoute } from "@/lib/navigation-helper"
import { Permission } from "@/lib/permissions"

export default function AccessDeniedPage() {
  const { data: session } = useSession()
  
  const permissions = (session?.user as any)?.permissions || []
  const roleType = (session?.user as any)?.roleType
  const firstAccessibleRoute = getFirstAccessibleRoute(permissions as Permission[], roleType)

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <GlassCard className="max-w-md w-full p-8 text-center" glow="destructive">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldAlert className="h-16 w-16 text-destructive" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">
          Acesso Negado
        </h1>
        
        <p className="text-foreground-muted mb-6">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador do sistema para solicitar acesso.
        </p>

        <div className="flex flex-col gap-3">
          <Link href={firstAccessibleRoute}>
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Ir para Página Inicial
            </Button>
          </Link>
          
          <Link href="/">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Site
            </Button>
          </Link>
        </div>

        {session?.user && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-foreground-muted">
              Logado como: <span className="font-medium text-foreground">{session.user.email}</span>
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}
