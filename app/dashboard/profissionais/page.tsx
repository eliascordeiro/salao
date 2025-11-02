import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, User, Phone, Mail, Briefcase, Clock, Calendar, CalendarCheck } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { DeleteStaffButton } from "@/components/dashboard/delete-staff-button";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  // Buscar todos os profissionais
  const staff = await prisma.staff.findMany({
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profissionais</h1>
            <p className="text-gray-600 mt-2">
              Gerencie sua equipe de profissionais
            </p>
          </div>
          <Link href="/dashboard/profissionais/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Profissional
            </Button>
          </Link>
        </div>

        {/* Lista de Profissionais */}
        {staff.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum profissional cadastrado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece adicionando seu primeiro profissional
              </p>
              <Link href="/dashboard/profissionais/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Profissional
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staff.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {member.name}
                      </CardTitle>
                      {member.specialty && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Briefcase className="h-4 w-4 mr-1" />
                          {member.specialty}
                        </div>
                      )}
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        member.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {member.active ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-4">
                    {/* Email */}
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>

                    {/* Telefone */}
                    {member.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                        {member.phone}
                      </div>
                    )}

                    {/* Salão */}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Salão:</span>
                      <span className="ml-1">{member.salon.name}</span>
                    </div>

                    {/* Serviços */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Serviços prestados:
                      </p>
                      {member.services.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">
                          Nenhum serviço associado
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {member.services.slice(0, 3).map((s) => (
                            <span
                              key={s.serviceId}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {s.service.name}
                            </span>
                          ))}
                          {member.services.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{member.services.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">
                          {member._count.bookings}
                        </span>{" "}
                        agendamentos realizados
                      </p>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/dashboard/profissionais/${member.id}/editar`}
                      >
                        <Button variant="outline" className="w-full text-xs">
                          Editar
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/profissionais/${member.id}/horarios`}
                      >
                        <Button variant="outline" className="w-full text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          Horários
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/profissionais/${member.id}/slots`}
                      >
                        <Button variant="outline" className="w-full text-xs bg-green-50 hover:bg-green-100">
                          <CalendarCheck className="mr-1 h-3 w-3 text-green-600" />
                          <span className="text-green-700">Cadastrar Slots</span>
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/profissionais/${member.id}/disponibilidade`}
                      >
                        <Button variant="outline" className="w-full text-xs">
                          <Calendar className="mr-1 h-3 w-3" />
                          Bloqueios
                        </Button>
                      </Link>
                    </div>
                    <DeleteStaffButton staffId={member.id} staffName={member.name} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
