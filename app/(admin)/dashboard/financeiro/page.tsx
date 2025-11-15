"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PERIODS = [
  { value: "3m", label: "3 meses" },
  { value: "6m", label: "6 meses" },
  { value: "12m", label: "12 meses" },
];

const CATEGORY_LABELS: Record<string, string> = {
  RENT: "Aluguel",
  UTILITIES: "Utilidades",
  PRODUCTS: "Produtos",
  SALARIES: "Salários",
  MARKETING: "Marketing",
  TAXES: "Impostos",
  MAINTENANCE: "Manutenção",
  OTHER: "Outros",
};

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#6366f1", "#84cc16"];

export default function FinanceiroPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  async function loadFinancialData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/financial?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar dados financeiros:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const {
    summary,
    trends,
    expensesByCategory,
    monthlyEvolution,
  } = data;

  // Preparar dados para gráfico de pizza
  const pieData = expensesByCategory.map((item: any, index: number) => ({
    name: CATEGORY_LABELS[item.category] || item.category,
    value: item.total,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Análise Financeira
            </h1>
            <p className="text-foreground-muted">
              Relatórios avançados de receita, despesas e lucro
            </p>
          </div>

          {/* Seletor de Período */}
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Receita Total */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground-muted mb-1">Receita Total</p>
              <p className="text-2xl font-bold text-green-500">
                R$ {summary.totalRevenue.toFixed(2)}
              </p>
              {trends.revenue !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {trends.revenue > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${trends.revenue > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(trends.revenue).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </GlassCard>

        {/* Despesas Totais */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground-muted mb-1">Despesas Totais</p>
              <p className="text-2xl font-bold text-red-500">
                R$ {summary.totalExpenses.toFixed(2)}
              </p>
              <p className="text-xs text-foreground-muted mt-2">
                Média mensal: R$ {summary.avgMonthlyExpenses.toFixed(2)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </GlassCard>

        {/* Lucro Líquido */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground-muted mb-1">Lucro Líquido</p>
              <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                R$ {summary.netProfit.toFixed(2)}
              </p>
              {trends.profit !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {trends.profit > 0 ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-sm ${trends.profit > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(trends.profit).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GlassCard>

        {/* Margem de Lucro */}
        <GlassCard className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-foreground-muted mb-1">Margem de Lucro</p>
              <p className="text-2xl font-bold text-primary">
                {summary.profitMargin.toFixed(1)}%
              </p>
              <Badge 
                variant={summary.profitMargin >= 20 ? "default" : "secondary"}
                className="mt-2"
              >
                {summary.profitMargin >= 20 ? "Excelente" : summary.profitMargin >= 10 ? "Bom" : "Atenção"}
              </Badge>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Evolução Mensal */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Evolução Mensal
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Receita"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Despesas"
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                name="Lucro"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Despesas por Categoria */}
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Despesas por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${((entry.value / summary.totalExpenses) * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Tabela de Top Categorias */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Categorias de Despesa</h3>
        <div className="space-y-3">
          {expensesByCategory.map((item: any, index: number) => {
            const percentage = (item.total / summary.totalExpenses) * 100;
            return (
              <div key={item.category} className="flex items-center gap-4">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center font-bold"
                  style={{ backgroundColor: COLORS[index % COLORS.length] + "20", color: COLORS[index % COLORS.length] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{CATEGORY_LABELS[item.category] || item.category}</p>
                  <div className="w-full bg-background-alt/50 rounded-full h-2 mt-1">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {item.total.toFixed(2)}</p>
                  <p className="text-xs text-foreground-muted">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
}
