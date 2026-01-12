"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BookingsLineChart } from "@/components/analytics/BookingsLineChart";
import { ServicesBarChart } from "@/components/analytics/ServicesBarChart";
import { StatusPieChart } from "@/components/analytics/StatusPieChart";
import { RevenueAreaChart } from "@/components/analytics/RevenueAreaChart";
import { TrendingUp, TrendingDown, DollarSign, Calendar, CheckCircle, XCircle } from "lucide-react";

interface StatsData {
  period: string;
  summary: {
    totalBookings: number;
    totalRevenue: number;
    completionRate: number;
    cancellationRate: number;
  };
  growth: {
    bookingsGrowth: number;
    revenueGrowth: number;
  };
}

export default function RelatoriosPage() {
  const [period, setPeriod] = useState("30d");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/stats?period=${period}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [period]);

  const periodDays = {
    "7d": 7,
    "30d": 30,
    "3m": 90,
    "1y": 365,
  };

  const periodLabels = {
    "7d": "7 dias",
    "30d": "30 dias",
    "3m": "3 meses",
    "1y": "1 ano",
  };

  return (
    <div className="space-y-6">
      {/* Header Responsivo */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Relatórios & Análises</h1>
          <p className="text-gray-600 text-sm md:text-base mt-1">
            Visualize o desempenho do seu negócio
          </p>
        </div>

        {/* Botões de Período - Grid em Mobile */}
        <div className="grid grid-cols-2 sm:flex gap-2">
          {Object.entries(periodLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm md:text-base font-medium ${
                period === key
                  ? "bg-primary text-white shadow-md"
                  : "bg-transparent border-2 border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Principais */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 md:p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total de Agendamentos */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Total de Agendamentos</p>
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.summary.totalBookings}
            </p>
            <div className="flex items-center mt-2">
              {stats.growth.bookingsGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  stats.growth.bookingsGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(stats.growth.bookingsGrowth).toFixed(1)}% vs período
                anterior
              </span>
            </div>
          </Card>

          {/* Receita Total */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Receita Total</p>
              <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold">
              R$ {stats.summary.totalRevenue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <div className="flex items-center mt-2">
              {stats.growth.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-1" />
              )}
              <span
                className={`text-xs sm:text-sm ${
                  stats.growth.revenueGrowth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {Math.abs(stats.growth.revenueGrowth).toFixed(1)}% vs período
                anterior
              </span>
            </div>
          </Card>

          {/* Taxa de Conclusão */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Taxa de Conclusão</p>
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.summary.completionRate.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Agendamentos concluídos com sucesso
            </p>
          </Card>

          {/* Taxa de Cancelamento */}
          <Card className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs sm:text-sm text-gray-600">Taxa de Cancelamento</p>
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold">
              {stats.summary.cancellationRate.toFixed(1)}%
            </p>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">
              Agendamentos cancelados
            </p>
          </Card>
        </div>
      ) : null}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Agendamentos ao Longo do Tempo */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">
            Agendamentos ao Longo do Tempo
          </h2>
          <BookingsLineChart days={periodDays[period as keyof typeof periodDays]} />
        </Card>

        {/* Receita por Período */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">Receita por Período</h2>
          <RevenueAreaChart
            days={periodDays[period as keyof typeof periodDays]}
            groupBy={period === "1y" ? "month" : period === "3m" ? "week" : "day"}
          />
        </Card>

        {/* Serviços Mais Populares */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">Serviços Mais Populares</h2>
          <ServicesBarChart
            days={periodDays[period as keyof typeof periodDays]}
            limit={10}
          />
        </Card>

        {/* Status dos Agendamentos */}
        <Card className="p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-4">Status dos Agendamentos</h2>
          <StatusPieChart period={period} />
        </Card>
      </div>

      {/* Botões de Exportação */}
      <Card className="p-4 md:p-6">
        <h2 className="text-lg md:text-xl font-bold mb-4">Exportar Dados</h2>
        <p className="text-xs sm:text-sm text-gray-600 mb-4">
          Baixe os dados do período selecionado em formato CSV para análise externa
        </p>
        <div className="grid grid-cols-1 xs:grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
          <button
            className="px-3 md:px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            onClick={() => {
              window.open(
                `/api/analytics/export?type=bookings&period=${period}`,
                "_blank"
              );
            }}
          >
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Agendamentos</span>
          </button>
          <button
            className="px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            onClick={() => {
              window.open(
                `/api/analytics/export?type=revenue&period=${period}`,
                "_blank"
              );
            }}
          >
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Receita</span>
          </button>
          <button
            className="px-3 md:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            onClick={() => {
              window.open(
                `/api/analytics/export?type=services&period=${period}`,
                "_blank"
              );
            }}
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Serviços</span>
          </button>
          <button
            className="px-3 md:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm md:text-base"
            onClick={() => {
              window.open(
                `/api/analytics/export?type=complete&period=${period}`,
                "_blank"
              );
            }}
          >
            <TrendingUp className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">Relatório Completo</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
