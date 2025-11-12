"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

interface ExpenseEditPageProps {
  params: {
    id: string
  }
}

const CATEGORIES = [
  { value: "RENT", label: "Aluguel" },
  { value: "UTILITIES", label: "Utilidades (água, luz, internet)" },
  { value: "PRODUCTS", label: "Produtos" },
  { value: "SALARIES", label: "Salários" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TAXES", label: "Impostos" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OTHER", label: "Outros" },
]

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "OVERDUE", label: "Atrasado" },
]

const PAYMENT_METHODS = [
  { value: "CASH", label: "Dinheiro" },
  { value: "DEBIT", label: "Cartão de Débito" },
  { value: "CREDIT", label: "Cartão de Crédito" },
  { value: "PIX", label: "PIX" },
  { value: "BANK_TRANSFER", label: "Transferência Bancária" },
]

export default function EditExpensePage({ params }: ExpenseEditPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    category: "RENT",
    amount: "",
    dueDate: "",
    status: "PENDING",
    paymentMethod: "",
    notes: "",
    isRecurring: false,
    recurrence: "",
  })

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const res = await fetch(`/api/expenses/${params.id}`)
        if (res.ok) {
          const expense = await res.json()
          setFormData({
            description: expense.description,
            category: expense.category,
            amount: expense.amount.toString(),
            dueDate: new Date(expense.dueDate).toISOString().split("T")[0],
            status: expense.status,
            paymentMethod: expense.paymentMethod || "",
            notes: expense.notes || "",
            isRecurring: expense.isRecurring || false,
            recurrence: expense.recurrence || "",
          })
        } else {
          alert("Erro ao carregar despesa")
          router.push("/dashboard/contas-a-pagar")
        }
      } catch (error) {
        console.error("Erro ao buscar despesa:", error)
        alert("Erro ao carregar despesa")
        router.push("/dashboard/contas-a-pagar")
      } finally {
        setLoading(false)
      }
    }

    fetchExpense()
  }, [params.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload: any = {
        description: formData.description,
        category: formData.category,
        amount: parseFloat(formData.amount),
        dueDate: new Date(formData.dueDate).toISOString(),
        status: formData.status,
        notes: formData.notes || null,
      }

      if (formData.status === "PAID") {
        if (!formData.paymentMethod) {
          alert("Método de pagamento é obrigatório para despesas pagas")
          setSaving(false)
          return
        }
        payload.paymentMethod = formData.paymentMethod
      }

      const res = await fetch(`/api/expenses/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        alert("Despesa atualizada com sucesso!")
        router.push("/dashboard/contas-a-pagar")
      } else {
        const error = await res.json()
        alert(`Erro: ${error.error || "Não foi possível atualizar a despesa"}`)
      }
    } catch (error) {
      console.error("Erro ao atualizar despesa:", error)
      alert("Erro ao atualizar despesa")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard/contas-a-pagar"
            className="inline-flex items-center gap-2 text-foreground-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Contas a Pagar
          </Link>
        </div>

        <GlassCard className="max-w-2xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-foreground mb-6">Editar Despesa</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Descrição */}
            <div>
              <Label htmlFor="description" className="text-foreground mb-2 block">
                Descrição *
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                required
                placeholder="Ex: Aluguel - Novembro 2024"
              />
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="category" className="text-foreground mb-2 block">
                Categoria *
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="amount" className="text-foreground mb-2 block">
                Valor (R$) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <Label htmlFor="dueDate" className="text-foreground mb-2 block">
                Data de Vencimento *
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status" className="text-foreground mb-2 block">
                Status *
              </Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Método de Pagamento (condicional) */}
            {formData.status === "PAID" && (
              <div className="animate-fadeInUp">
                <Label htmlFor="paymentMethod" className="text-foreground mb-2 block">
                  Método de Pagamento *
                </Label>
                <select
                  id="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentMethod: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  required
                >
                  <option value="">Selecione...</option>
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notas */}
            <div>
              <Label htmlFor="notes" className="text-foreground mb-2 block">
                Notas/Observações
              </Label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
                placeholder="Observações adicionais (opcional)"
              />
            </div>

            {/* Despesa Recorrente */}
            <div className="glass-card p-4 border border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    isRecurring: e.target.checked,
                    recurrence: e.target.checked ? (formData.recurrence || "MONTHLY") : ""
                  })}
                  className="h-4 w-4 rounded border-primary/20"
                />
                <Label htmlFor="isRecurring" className="cursor-pointer text-foreground">
                  Esta é uma despesa recorrente
                </Label>
              </div>

              {formData.isRecurring && (
                <div className="animate-fadeInUp">
                  <Label htmlFor="recurrence" className="text-foreground mb-2 block">
                    Frequência da Recorrência *
                  </Label>
                  <select
                    id="recurrence"
                    value={formData.recurrence}
                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-background-alt/50 border border-primary/20 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    required={formData.isRecurring}
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                  <p className="text-xs text-foreground-muted mt-2">
                    💡 Despesas recorrentes serão criadas automaticamente no próximo período
                  </p>
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/contas-a-pagar")}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  )
}
