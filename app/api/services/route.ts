import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Listar todos os serviços
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const salonId = searchParams.get("salonId")
    const activeOnly = searchParams.get("activeOnly") === "true"

    // Construir filtros
    const where: any = {}
    
    if (salonId) {
      where.salonId = salonId
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

// POST - Criar novo serviço
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const data = await request.json()
    const { name, description, duration, price, category, salonId, staffIds } = data

    // Validações
    if (!name || !duration || !price || !salonId) {
      return NextResponse.json(
        { error: "Nome, duração, preço e salão são obrigatórios" },
        { status: 400 }
      )
    }

    // Criar serviço
    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        category: category || null,
        salonId,
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
