import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserSalonId } from "@/lib/salon-helper"

// GET - Listar todos os profissionais do salão do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter salão do usuário logado automaticamente
    const userSalonId = await getUserSalonId()
    
    if (!userSalonId) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 })
    }

    const staff = await prisma.staff.findMany({
      where: { salonId: userSalonId },
      include: {
        salon: true,
        services: {
          include: {
            service: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error)
    return NextResponse.json(
      { error: "Erro ao buscar profissionais" },
      { status: 500 }
    )
  }
}

// POST - Criar novo profissional no salão do usuário
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter salão do usuário logado automaticamente
    const userSalonId = await getUserSalonId()
    
    if (!userSalonId) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 })
    }

    const data = await request.json()
    const { name, email, phone, specialty } = data

    // Validações
    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
        salonId: userSalonId, // Usar salão do usuário automaticamente
      },
      include: {
        salon: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar profissional:", error)
    return NextResponse.json(
      { error: "Erro ao criar profissional" },
      { status: 500 }
    )
  }
}
