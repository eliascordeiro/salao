import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserSalonId } from "@/lib/salon-helper"

// GET - Listar todos os profissionais do salão do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔐 [GET /api/staff] Sessão:', session?.user?.email)
    
    if (!session) {
      console.log('❌ [GET /api/staff] Sem sessão')
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter salão do usuário logado automaticamente
    const userSalonId = await getUserSalonId()
    console.log('🏪 [GET /api/staff] Salão do usuário:', userSalonId)
    
    if (!userSalonId) {
      console.log('❌ [GET /api/staff] Usuário sem salão')
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

    console.log('✅ [GET /api/staff] Encontrados', staff.length, 'profissionais')
    return NextResponse.json(staff)
  } catch (error) {
    console.error("❌ [GET /api/staff] Erro:", error)
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
    console.log('🔐 [POST /api/staff] Sessão:', session?.user?.email, 'Role:', session?.user?.role)
    
    if (!session || session.user.role !== "ADMIN") {
      console.log('❌ [POST /api/staff] Sem permissão')
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Obter salão do usuário logado automaticamente
    const userSalonId = await getUserSalonId()
    console.log('🏪 [POST /api/staff] Salão do usuário:', userSalonId)
    
    if (!userSalonId) {
      console.log('❌ [POST /api/staff] Usuário sem salão')
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 })
    }

    const data = await request.json()
    console.log('📝 [POST /api/staff] Dados recebidos:', { name: data.name, salonId: userSalonId })
    
    const { name, email, phone, specialty, serviceIds = [] } = data

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
        services: {
          create: serviceIds.map((serviceId: string) => ({
            serviceId,
          })),
        },
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

    console.log('✅ [POST /api/staff] Profissional criado:', staff.id, 'no salão:', staff.salonId)
    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error("❌ [POST /api/staff] Erro:", error)
    return NextResponse.json(
      { error: "Erro ao criar profissional" },
      { status: 500 }
    )
  }
}
