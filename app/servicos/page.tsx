"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, DollarSign, User, Calendar } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  staff: {
    id: string;
    name: string;
  }[];
}

export default function ServicesPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services?activeOnly=true");
        const data = await response.json();
        
        if (response.ok) {
          // A API já retorna apenas serviços ativos
          setServices(data);
        } else {
          console.error("Erro ao carregar serviços:", data.error);
          setServices([]);
        }
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Obter categorias únicas
  const categories = Array.from(
    new Set(services.map((s) => s.category).filter(Boolean))
  );

  // Filtrar serviços
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      !selectedCategory || service.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleBookService = (serviceId: string) => {
    if (!session) {
      router.push("/login");
      return;
    }
    router.push(`/agendar?serviceId=${serviceId}`);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
        <div className="flex items-center justify-center h-64">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={session.user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nossos Serviços</h1>
          <p className="text-gray-600 mt-2">
            Escolha o serviço que você deseja agendar
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Busca */}
              <div>
                <Label htmlFor="search">Buscar serviço</Label>
                <Input
                  id="search"
                  placeholder="Digite o nome do serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category">Categoria</Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Serviços */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando serviços...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum serviço encontrado
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">
                        {service.name}
                      </CardTitle>
                      {service.category && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.category}
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    {/* Descrição */}
                    {service.description && (
                      <p className="text-sm text-gray-600">
                        {service.description}
                      </p>
                    )}

                    {/* Informações */}
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-700">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{service.duration} minutos</span>
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <DollarSign className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="font-semibold text-green-600">
                          R$ {service.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-700">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        <span>
                          {service.staff.length > 0
                            ? `${service.staff.length} profissional(is)`
                            : "Sem profissionais"}
                        </span>
                      </div>
                    </div>

                    {/* Profissionais */}
                    {service.staff.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Profissionais disponíveis:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {service.staff.slice(0, 2).map((s) => (
                            <span
                              key={s.id}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {s.name}
                            </span>
                          ))}
                          {service.staff.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{service.staff.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Botão de Agendar */}
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleBookService(service.id)}
                      disabled={service.staff.length === 0}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Link para Meus Agendamentos */}
        <div className="mt-8 text-center">
          <Link href="/meus-agendamentos">
            <Button variant="outline">Ver Meus Agendamentos</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
