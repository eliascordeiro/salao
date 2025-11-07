import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserSalon } from "@/lib/salon-helper"

// Força renderização dinâmica (usa headers para auth)
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter salão do usuário logado automaticamente
    const userSalon = await getUserSalon()
    
    if (!userSalon) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 })
    }

    // Retornar apenas o salão do usuário em formato de array (compatibilidade)
    return NextResponse.json([userSalon])
  } catch (error) {
    console.error("Erro ao buscar salões:", error)
    return NextResponse.json(
      { error: "Erro ao buscar salões" },
      { status: 500 }
    )
  }
}
