"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface StatusData {
  status: string;
  count: number;
  percentage: number;
}

interface StatusPieChartProps {
  period?: string;
}

const COLORS = {
  PENDING: "#fbbf24",
  CONFIRMED: "#3b82f6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
  NO_SHOW: "#6b7280",
};

const STATUS_LABELS = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  NO_SHOW: "Não Compareceu",
};

export function StatusPieChart({ period = "30d" }: StatusPieChartProps) {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/analytics/stats?period=${period}`);

        if (!response.ok) {
          throw new Error("Erro ao carregar dados");
        }

        const result = await response.json();

        // Transformar dados para o gráfico
        const chartData = Object.entries(result.bookingsByStatus).map(
          ([status, count]) => ({
            status,
            name: STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status,
            count: count as number,
            percentage:
              result.summary.totalBookings > 0
                ? ((count as number) / result.summary.totalBookings) * 100
                : 0,
          })
        );

        setData(chartData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

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
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry: any) =>
            `${entry.name}: ${entry.percentage.toFixed(1)}%`
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.status as keyof typeof COLORS] || "#999999"}
            />
          ))}
        </Pie>
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const item = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                  <p className="font-semibold mb-1">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    Quantidade: <span className="font-medium">{item.count}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Percentual:{" "}
                    <span className="font-medium">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
