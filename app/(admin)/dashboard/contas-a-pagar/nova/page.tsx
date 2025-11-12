"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

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

export default function NovaExpensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "OTHER",
    amount: "",
    dueDate: "",
    status: "PENDING",
    paymentMethod: "",
    notes: "",
    isRecurring: false,
    recurrence: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.dueDate) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/contas-a-pagar");
      } else {
        alert(data.error || "Erro ao criar despesa");
      }
    } catch (error) {
      console.error("Erro ao criar despesa:", error);
      alert("Erro ao criar despesa");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="outline"
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Nova Despesa</h1>
        <p className="text-foreground-muted">Cadastre uma nova conta a pagar</p>
      </div>

      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              placeholder="Ex: Aluguel de Novembro"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          {/* Categoria e Valor */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria *</Label>
              <select
                id="category"
                className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="amount">Valor (R$) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Data de Vencimento e Status */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="PENDING">Pendente</option>
                <option value="PAID">Pago</option>
                <option value="OVERDUE">Vencido</option>
              </select>
            </div>
          </div>

          {/* Método de Pagamento (se já pago) */}
          {formData.status === "PAID" && (
            <div>
              <Label htmlFor="paymentMethod">Método de Pagamento</Label>
              <select
                id="paymentMethod"
                className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="">Selecione...</option>
                <option value="CASH">Dinheiro</option>
                <option value="DEBIT">Cartão de Débito</option>
                <option value="CREDIT">Cartão de Crédito</option>
                <option value="PIX">PIX</option>
                <option value="BANK_TRANSFER">Transferência Bancária</option>
              </select>
            </div>
          )}

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              className="w-full min-h-[100px] rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3 py-2 text-sm resize-none"
              placeholder="Notas adicionais sobre esta despesa..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  recurrence: e.target.checked ? "MONTHLY" : ""
                })}
                className="h-4 w-4 rounded border-primary/20"
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                Esta é uma despesa recorrente
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="animate-fadeInUp">
                <Label htmlFor="recurrence" className="mb-2 block">
                  Frequência da Recorrência *
                </Label>
                <select
                  id="recurrence"
                  className="w-full h-10 rounded-md border glass-card bg-background-alt/50 border-primary/20 px-3"
                  value={formData.recurrence}
                  onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
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
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? "Salvando..." : "Salvar Despesa"}
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
