"use client";

import { Suspense, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Briefcase, Lock, Mail } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GridBackground } from "@/components/ui/grid-background";
import Link from "next/link";

export default function StaffLoginPage() {
  return (
    <Suspense fallback={null}>
      <StaffLoginContent />
    </Suspense>
  );
}

function StaffLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("staffLogin");
  const tAuth = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tenantHint = useMemo(() => {
    const salonId = searchParams.get("salonId");
    const salonSlug = searchParams.get("salonSlug");

    if (salonSlug) {
      return { label: salonSlug, salonId }
    }

    if (salonId) {
      return { label: salonId.slice(0, 8), salonId }
    }

    return null
  }, [searchParams])

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
        setError(t("invalidCredentials"));
        setLoading(false);
        return;
      }

      // Verificar se é profissional
      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.roleType === "STAFF" || session?.user?.role === "STAFF") {
        const callbackUrl = tenantHint?.salonId
          ? `/staff/dashboard?salonId=${encodeURIComponent(tenantHint.salonId)}`
          : "/staff/dashboard";

        router.push(callbackUrl);
      } else {
        setError(t("accessDenied"));
        await signIn("credentials", { redirect: false }); // Logout
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      setError(t("connectionError"));
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
                {t("title")}
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                {t("subtitle")}
              </p>
              {tenantHint && (
                <p className="mt-3 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
                  {t("salonDetected", { salon: tenantHint.label })}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-error/10 p-3 text-sm text-error border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">{tAuth("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{tAuth("password")}</Label>
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
                {loading ? t("loggingIn") : tAuth("login")}
              </GradientButton>
            </form>

            <div className="mt-6 text-center text-sm text-foreground-muted">
              <p>
                {t("noAccess")}{" "}
                <Link href="/contato" className="text-primary hover:underline">
                  {t("contactSalon")}
                </Link>
              </p>
              <p className="mt-2">
                <Link href="/" className="text-primary hover:underline">
                  {t("backToHome")}
                </Link>
              </p>
            </div>
          </GlassCard>
        </div>
      </GridBackground>
    </div>
  );
}
