import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { GlassCard } from "@/components/ui/glass-card"
import { GradientButton } from "@/components/ui/gradient-button"
import { GridBackground } from "@/components/ui/grid-background"
import { Plus, Pencil, Trash2, Clock, DollarSign, Sparkles, Users, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { DeleteServiceButton } from "@/components/dashboard/delete-service-button"
import { getUserSalonId } from "@/lib/salon-helper"

export default async function ServicesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  // Obter salão do usuário logado
  const userSalonId = await getUserSalonId()
  
  if (!userSalonId) {
    redirect("/dashboard")
  }

  const services = await prisma.service.findMany({
    where: {
      salonId: userSalonId,
    },
    include: {
      salon: true,
      staff: {
        include: {
          staff: true
        }
      },
      _count: {
        select: {
          bookings: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />
      
      <GridBackground>
        <main className="container mx-auto px-4 py-12">
          {/* Header Railway Style */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 animate-fadeInUp">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-primary" />
                Serviços
              </h1>
              <p className="text-foreground-muted text-lg">
                Gerencie os serviços oferecidos pelo seu salão
              </p>
            </div>
            <Link href="/dashboard/servicos/novo">
              <GradientButton variant="primary" className="group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Novo Serviço
              </GradientButton>
            </Link>
          </div>

          {/* Lista de Serviços Railway */}
          {services.length === 0 ? (
            <GlassCard className="p-12 text-center animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              <Sparkles className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse" />
              <p className="text-foreground-muted text-lg mb-6">Nenhum serviço cadastrado</p>
              <Link href="/dashboard/servicos/novo">
                <GradientButton variant="primary" className="group">
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Criar Primeiro Serviço
                </GradientButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {services.map((service, index) => (
                <GlassCard 
                  key={service.id} 
                  hover 
                  glow={service.active ? "success" : undefined}
                  className="p-6 animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                        {service.name}
                      </h3>
                      {service.category && (
                        <span className="text-xs text-foreground-muted glass-card bg-background-alt/50 px-2 py-1 rounded-md inline-block">
                          {service.category}
                        </span>
                      )}
                    </div>
                    {service.active ? (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md glass-card border-accent/50 bg-accent/10 text-accent">
                        <CheckCircle className="h-3 w-3" />
                        Ativo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md glass-card bg-background-alt/50 text-foreground-muted">
                        <XCircle className="h-3 w-3" />
                        Inativo
                      </span>
                    )}
                  </div>

                  {service.description && (
                    <p className="text-sm text-foreground-muted mb-4 line-clamp-2">
                      {service.description}
                    </p>
                  )}

                  {/* Preço e Duração */}
                  <div className="flex justify-between items-center py-3 mb-4 border-t border-b border-border">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-accent" />
                      <span className="font-bold text-xl text-primary">
                        R$ {service.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground-muted">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">{service.duration} min</span>
                    </div>
                  </div>

                  {/* Profissionais */}
                  <div className="mb-4">
                    <p className="text-xs text-foreground-muted mb-2 flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Profissionais:
                    </p>
                    {service.staff.length === 0 ? (
                      <p className="text-sm text-foreground-muted/60 italic">Nenhum profissional</p>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {service.staff.map((s) => (
                          <span key={s.id} className="text-xs glass-card bg-primary/10 text-primary px-2 py-1 rounded-md">
                            {s.staff.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Estatísticas */}
                  <div className="py-3 border-t border-border mb-4">
                    <p className="text-xs text-foreground-muted">
                      <span className="font-semibold text-primary">{service._count.bookings}</span> agendamentos realizados
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <Link href={`/dashboard/servicos/${service.id}/editar`} className="flex-1">
                      <GradientButton variant="accent" className="w-full text-sm group">
                        <Pencil className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                        Editar
                      </GradientButton>
                    </Link>
                    <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </GridBackground>
    </div>
  )
}
