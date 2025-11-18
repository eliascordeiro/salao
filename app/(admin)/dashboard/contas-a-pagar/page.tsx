"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, DollarSign, Calendar, Edit, Trash2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";

type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  status: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
};

const CATEGORIES = {
  RENT: "Aluguel",
  UTILITIES: "Utilidades (água, luz, internet)",
  PRODUCTS: "Produtos",
  SALARIES: "Salários/Comissões",
  MARKETING: "Marketing",
  TAXES: "Impostos",
  MAINTENANCE: "Manutenção",
  OTHER: "Outros",
};

const STATUS_MAP = {
  PENDING: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300" },
  PAID: { label: "Pago", color: "bg-green-500/20 text-green-700 dark:text-green-300" },
  OVERDUE: { label: "Vencido", color: "bg-red-500/20 text-red-700 dark:text-red-300" },
};

export default function ContasAPagarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  useEffect(() => {
    fetchExpenses();
  }, [statusFilter, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (categoryFilter !== "ALL") params.append("category", categoryFilter);

      const response = await fetch(`/api/expenses?${params}`);
      const data = await response.json();

      if (data.success) {
        setExpenses(data.data);
      }
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta despesa?")) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      if (response.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Erro ao marcar como pago:", error);
    }
  };

  const filteredExpenses = expenses.filter((expense) =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = expenses
    .filter((e) => e.status === "PENDING")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPaid = expenses
    .filter((e) => e.status === "PAID")
    .reduce((sum, e) => sum + e.amount, 0);

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Contas a Pagar</h1>
          <p className="text-foreground-muted">Gerencie as despesas do seu salão</p>
        </div>
        <Button className="gap-2" onClick={() => router.push("/dashboard/contas-a-pagar/nova")}>
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">Pendente</span>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {totalPending.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">Pago</span>
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {totalPaid.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">Total</span>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {(totalPending + totalPaid).toFixed(2)}
          </p>
        </GlassCard>
      </div>

      {/* Filtros */}
      <GlassCard className="p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground-muted mb-2 block">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <Input
              placeholder="Descrição da despesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground-muted mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              Status
            </label>
            <select
              className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="OVERDUE">Vencido</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground-muted mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              Categoria
            </label>
            <select
              className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Todas</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Lista de Despesas */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-foreground-muted">Carregando despesas...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-foreground-muted mx-auto mb-3 opacity-50" />
            <p className="text-foreground-muted">Nenhuma despesa encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="glass-card p-4 hover:border-primary/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{expense.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_MAP[expense.status as keyof typeof STATUS_MAP].color}`}>
                        {STATUS_MAP[expense.status as keyof typeof STATUS_MAP].label}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted">
                      {CATEGORIES[expense.category as keyof typeof CATEGORIES]}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Venc: {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                      {expense.paidAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          Pago em: {new Date(expense.paidAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-2xl font-bold text-foreground">
                      R$ {expense.amount.toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      {expense.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => handleMarkAsPaid(expense.id)}
                        >
                          <Check className="h-3 w-3" />
                          Marcar Pago
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/contas-a-pagar/${expense.id}/editar`)}
                        title="Editar despesa"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(expense.id)}
                        title="Deletar despesa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {expense.notes && (
                  <div className="mt-3 pt-3 border-t border-foreground-muted/20">
                    <p className="text-sm text-foreground-muted italic">{expense.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
      </div>
    </>
  );
}
