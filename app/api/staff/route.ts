import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar todos os profissionais
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const salonId = searchParams.get("salonId")

    const staff = await prisma.staff.findMany({
      where: salonId ? { salonId } : {},
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

// POST - Criar novo profissional
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const { name, email, phone, specialty, salonId } = data

    // Validações
    if (!name || !salonId) {
      return NextResponse.json(
        { error: "Nome e salão são obrigatórios" },
        { status: 400 }
      )
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
        salonId,
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
