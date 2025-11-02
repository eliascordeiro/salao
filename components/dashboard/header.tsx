"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Scissors, LogOut, User, Settings } from "lucide-react"

interface DashboardHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Scissors className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">AgendaSalão</span>
          </Link>

          {/* Menu */}
          <nav className="hidden md:flex gap-6 items-center">
            {user.role === "ADMIN" ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/agendamentos"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Agendamentos
                </Link>
                <Link
                  href="/dashboard/servicos"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Serviços
                </Link>
                <Link
                  href="/dashboard/profissionais"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Profissionais
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/servicos"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Serviços
                </Link>
                <Link
                  href="/agendar"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Agendar
                </Link>
                <Link
                  href="/meus-agendamentos"
                  className="text-gray-600 hover:text-blue-600 transition font-medium"
                >
                  Meus Agendamentos
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
