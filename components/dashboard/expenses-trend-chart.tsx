"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Loader2 } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

export function ExpensesTrendChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        // Últimos 6 meses
        const endDate = new Date()
        const startDate = subMonths(endDate, 5)

        const res = await fetch(
          `/api/expenses?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        
        if (res.ok) {
          const expenses = await res.json()

          // Gerar array com todos os meses do período
          const months = eachMonthOfInterval({ start: startDate, end: endDate })

          // Agrupar despesas por mês
          const monthlyData = months.map((month) => {
            const monthStart = startOfMonth(month)
            const monthEnd = endOfMonth(month)

            const monthExpenses = expenses.filter((expense: any) => {
              const expenseDate = new Date(expense.dueDate)
              return expenseDate >= monthStart && expenseDate <= monthEnd
            })

            const total = monthExpenses.reduce(
              (sum: number, expense: any) => sum + expense.amount,
              0
            )

            const paid = monthExpenses
              .filter((e: any) => e.status === "PAID")
              .reduce((sum: number, expense: any) => sum + expense.amount, 0)

            const pending = monthExpenses
              .filter((e: any) => e.status === "PENDING")
              .reduce((sum: number, expense: any) => sum + expense.amount, 0)

            return {
              month: format(month, "MMM/yy", { locale: ptBR }),
              total,
              paid,
              pending,
            }
          })

          setData(monthlyData)
        }
      } catch (error) {
        console.error("Erro ao buscar despesas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchExpenses()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3">
          <p className="text-foreground font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: R$ {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          Evolução de Despesas (Últimos 6 Meses)
        </h3>
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </GlassCard>
    )
  }

  if (data.length === 0) {
    return (
      <GlassCard className="p-6">
        <h3 className="text-lg font-bold text-foreground mb-4">
          Evolução de Despesas (Últimos 6 Meses)
        </h3>
        <div className="flex items-center justify-center h-[300px] text-foreground-muted">
          Nenhuma despesa registrada
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-6">
      <h3 className="text-lg font-bold text-foreground mb-4">
        Evolução de Despesas (Últimos 6 Meses)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="month"
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
            style={{ fontSize: "12px" }}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: "#9ca3af" }}
            style={{ fontSize: "12px" }}
            tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Total"
            dot={{ fill: "#8b5cf6", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="paid"
            stroke="#10b981"
            strokeWidth={2}
            name="Pago"
            dot={{ fill: "#10b981", r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="pending"
            stroke="#f59e0b"
            strokeWidth={2}
            name="Pendente"
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
