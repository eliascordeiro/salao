"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Scissors, User, LogOut, LayoutDashboard, Heart, Calendar } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  showAuth?: boolean;
}

export function Navbar({ showAuth = true }: NavbarProps) {
  const { data: session, status } = useSession();
  
  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Scissors className="h-6 w-6 text-primary" />
          <span>AgendaSalão</span>
        </Link>
        
        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/saloes" className="text-sm font-medium hover:text-primary transition-colors">
            Buscar Salões
          </Link>
          <Link href="/sobre" className="text-sm font-medium hover:text-primary transition-colors">
            Sobre
          </Link>
          <Link href="/contato" className="text-sm font-medium hover:text-primary transition-colors">
            Contato
          </Link>
        </div>
        
        {/* Auth Section */}
        {showAuth && (
          <div className="flex items-center gap-2">
            {status === "loading" ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 border border-border/50 hover:bg-background-alt/80">
                    <User className="h-4 w-4 text-primary" />
                    <span className="hidden md:inline text-foreground">{session.user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                    {session.user.name}
                  </div>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {session.user.email}
                  </div>
                  <DropdownMenuSeparator />
                  
                  {session.user.role === "ADMIN" ? (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                  ) : (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/meus-agendamentos" className="cursor-pointer">
                          <Calendar className="h-4 w-4 mr-2" />
                          Meus Agendamentos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/favoritos" className="cursor-pointer">
                          <Heart className="h-4 w-4 mr-2" />
                          Meus Favoritos
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/perfil" className="cursor-pointer">
                          <User className="h-4 w-4 mr-2" />
                          Meu Perfil
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild className="gap-2">
                <Link href="/login">
                  <User className="h-4 w-4" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
