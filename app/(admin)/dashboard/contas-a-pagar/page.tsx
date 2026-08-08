"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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

const CATEGORY_KEYS = [
  "RENT",
  "UTILITIES",
  "PRODUCTS",
  "SALARIES",
  "MARKETING",
  "TAXES",
  "MAINTENANCE",
  "OTHER",
] as const;

const STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
  PAID: "bg-green-500/20 text-green-700 dark:text-green-300",
  OVERDUE: "bg-red-500/20 text-red-700 dark:text-red-300",
};

export default function ContasAPagarPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
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
    if (!confirm(t("deleteConfirm"))) return;

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
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{t("title")}</h1>
          <p className="text-sm sm:text-base text-foreground-muted">{t("subtitle")}</p>
        </div>
        <Button className="gap-2 w-full sm:w-auto min-h-[44px]" onClick={() => router.push("/dashboard/contas-a-pagar/nova")}>
          <Plus className="h-4 w-4" />
          {t("newExpense")}
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">{t("pendingLabel")}</span>
            <DollarSign className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {totalPending.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">{t("paidLabel")}</span>
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">
            R$ {totalPaid.toFixed(2)}
          </p>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground-muted">{t("totalLabel")}</span>
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
              {t("searchLabel")}
            </label>
            <Input
              placeholder={t("searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground-muted mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              {t("statusLabel")}
            </label>
            <select
              className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">{tCommon("all")}</option>
              <option value="PENDING">{tStatus("PENDING")}</option>
              <option value="PAID">{tStatus("PAID")}</option>
              <option value="OVERDUE">{tStatus("OVERDUE")}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground-muted mb-2 block">
              <Filter className="h-4 w-4 inline mr-1" />
              {t("categoryLabel")}
            </label>
            <select
              className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">{t("allCategories")}</option>
              {CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>{t(`categories.${key}`)}</option>
              ))}
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Lista de Despesas */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-foreground-muted">{t("loadingExpenses")}</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-foreground-muted mx-auto mb-3 opacity-50" />
            <p className="text-foreground-muted">{t("noExpensesFound")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="glass-card p-4 hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-base sm:text-lg">{expense.description}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS]}`}>
                        {tStatus(expense.status as "PENDING")}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted">
                      {t(`categories.${expense.category}`)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t("dueLabel")}: {new Date(expense.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                      {expense.paidAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Check className="h-3 w-3" />
                          {t("paidOnLabel")}: {new Date(expense.paidAt).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      R$ {expense.amount.toFixed(2)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {expense.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 min-h-[40px]"
                          onClick={() => handleMarkAsPaid(expense.id)}
                        >
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm">{t("markPaid")}</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/dashboard/contas-a-pagar/${expense.id}/editar`)}
                        title={t("editExpenseTitle")}
                        className="min-h-[40px] min-w-[40px]"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 min-h-[40px] min-w-[40px]"
                        onClick={() => handleDelete(expense.id)}
                        title={t("deleteExpenseTitle")}
                      >
                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
