"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { UserPlus, X, Mail, Phone, User, Info } from "lucide-react";

interface LinkUserDialogProps {
  staffId: string;
  staffName: string;
  staffEmail?: string;
  staffPhone?: string;
  hasUser: boolean;
  userActive?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkUserDialog({
  staffId,
  staffName,
  staffEmail,
  staffPhone,
  hasUser,
  userActive,
  onClose,
  onSuccess,
}: LinkUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: staffEmail || "",
    phone: staffPhone || "",
    name: staffName,
    isActive: userActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email) {
      setError("Email é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/staff/link-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          email: formData.email,
          phone: formData.phone,
          name: formData.name,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao configurar acesso");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao configurar acesso");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/staff/link-user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          staffId,
          isActive: formData.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar acesso");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao atualizar acesso");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Tem certeza que deseja remover o acesso ao portal? O profissional não conseguirá mais fazer login.")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/staff/link-user?staffId=${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover acesso");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao remover acesso");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <GlassCard className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <UserPlus className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">
              {hasUser ? "Gerenciar Acesso ao Portal" : "Configurar Acesso ao Portal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-alt/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {hasUser ? (
          // Já tem usuário vinculado - Modo edição
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${
              formData.isActive 
                ? "bg-success/10 border-success/20" 
                : "bg-warning/10 border-warning/20"
            }`}>
              <p className={`text-sm ${formData.isActive ? "text-success" : "text-warning"}`}>
                {formData.isActive ? "✓ Acesso ativo" : "⚠ Acesso desativado"}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Profissional</p>
                <p className="text-sm font-medium">{staffName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email de Login</p>
                <p className="text-sm font-medium">{formData.email}</p>
              </div>
              {formData.phone && (
                <div>
                  <p className="text-xs text-muted-foreground">Celular</p>
                  <p className="text-sm font-medium">{formData.phone}</p>
                </div>
              )}
            </div>

            {/* Toggle Ativo/Inativo */}
            <div className="p-4 rounded-lg bg-background-alt/30 border border-primary/10">
              <Label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-medium">Status do Acesso</span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.isActive ? "bg-success" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </Label>
              <p className="text-xs text-muted-foreground mt-2">
                {formData.isActive 
                  ? "Profissional pode fazer login no portal" 
                  : "Profissional não consegue fazer login"}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Info sobre recuperação de senha */}
            <div className="p-3 rounded-lg bg-info/10 border border-info/20 flex gap-2">
              <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-info">
                O profissional pode definir/alterar sua senha usando a opção 
                "Esqueci minha senha" na tela de login.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Fechar
              </Button>
              {formData.isActive !== userActive && (
                <Button
                  onClick={handleUpdate}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              )}
              <Button
                onClick={handleUnlink}
                variant="outline"
                className="flex-1 border-error/20 text-error hover:bg-error/10"
                disabled={loading}
              >
                Remover Acesso
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de criação
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Configure o acesso ao portal para <strong>{staffName}</strong>.
              Após ativar, o profissional poderá fazer login e definir sua própria senha.
            </p>

            {error && (
              <div className="p-3 rounded-lg bg-error/10 border border-error/20">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Nome */}
              <div>
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome Completo
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Nome do profissional"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email para Login
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será usado para fazer login no portal
                </p>
              </div>

              {/* Celular */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Celular (opcional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Status Inicial */}
              <div className="p-4 rounded-lg bg-background-alt/30 border border-primary/10">
                <Label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium">Ativar Acesso</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isActive ? "bg-success" : "bg-gray-400"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isActive ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  {formData.isActive 
                    ? "Profissional poderá fazer login após configuração" 
                    : "Acesso será criado mas ficará desativado"}
                </p>
              </div>
            </div>

            {/* Info sobre senha */}
            <div className="p-3 rounded-lg bg-info/10 border border-info/20 flex gap-2">
              <Info className="h-4 w-4 text-info flex-shrink-0 mt-0.5" />
              <div className="text-xs text-info space-y-1">
                <p className="font-medium">Como o profissional define a senha?</p>
                <p>
                  Após ativar o acesso, o profissional deve acessar a tela de login 
                  e clicar em "Esqueci minha senha" para criar sua própria senha.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "Configurando..." : "Configurar Acesso"}
              </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
