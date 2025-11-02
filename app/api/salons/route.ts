import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const salons = await prisma.salon.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(salons)
  } catch (error) {
    console.error("Erro ao buscar salões:", error)
    return NextResponse.json(
      { error: "Erro ao buscar salões" },
      { status: 500 }
    )
  }
}
