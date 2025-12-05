import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, User, Phone, Mail, Briefcase, Clock, Calendar, CalendarCheck, Sparkles, CheckCircle, XCircle, Users } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { prisma } from "@/lib/prisma";
import { DeleteStaffButton } from "@/components/dashboard/delete-staff-button";
import { getUserSalonId } from "@/lib/salon-helper";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Obter salão do usuário logado
  const userSalonId = await getUserSalonId();
  
  if (!userSalonId) {
    redirect("/dashboard");
  }

  // Buscar profissionais do salão do usuário
  const staff = await prisma.staff.findMany({
    where: {
      salonId: userSalonId,
    },
    include: {
      salon: {
        select: {
          name: true,
        },
      },
      services: {
        include: {
          service: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <main className="container mx-auto px-4 py-12">
          {/* Header Railway Style */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10 animate-fadeInUp">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Users className="h-8 w-8 text-accent" />
                Profissionais
              </h1>
              <p className="text-foreground-muted text-lg">
                Gerencie sua equipe de profissionais
              </p>
            </div>
            <Link href="/dashboard/profissionais/novo">
              <GradientButton variant="accent" className="group">
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Novo Profissional
              </GradientButton>
            </Link>
          </div>

          {/* Lista de Profissionais Railway */}
          {staff.length === 0 ? (
            <GlassCard className="p-12 text-center animate-fadeInUp" style={{ animationDelay: "200ms" }}>
              <User className="h-16 w-16 text-accent mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                Nenhum profissional cadastrado
              </h3>
              <p className="text-foreground-muted mb-6">
                Comece adicionando seu primeiro profissional
              </p>
              <Link href="/dashboard/profissionais/novo">
                <GradientButton variant="accent" className="group">
                  <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                  Adicionar Profissional
                </GradientButton>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {staff.map((member, index) => (
                <GlassCard 
                  key={member.id} 
                  hover 
                  glow={member.active ? "success" : undefined}
                  className="p-6 animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <User className="h-5 w-5 text-accent" />
                        {member.name}
                      </h3>
                      {member.specialty && (
                        <div className="flex items-center text-sm text-foreground-muted mb-2">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {member.specialty}
                        </div>
                      )}
                    </div>
                    {member.active ? (
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

                  {/* Detalhes */}
                  <div className="space-y-3 mb-4">
                    {/* Email */}
                    <div className="flex items-center text-sm text-foreground-muted">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0 text-primary" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {/* Telefone */}
                    {member.phone && (
                      <div className="flex items-center text-sm text-foreground-muted">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0 text-accent" />
                        {member.phone}
                      </div>
                    )}

                    {/* Salão */}
                    <div className="flex items-center text-sm text-foreground-muted">
                      <span className="font-semibold text-foreground">Salão:</span>
                      <span className="ml-1">{member.salon.name}</span>
                    </div>

                    {/* Serviços */}
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Serviços prestados:
                      </p>
                      {member.services.length === 0 ? (
                        <p className="text-sm text-foreground-muted/60 italic">
                          Nenhum serviço associado
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {member.services.slice(0, 3).map((s) => (
                            <span
                              key={s.serviceId}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass-card bg-primary/10 text-primary"
                            >
                              {s.service.name}
                            </span>
                          ))}
                          {member.services.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium glass-card bg-background-alt/50 text-foreground-muted">
                              +{member.services.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-foreground-muted">
                        <span className="font-bold text-accent">
                          {member._count.bookings}
                        </span>{" "}
                        agendamentos realizados
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/dashboard/profissionais/${member.id}/editar`}>
                        <GradientButton variant="accent" className="w-full text-xs">
                          Editar
                        </GradientButton>
                      </Link>
                      <DeleteStaffButton staffId={member.id} staffName={member.name} />
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </main>
      </GridBackground>
    </div>
  );
}
