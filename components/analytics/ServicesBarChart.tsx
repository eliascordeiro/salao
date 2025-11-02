"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ServiceData {
  serviceId: string;
  name: string;
  category: string | null;
  price: number;
  duration: number;
  bookings: number;
  revenue: number;
  percentage: number;
  revenuePercentage: number;
}

interface ServicesBarChartProps {
  days?: number;
  limit?: number;
}

export function ServicesBarChart({ days = 30, limit = 10 }: ServicesBarChartProps) {
  const [data, setData] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/analytics/popular-services?days=${days}&limit=${limit}`
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
  }, [days, limit]);

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
      <BarChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={80}
          interval={0}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const service = payload[0].payload as ServiceData;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                  <p className="font-semibold mb-2">{service.name}</p>
                  {service.category && (
                    <p className="text-sm text-gray-500 mb-2">
                      {service.category}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Agendamentos:{" "}
                    <span className="font-medium">{service.bookings}</span> (
                    {service.percentage.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-green-600">
                    Receita: R${" "}
                    <span className="font-medium">
                      {service.revenue.toFixed(2)}
                    </span>{" "}
                    ({service.revenuePercentage.toFixed(1)}%)
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Preço: R$ {service.price.toFixed(2)} | {service.duration}{" "}
                    min
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Bar dataKey="bookings" fill="#8884d8" name="Agendamentos" />
      </BarChart>
    </ResponsiveContainer>
  );
}
