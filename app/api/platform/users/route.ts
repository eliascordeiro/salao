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
    const role = searchParams.get("role") // "ADMIN" | "CLIENT" | "PLATFORM_ADMIN"
    const status = searchParams.get("status") // "active" | "inactive"
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    // Construir where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (status === "active") {
      where.active = true
    } else if (status === "inactive") {
      where.active = false
    }

    // Buscar usuários
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          roleType: true,
          active: true,
          createdAt: true,
          _count: {
            select: {
              bookings: true,
              ownedSalons: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

// Ativar/Desativar usuário
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform Admin access only" },
        { status: 401 }
      )
    }

    const { userId, active } = await request.json()

    if (!userId || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request - userId and active (boolean) required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { active },
    })

    return NextResponse.json({
      success: true,
      user,
      message: `Usuário ${active ? "ativado" : "desativado"} com sucesso`,
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    )
  }
}
