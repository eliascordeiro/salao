"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Briefcase, Lock, Mail } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridBackground } from "@/components/ui/grid-background";
import Link from "next/link";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos");
        setLoading(false);
        return;
      }

      // Verificar se é profissional
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.roleType === "STAFF" || session?.user?.role === "STAFF") {
        router.push("/staff/dashboard");
      } else {
        setError("Acesso negado. Esta área é exclusiva para profissionais.");
        await signIn("credentials", { redirect: false }); // Logout
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        <div className="flex min-h-screen items-center justify-center p-4">
          <GlassCard className="w-full max-w-md p-8" glow="primary">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                Área do Profissional
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                Acesse seu painel para gerenciar agenda e comissões
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <GradientButton
                type="submit"
                className="w-full"
                disabled={loading}
                variant="primary"
              >
                {loading ? "Entrando..." : "Entrar"}
              </GradientButton>
            </form>

            <div className="mt-6 text-center text-sm text-foreground-muted">
              <p>
                Não tem acesso?{" "}
                <Link href="/contato" className="text-primary hover:underline">
                  Entre em contato com o salão
                </Link>
              </p>
              <p className="mt-2">
                <Link href="/" className="text-primary hover:underline">
                  Voltar para página inicial
                </Link>
              </p>
            </div>
          </GlassCard>
        </div>
      </GridBackground>
    </div>
  );
}
