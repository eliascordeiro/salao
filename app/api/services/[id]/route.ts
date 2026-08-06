import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar serviço por ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const where: any = { id: params.id }

    if (session.user.role === "ADMIN") {
      if (!session.user.salonId) {
        return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
      }
      where.salonId = session.user.salonId
    }

    const service = await prisma.service.findFirst({
      where,
      include: {
        salon: true,
        staff: {
          include: {
            staff: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 }
      )
    }

    // Transformar a resposta para ter o formato esperado pelo frontend
    const transformedService = {
      ...service,
      staff: service.staff.map(ss => ss.staff)
    }

    return NextResponse.json(transformedService)
  } catch (error) {
    console.error("Erro ao buscar serviço:", error)
    return NextResponse.json(
      { error: "Erro ao buscar serviço" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar serviço
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const data = await request.json()
    const { name, description, duration, price, category, active, staffIds } = data

    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        salonId: session.user.salonId,
      },
      select: { id: true },
    })

    if (!existingService) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    if (staffIds !== undefined && staffIds.length > 0) {
      const staffCount = await prisma.staff.count({
        where: {
          id: { in: staffIds },
          salonId: session.user.salonId,
        },
      })

      if (staffCount !== staffIds.length) {
        return NextResponse.json(
          { error: "Um ou mais profissionais não pertencem ao seu salão" },
          { status: 400 }
        )
      }
    }

    // Atualizar serviço
    const service = await prisma.service.update({
      where: { id: params.id },
      data: {
        name,
        description: description || null,
        duration: parseInt(duration),
        price: parseFloat(price),
        category: category || null,
        active: active !== undefined ? active : true,
      }
    })

    // Atualizar profissionais
    if (staffIds !== undefined) {
      // Remover associações antigas
      await prisma.serviceStaff.deleteMany({
        where: { serviceId: params.id }
      })

      // Criar novas associações
      if (staffIds.length > 0) {
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
    }

    const updatedService = await prisma.service.findUnique({
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

    return NextResponse.json(updatedService)
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 }
    )
  }
}

// DELETE - Deletar serviço
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        salonId: session.user.salonId,
      },
      select: { id: true },
    })

    if (!existingService) {
      return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 })
    }

    await prisma.service.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: "Serviço deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar serviço:", error)
    return NextResponse.json(
      { error: "Erro ao deletar serviço" },
      { status: 500 }
    )
  }
}
