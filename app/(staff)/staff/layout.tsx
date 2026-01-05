"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Calendar, 
  DollarSign, 
  User, 
  Clock,
  LogOut,
  Menu,
  X,
  Briefcase
} from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlassCard } from "@/components/ui/glass-card";
import { GridBackground } from "@/components/ui/grid-background";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { signOut } from "next-auth/react";

interface StaffLayoutProps {
  children: React.ReactNode;
}

export default function StaffLayout({ children }: StaffLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/staff-login");
      return;
    }

    // Verificar se é profissional
    if (session.user.role !== "STAFF" && session.user.roleType !== "STAFF") {
      router.push("/acesso-negado");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/staff/dashboard",
    },
    {
      icon: Calendar,
      label: "Minha Agenda",
      href: "/staff/agenda",
    },
    {
      icon: DollarSign,
      label: "Minhas Comissões",
      href: "/staff/comissoes",
    },
    {
      icon: Clock,
      label: "Horários",
      href: "/staff/horarios",
    },
    {
      icon: User,
      label: "Meu Perfil",
      href: "/staff/perfil",
    },
  ];

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/staff-login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <GridBackground>
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 border-b border-primary/10 bg-background/95 backdrop-blur-md">
          <div className="flex items-center justify-between p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <span className="font-bold text-sm sm:text-base text-foreground truncate">Portal do Profissional</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 z-50 h-full w-64 border-r border-primary/10 bg-background/95 backdrop-blur-md
            transition-transform duration-300 ease-in-out
            lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-primary/10 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground">Profissional</p>
              </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 space-y-1 p-4">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
                      ${
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-foreground-muted hover:bg-background-alt/50 hover:text-foreground"
                      }
                    `}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle and Logout */}
            <div className="border-t border-primary/10 p-4 space-y-3">
              <div className="flex justify-center">
                <ThemeToggle />
              </div>
              <GradientButton
                variant="accent"
                className="w-full justify-start gap-3 min-h-[44px]"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </GradientButton>
            </div>
          </div>
        </aside>

        {/* Overlay para mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
          <div className="container mx-auto p-3 sm:p-4 lg:p-8 max-w-7xl">
            {children}
          </div>
        </main>
      </GridBackground>
    </div>
  );
}
