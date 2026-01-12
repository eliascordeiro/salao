import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar se é PLATFORM_ADMIN
    if (!session || session.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform Admin access only" },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") // "active" | "inactive" | "all"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Construir where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status === "active") {
      where.active = true
    } else if (status === "inactive") {
      where.active = false
    }

    // Buscar salões com informações relacionadas
    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          _count: {
            select: {
              staff: true,
              services: true,
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.salon.count({ where }),
    ])

    return NextResponse.json({
      salons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching salons:", error)
    return NextResponse.json(
      { error: "Failed to fetch salons" },
      { status: 500 }
    )
  }
}

// Ativar/Desativar salão
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform Admin access only" },
        { status: 401 }
      )
    }

    const { salonId, active } = await request.json()

    if (!salonId || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request - salonId and active (boolean) required" },
        { status: 400 }
      )
    }

    const salon = await prisma.salon.update({
      where: { id: salonId },
      data: { active },
    })

    return NextResponse.json({
      success: true,
      salon,
      message: `Salão ${active ? "ativado" : "desativado"} com sucesso`,
    })
  } catch (error) {
    console.error("Error updating salon:", error)
    return NextResponse.json(
      { error: "Failed to update salon" },
      { status: 500 }
    )
  }
}
