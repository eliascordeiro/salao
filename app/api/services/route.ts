import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserSalonId } from "@/lib/salon-helper"

// GET - Listar todos os serviços do salão do usuário
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("activeOnly") === "true"

    // Obter salão do usuário logado automaticamente
    const userSalonId = await getUserSalonId()
    
    // Se não for admin e não tiver salão, retornar erro
    if (!userSalonId && (!session || session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 })
    }

    // Construir filtros
    const where: any = {}
    
    // Sempre filtrar pelo salão do usuário (se tiver)
    if (userSalonId) {
      where.salonId = userSalonId
    }

    // Se não for admin, mostrar apenas serviços ativos
    // Se for admin, mostrar todos (a menos que activeOnly seja true)
    if (!session || session.user.role !== "ADMIN" || activeOnly) {
      where.active = true
    }

    const services = await prisma.service.findMany({
      where,
      include: {
        salon: true,
        staff: {
          where: {
            staff: {
              active: true // Incluir apenas profissionais ativos
            }
          },
          include: {
            staff: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error("Erro ao buscar serviços:", error)
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 }
    )
  }
}

// POST - Criar novo serviço no salão do usuário
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
    const { name, description, duration, price, category, staffIds } = data

    // Validações
    if (!name || !duration || !price) {
      return NextResponse.json(
        { error: "Nome, duração e preço são obrigatórios" },
        { status: 400 }
      )
    }

    // Criar serviço no salão do usuário automaticamente
    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        category: category || null,
        salonId: userSalonId, // Usar salão do usuário automaticamente
      }
    })

    // Associar profissionais ao serviço
    if (staffIds && staffIds.length > 0) {
      await Promise.all(
        staffIds.map((staffId: string) =>
          prisma.serviceStaff.create({
            data: {
              serviceId: service.id,
              staffId
            }
          })
        )
      )
    }

    const serviceWithStaff = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        salon: true,
        staff: {
          include: {
            staff: true
          }
        }
      }
    })

    return NextResponse.json(serviceWithStaff, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar serviço:", error)
    return NextResponse.json(
      { error: "Erro ao criar serviço" },
      { status: 500 }
    )
  }
}
