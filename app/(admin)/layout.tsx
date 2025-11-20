"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context"
import { cn } from "@/lib/utils"
import { AdminAIChatWidget } from "@/components/chat/admin-ai-chat-widget"
import { useSession } from "next-auth/react"

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar()
  const { data: session } = useSession()

  return (
    <div className="flex min-h-screen">
      {/* Sidebar sempre visível */}
      <Sidebar />
      
      {/* Conteúdo principal com margem dinâmica */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 w-full",
          // Desktop: ajusta margem baseado no estado collapsed
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="p-4 lg:p-8 pt-16 lg:pt-8">
          {children}
        </div>
      </main>

      {/* Assistente Virtual Admin */}
      <AdminAIChatWidget 
        userName={session?.user?.name}
        userRole={session?.user?.role}
      />
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  )
}
