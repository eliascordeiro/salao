"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard/header";
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
  AlertCircle,
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
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6m");
  const [data, setData] = useState<any>(null);
  const [pendingRevenue, setPendingRevenue] = useState<any>(null);

  useEffect(() => {
    loadFinancialData();
    loadPendingRevenue();
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

  async function loadPendingRevenue() {
    try {
      const response = await fetch("/api/cashier/pending-revenue");
      const result = await response.json();

      if (result.success) {
        setPendingRevenue(result.data);
      }
    } catch (error) {
      console.error("Erro ao carregar receita pendente:", error);
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
    <>
      {/* Dashboard Header */}
      {session?.user && (
        <DashboardHeader
          user={{
            name: session.user.name,
            email: session.user.email,
            role: session.user.role,
          }}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Análise Financeira
              </h1>
              <p className="text-sm sm:text-base text-foreground-muted">
                Relatórios avançados de receita, despesas e lucro
              </p>
            </div>

          {/* Seletor de Período */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {PERIODS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value)}
                className="flex-1 sm:flex-initial min-w-[90px] min-h-[40px]"
              >
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">{p.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerta de Receita Pendente */}
      {pendingRevenue && pendingRevenue.sessionCount > 0 && (
        <GlassCard className="p-4 sm:p-6 mb-8 border-l-4 border-yellow-500">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1">
                Receita Pendente
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted mb-3">
                Você tem agendamentos completados aguardando pagamento no caixa
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-4">
                <div>
                  <p className="text-xs sm:text-sm text-foreground-muted">Valor Total</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-500">
                    R$ {pendingRevenue.totalPending.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-foreground-muted">Sessões Abertas</p>
                  <p className="text-xl sm:text-2xl font-semibold text-foreground">
                    {pendingRevenue.sessionCount}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => router.push("/dashboard/caixa")}
                className="bg-yellow-500 hover:bg-yellow-600 text-white w-full sm:w-auto min-h-[44px]"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                <span className="text-sm sm:text-base">Ir para o Caixa</span>
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {/* Receita Total */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-foreground-muted mb-1">Receita Total</p>
              <p className="text-xl sm:text-2xl font-bold text-green-500">
                R$ {summary.totalRevenue.toFixed(2)}
              </p>
              {trends.revenue !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {trends.revenue > 0 ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  )}
                  <span className={`text-xs sm:text-sm ${trends.revenue > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(trends.revenue).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
            </div>
          </div>
        </GlassCard>

        {/* Despesas Totais */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-foreground-muted mb-1">Despesas Totais</p>
              <p className="text-xl sm:text-2xl font-bold text-red-500">
                R$ {summary.totalExpenses.toFixed(2)}
              </p>
              <p className="text-[10px] sm:text-xs text-foreground-muted mt-2">
                Média mensal: R$ {summary.avgMonthlyExpenses.toFixed(2)}
              </p>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
            </div>
          </div>
        </GlassCard>

        {/* Lucro Líquido */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-foreground-muted mb-1">Lucro Líquido</p>
              <p className={`text-xl sm:text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                R$ {summary.netProfit.toFixed(2)}
              </p>
              {trends.profit !== 0 && (
                <div className="flex items-center gap-1 mt-2">
                  {trends.profit > 0 ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  )}
                  <span className={`text-xs sm:text-sm ${trends.profit > 0 ? "text-green-500" : "text-red-500"}`}>
                    {Math.abs(trends.profit).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </GlassCard>

        {/* Margem de Lucro */}
        <GlassCard className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-foreground-muted mb-1">Margem de Lucro</p>
              <p className="text-xl sm:text-2xl font-bold text-primary">
                {summary.profitMargin.toFixed(1)}%
              </p>
              <Badge 
                variant={summary.profitMargin >= 20 ? "default" : "secondary"}
                className="mt-2 text-[10px] sm:text-xs"
              >
                {summary.profitMargin >= 20 ? "Excelente" : summary.profitMargin >= 10 ? "Bom" : "Atenção"}
              </Badge>
            </div>
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Evolução Mensal */}
        <GlassCard className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Evolução Mensal</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyEvolution}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
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
        <GlassCard className="p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="text-sm sm:text-base">Despesas por Categoria</span>
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${((entry.value / summary.totalExpenses) * 100).toFixed(0)}%`}
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
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Tabela de Top Categorias */}
      <GlassCard className="p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-4">Top Categorias de Despesa</h3>
        <div className="space-y-3">
          {expensesByCategory.map((item: any, index: number) => {
            const percentage = (item.total / summary.totalExpenses) * 100;
            return (
              <div key={item.category} className="flex items-center gap-2 sm:gap-4">
                <div 
                  className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] + "20", color: COLORS[index % COLORS.length] }}
                >
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{CATEGORY_LABELS[item.category] || item.category}</p>
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
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm sm:text-base">R$ {item.total.toFixed(2)}</p>
                  <p className="text-[10px] sm:text-xs text-foreground-muted">{percentage.toFixed(1)}%</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
      </div>
    </>
  );
}
