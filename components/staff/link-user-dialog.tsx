"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { UserPlus, X, Mail, Lock, User } from "lucide-react";

interface LinkUserDialogProps {
  staffId: string;
  staffName: string;
  staffEmail?: string;
  hasUser: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function LinkUserDialog({
  staffId,
  staffName,
  staffEmail,
  hasUser,
  onClose,
  onSuccess,
}: LinkUserDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: staffEmail || "",
    password: "",
    confirmPassword: "",
    name: staffName,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (!formData.email || !formData.password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    if (formData.password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("As senhas não conferem");
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
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar conta");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm("Tem certeza que deseja desvincular esta conta?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/staff/link-user?staffId=${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao desvincular");
      }

      onSuccess();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Erro ao desvincular conta");
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
              {hasUser ? "Gerenciar Conta" : "Criar Conta de Acesso"}
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
          // Já tem usuário vinculado
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-success">
                ✓ Este profissional já possui uma conta de acesso ativa
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Profissional:</strong> {staffName}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {formData.email}
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Fechar
              </Button>
              <Button
                onClick={handleUnlink}
                variant="outline"
                className="flex-1 border-error/20 text-error hover:bg-error/10"
                disabled={loading}
              >
                {loading ? "Desvinculando..." : "Desvincular Conta"}
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de criação
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crie uma conta de acesso para que <strong>{staffName}</strong>{" "}
              possa fazer login no portal do profissional.
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
                  Email de Login
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@exemplo.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este será o email usado para fazer login
                </p>
              </div>

              {/* Senha */}
              <div>
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>

              {/* Confirmar Senha */}
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Digite a senha novamente"
                  required
                />
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
                {loading ? "Criando..." : "Criar Conta"}
              </Button>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
