"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, DollarSign, User, Calendar, Search, Filter, ArrowRight, Sparkles } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { AnimatedText } from "@/components/ui/animated-text";
import { GridBackground } from "@/components/ui/grid-background";
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
      <div className="min-h-screen bg-background">
        <DashboardHeader user={{ name: "", email: "", role: "CLIENT" }} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulseGlow">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-foreground-muted">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />

      <GridBackground>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Railway */}
          <div className="mb-12 animate-fadeInUp">
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Nossos <span className="text-primary font-bold">Serviços</span>
            </h1>
            <p className="text-foreground-muted text-lg">
              Escolha o serviço que você deseja agendar e tenha uma experiência incrível
            </p>
          </div>

          {/* Filtros Railway */}
          <GlassCard className="mb-8 animate-fadeInUp" style={{ animationDelay: "200ms" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Busca */}
              <div>
                <Label htmlFor="search" className="text-foreground mb-2 flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Buscar serviço
                </Label>
                <Input
                  id="search"
                  placeholder="Digite o nome do serviço..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-background-alt border-border-hover focus:border-primary transition-colors"
                />
              </div>

              {/* Categoria */}
              <div>
                <Label htmlFor="category" className="text-foreground mb-2 flex items-center gap-2">
                  <Filter className="h-4 w-4 text-accent" />
                  Categoria
                </Label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background-alt border border-border-hover rounded-lg text-foreground focus:outline-none focus:border-primary transition-colors"
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
          </GlassCard>

        {/* Lista de Serviços Railway */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-pulseGlow inline-block">
              <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
              <p className="text-foreground-muted text-lg">Carregando serviços incríveis...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <GlassCard className="py-20 text-center">
            <Search className="h-16 w-16 text-foreground-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nenhum serviço encontrado
            </h3>
            <p className="text-foreground-muted">
              Tente ajustar os filtros de busca ou escolha outra categoria
            </p>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeInUp" style={{ animationDelay: "400ms" }}>
            {filteredServices.map((service, index) => (
              <GlassCard
                key={service.id}
                hover
                glow="primary"
                className="group"
                style={{ animationDelay: `${400 + index * 100}ms` }}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    {service.category && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
                        {service.category}
                      </span>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {service.description && (
                  <p className="text-sm text-foreground-muted mb-4 leading-relaxed">
                    {service.description}
                  </p>
                )}

                {/* Informações do Serviço */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-foreground">
                    <div className="p-1.5 bg-accent/20 rounded-lg mr-3">
                      <Clock className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-sm font-medium">{service.duration} minutos</span>
                  </div>

                  <div className="flex items-center text-foreground">
                    <div className="p-1.5 bg-success/20 rounded-lg mr-3">
                      <DollarSign className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-lg font-bold text-success">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center text-foreground">
                    <div className="p-1.5 bg-primary/20 rounded-lg mr-3">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      {service.staff.length > 0
                        ? `${service.staff.length} profissional(is)`
                        : "Sem profissionais"}
                    </span>
                  </div>
                </div>

                {/* Profissionais */}
                {service.staff.length > 0 && (
                  <div className="mb-4 pt-3 border-t border-border/50">
                    <p className="text-xs text-foreground-muted mb-2 font-medium">
                      Profissionais disponíveis:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {service.staff.slice(0, 2).map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-background-alt border border-border text-foreground"
                        >
                          {s.name}
                        </span>
                      ))}
                      {service.staff.length > 2 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          +{service.staff.length - 2} mais
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Botão de Agendar */}
                <GradientButton
                  variant="primary"
                  className="w-full mt-4 group-hover:scale-105 transition-transform"
                  onClick={() => handleBookService(service.id)}
                  disabled={service.staff.length === 0}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Agora
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </GradientButton>
              </GlassCard>
            ))}
          </div>
        )}

        {/* Link para Meus Agendamentos Railway */}
        <div className="mt-12 text-center animate-fadeInUp" style={{ animationDelay: "600ms" }}>
          <Link href="/meus-agendamentos">
            <GlassCard hover className="inline-block px-8 py-4 group cursor-pointer">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-accent" />
                <span className="text-foreground font-medium">Ver Meus Agendamentos</span>
                <ArrowRight className="h-5 w-5 text-accent group-hover:translate-x-2 transition-transform" />
              </div>
            </GlassCard>
          </Link>
        </div>
      </div>
      </GridBackground>
    </div>
  );
}
