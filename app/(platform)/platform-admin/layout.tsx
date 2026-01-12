import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { LayoutDashboard, Store, Users, CreditCard, BarChart3, HeadphonesIcon, Settings } from "lucide-react"
import Link from "next/link"

export default async function PlatformAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Verificar se está autenticado e é PLATFORM_ADMIN
  if (!session || session.user?.role !== "PLATFORM_ADMIN") {
    redirect("/login")
  }

  const navItems = [
    { href: "/platform-admin", icon: LayoutDashboard, label: "Overview" },
    { href: "/platform-admin/saloes", icon: Store, label: "Salões" },
    { href: "/platform-admin/usuarios", icon: Users, label: "Usuários" },
    { href: "/platform-admin/assinaturas", icon: CreditCard, label: "Assinaturas" },
    { href: "/platform-admin/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/platform-admin/suporte", icon: HeadphonesIcon, label: "Suporte" },
    { href: "/platform-admin/configuracoes", icon: Settings, label: "Configurações" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-pink-600">
              <span className="text-xl font-bold text-white">SB</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">Platform Admin</h1>
              <p className="text-xs text-muted-foreground">SalãoBlza Control Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{session.user?.name}</p>
              <p className="text-xs text-muted-foreground">{session.user?.email}</p>
            </div>
            <Link
              href="/api/auth/signout"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="container flex gap-6 py-6">
        {/* Sidebar */}
        <aside className="w-64 shrink-0">
          <nav className="sticky top-20 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
