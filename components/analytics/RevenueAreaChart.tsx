"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RevenueData {
  date: string;
  label: string;
  fullLabel: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  completedRevenue: number;
  pendingRevenue: number;
  averageTicket: number;
}

interface RevenueAreaChartProps {
  days?: number;
  groupBy?: "day" | "week" | "month";
}

export function RevenueAreaChart({
  days = 30,
  groupBy = "day",
}: RevenueAreaChartProps) {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/analytics/revenue-by-period?days=${days}&groupBy=${groupBy}`
        );

        if (!response.ok) {
          throw new Error("Erro ao carregar dados");
        }

        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days, groupBy]);

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-gray-500">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis
          tickFormatter={(value) =>
            `R$ ${value.toLocaleString("pt-BR", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`
          }
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload as RevenueData;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                  <p className="font-semibold mb-2">{item.fullLabel}</p>
                  <p className="text-sm text-gray-600">
                    Agendamentos:{" "}
                    <span className="font-medium">{item.totalBookings}</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Concluídos:{" "}
                    <span className="font-medium">{item.completedBookings}</span>
                  </p>
                  <hr className="my-2" />
                  <p className="text-sm text-green-700 font-medium">
                    Receita Concluída: R${" "}
                    {item.completedRevenue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-yellow-600">
                    Receita Pendente: R${" "}
                    {item.pendingRevenue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-800 font-semibold mt-2 pt-2 border-t">
                    Total: R${" "}
                    {item.totalRevenue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Ticket Médio: R${" "}
                    {item.averageTicket.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="completedRevenue"
          stackId="1"
          stroke="#10b981"
          fill="#10b981"
          name="Receita Concluída"
        />
        <Area
          type="monotone"
          dataKey="pendingRevenue"
          stackId="1"
          stroke="#fbbf24"
          fill="#fbbf24"
          name="Receita Pendente"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
