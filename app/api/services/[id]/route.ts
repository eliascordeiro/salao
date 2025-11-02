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

    const service = await prisma.service.findUnique({
      where: { id: params.id },
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

    return NextResponse.json(service)
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

    const data = await request.json()
    const { name, description, duration, price, category, active, staffIds } = data

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
