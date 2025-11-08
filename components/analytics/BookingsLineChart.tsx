"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BookingsData {
  date: string;
  label: string;
  fullDate: string;
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  confirmed: number;
  revenue: number;
}

interface BookingsLineChartProps {
  days?: number;
}

export function BookingsLineChart({ days = 30 }: BookingsLineChartProps) {
  const [data, setData] = useState<BookingsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(
          `/api/analytics/bookings-over-time?days=${days}`
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
  }, [days]);

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
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
                  <p className="font-semibold mb-2">{data.fullDate}</p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-medium">{data.total}</span>
                  </p>
                  <p className="text-sm text-green-600">
                    Concluídos:{" "}
                    <span className="font-medium">{data.completed}</span>
                  </p>
                  <p className="text-sm text-blue-600">
                    Confirmados:{" "}
                    <span className="font-medium">{data.confirmed}</span>
                  </p>
                  <p className="text-sm text-yellow-600">
                    Pendentes:{" "}
                    <span className="font-medium">{data.pending}</span>
                  </p>
                  <p className="text-sm text-red-600">
                    Cancelados:{" "}
                    <span className="font-medium">{data.cancelled}</span>
                  </p>
                  <p className="text-sm text-gray-800 mt-2 pt-2 border-t">
                    Receita: R${" "}
                    <span className="font-medium">
                      {data.revenue.toFixed(2)}
                    </span>
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="total"
          stroke="#8884d8"
          name="Total"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#82ca9d"
          name="Concluídos"
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="cancelled"
          stroke="#ff6b6b"
          name="Cancelados"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
