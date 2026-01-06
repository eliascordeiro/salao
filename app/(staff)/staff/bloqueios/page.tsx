"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Calendar, Clock, AlertCircle, CheckCircle2, Info, Plus, Trash2, X } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Block {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  recurring: boolean;
}

interface StaffData {
  canManageBlocks: boolean;
}

export default function BloqueiosPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    reason: "",
    recurring: false,
  });

  // Buscar permissão e bloqueios
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Buscar perfil do staff
        const profileRes = await fetch("/api/staff/profile");
        if (profileRes.ok) {
          const profile: StaffData = await profileRes.json();
          setCanManage(profile.canManageBlocks || false);
        }

        // Buscar bloqueios
        const blocksRes = await fetch("/api/staff/my-blocks");
        if (blocksRes.ok) {
          const data = await blocksRes.json();
          setBlocks(data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchData();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;

    setError("");
    setSuccess("");

    // Validações
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError("Preencha data, horário inicial e final");
      return;
    }

    if (formData.startTime >= formData.endTime) {
      setError("Horário final deve ser posterior ao inicial");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/staff/my-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao criar bloqueio");
      }

      const newBlock = await response.json();
      setBlocks((prev) => [...prev, newBlock]);
      setFormData({ date: "", startTime: "", endTime: "", reason: "", recurring: false });
      setShowForm(false);
      setSuccess("Bloqueio criado com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (blockId: string) => {
    if (!canManage) return;
    if (!confirm("Deseja remover este bloqueio?")) return;

    try {
      const response = await fetch(`/api/staff/my-blocks/${blockId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erro ao remover bloqueio");
      }

      setBlocks((prev) => prev.filter((b) => b.id !== blockId));
      setSuccess("Bloqueio removido com sucesso!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted/20 rounded w-1/3"></div>
            <div className="h-40 bg-muted/20 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Bloqueios de Horários</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie datas e horários indisponíveis
          </p>
        </div>

        {/* Alertas */}
        {!canManage && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-start gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">Apenas Visualização</p>
              <p className="text-xs text-muted-foreground">
                Seus bloqueios são gerenciados pelo administrador. Entre em contato caso precise criar ou remover bloqueios.
              </p>
            </div>
          </div>
        )}

        {canManage && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium mb-1">Gerenciamento Habilitado</p>
              <p className="text-xs text-muted-foreground">
                Você pode criar e remover bloqueios de horários indisponíveis.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-error/10 border border-error/20 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-error flex-shrink-0 mt-0.5" />
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <p className="text-sm text-success">{success}</p>
          </div>
        )}

        {/* Botão Adicionar */}
        {canManage && !showForm && (
          <GradientButton
            onClick={() => setShowForm(true)}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Adicionar Bloqueio
          </GradientButton>
        )}

        {/* Formulário */}
        {showForm && canManage && (
          <GlassCard glow="primary" className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Bloqueio</h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Horário Inicial</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">Horário Final</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ex: Consulta médica, Compromisso pessoal"
                  className="min-h-[44px]"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.recurring}
                  onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
                  className="w-5 h-5 rounded border-primary text-primary"
                />
                <span className="text-sm">Bloqueio recorrente (todas as semanas)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <GradientButton
                  type="button"
                  variant="accent"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </GradientButton>
                <GradientButton
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Salvando..." : "Salvar"}
                </GradientButton>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Lista de Bloqueios */}
        <GlassCard hover className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Bloqueios Cadastrados
          </h3>

          {blocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhum bloqueio cadastrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-background-alt/30 border border-primary/10 hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm sm:text-base font-medium text-foreground">
                        {new Date(block.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>
                        {block.startTime} às {block.endTime}
                      </span>
                    </div>
                    {block.reason && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{block.reason}</p>
                    )}
                    {block.recurring && (
                      <span className="inline-block mt-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        Recorrente
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="ml-3 p-2 hover:bg-error/10 rounded-lg transition-colors text-error flex-shrink-0"
                      title="Remover bloqueio"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
