"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Loader2 } from "lucide-react"

const COLORS = [
  "#8b5cf6", // purple
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#ec4899", // pink
  "#6366f1", // indigo
  "#14b8a6", // teal
]

const CATEGORIES_PT: Record<string, string> = {
  RENT: "Aluguel",
  UTILITIES: "Utilidades",
  PRODUCTS: "Produtos",
  SALARIES: "Salários",
  MARKETING: "Marketing",
  TAXES: "Impostos",
  MAINTENANCE: "Manutenção",
  OTHER: "Outros",
}

export function ExpensesPieChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/expenses")
        if (res.ok) {
          const expenses = await res.json()
          
          // Agrupar por categoria
          const categoryTotals: Record<string, number> = {}
          let totalAmount = 0

          expenses.forEach((expense: any) => {
            if (!categoryTotals[expense.category]) {
              categoryTotals[expense.category] = 0
            }
            categoryTotals[expense.category] += expense.amount
            totalAmount += expense.amount
          })

          // Converter para formato do gráfico
          const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
            name: CATEGORIES_PT[category] || category,
            value: amount,
            percentage: totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : 0,
          }))

          setData(chartData)
          setTotal(totalAmount)
        }
      } catch (error) {
        console.error("Erro ao buscar despesas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-foreground font-semibold">{payload[0].name}</p>
          <p className="text-primary font-bold">R$ {payload[0].value.toFixed(2)}</p>
          <p className="text-foreground-muted text-sm">{payload[0].payload.percentage}%</p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Despesas por Categoria</h3>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GlassCard>
    )
  }

  if (data.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">Despesas por Categoria</h3>
        <div className="flex items-center justify-center h-[300px] text-foreground-muted">
          Nenhuma despesa registrada
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">Despesas por Categoria</h3>
        <div className="text-right">
          <p className="text-sm text-foreground-muted">Total</p>
          <p className="text-xl font-bold text-foreground">R$ {total.toFixed(2)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name}: ${percentage}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-foreground-muted">{entry.name}</span>
            <span className="text-sm font-semibold text-foreground ml-auto">
              R$ {entry.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
