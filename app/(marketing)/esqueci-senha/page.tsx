"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { GridBackground } from "@/components/ui/grid-background";
import { Scissors, AlertCircle, ArrowLeft, Sparkles, Mail, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Erro ao processar solicitação");
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
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Esqueceu sua senha?
                </h1>
                <p className="text-foreground-muted">
                  Sem problemas! Digite seu email e enviaremos instruções para redefinir sua senha.
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
                  <Label htmlFor="email" className="text-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-background-alt border-border-hover focus:border-primary transition-colors"
                  />
                </div>

                <GradientButton
                  type="submit"
                  variant="primary"
                  className="w-full py-3"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Instruções"}
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
                Email Enviado!
              </h2>
              <p className="text-foreground-muted mb-6">
                Se existe uma conta com o email <strong className="text-foreground">{email}</strong>, 
                você receberá instruções para redefinir sua senha.
              </p>
              <p className="text-sm text-foreground-muted mb-8 p-4 bg-primary/5 rounded-lg border border-primary/20">
                ✉️ Verifique sua caixa de entrada e também a pasta de spam.
                O link expira em <strong>1 hora</strong>.
              </p>
              <Link href="/login">
                <GradientButton variant="primary" className="w-full">
                  Voltar para Login
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
