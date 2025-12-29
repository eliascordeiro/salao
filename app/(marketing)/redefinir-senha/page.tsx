"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Scissors, AlertCircle, ArrowLeft, Sparkles, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Token inválido. Solicite uma nova redefinição de senha.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setError(data.error || "Erro ao redefinir senha");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao processar solicitação. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      <GridBackground className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      </GridBackground>

      <div className="w-full max-w-md relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Scissors className="h-10 w-10 text-primary group-hover:rotate-12 transition-transform" />
              <Sparkles className="h-4 w-4 text-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-3xl font-bold text-foreground">AgendaSalão</span>
          </Link>
        </div>

        {/* Card */}
        <GlassCard glow="primary" className="p-8">
          {!success ? (
            <>
              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Redefinir Senha
                </h1>
                <p className="text-foreground-muted">
                  Crie uma nova senha forte para sua conta
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="glass-card border-destructive/50 bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading || !token}
                      className="bg-background-alt border-border-hover focus:border-primary transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-foreground-muted">Mínimo de 6 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isLoading || !token}
                      className="bg-background-alt border-border-hover focus:border-primary transition-colors pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <GradientButton
                  type="submit"
                  variant="primary"
                  className="w-full py-3"
                  disabled={isLoading || !token}
                >
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </GradientButton>

                <div className="text-sm text-center text-foreground-muted pt-4 border-t border-border">
                  Lembrou sua senha?{" "}
                  <Link href="/login" className="text-primary hover:text-accent font-medium transition-colors">
                    Fazer login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                Senha Redefinida!
              </h2>
              <p className="text-foreground-muted mb-8">
                Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em alguns segundos...
              </p>
              <Link href="/login">
                <GradientButton variant="primary" className="w-full">
                  Ir para Login Agora
                </GradientButton>
              </Link>
            </div>
          )}
        </GlassCard>

        {/* Link para Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-foreground-muted hover:text-primary transition-colors inline-flex items-center gap-2 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
