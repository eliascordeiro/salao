import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardHeader } from "@/components/dashboard/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, Clock, DollarSign } from "lucide-react"
import Link from "next/link"
import { DeleteServiceButton } from "@/components/dashboard/delete-service-button"

export default async function ServicesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const services = await prisma.service.findMany({
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
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Serviços
            </h1>
            <p className="text-gray-600">
              Gerencie os serviços oferecidos pelo seu salão
            </p>
          </div>
          <Link href="/dashboard/servicos/novo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Serviço
            </Button>
          </Link>
        </div>

        {/* Lista de Serviços */}
        {services.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 mb-4">Nenhum serviço cadastrado</p>
              <Link href="/dashboard/servicos/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Serviço
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                      {service.category && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                          {service.category}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      service.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  {service.description && (
                    <CardDescription className="mt-2">
                      {service.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Preço e Duração */}
                    <div className="flex justify-between items-center pb-3 border-b">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-lg">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{service.duration} min</span>
                      </div>
                    </div>

                    {/* Profissionais */}
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Profissionais:</p>
                      {service.staff.length === 0 ? (
                        <p className="text-sm text-gray-400">Nenhum profissional</p>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {service.staff.map((s) => (
                            <span key={s.id} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {s.staff.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Estatísticas */}
                    <div className="pt-3 border-t">
                      <p className="text-xs text-gray-500">
                        {service._count.bookings} agendamentos realizados
                      </p>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/servicos/${service.id}/editar`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Pencil className="h-3 w-3 mr-2" />
                          Editar
                        </Button>
                      </Link>
                      <DeleteServiceButton serviceId={service.id} serviceName={service.name} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
