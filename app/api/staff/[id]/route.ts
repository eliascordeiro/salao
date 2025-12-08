import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Buscar profissional por ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        salon: true,
        services: {
          include: {
            service: true
          }
        }
      }
    })

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Erro ao buscar profissional:", error)
    return NextResponse.json(
      { error: "Erro ao buscar profissional" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar profissional
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const data = await request.json()
    const { name, email, phone, specialty, active, serviceIds } = data

    // Se serviceIds foi fornecido, atualizar as associações
    if (serviceIds !== undefined) {
      // Primeiro, remover todas as associações antigas
      await prisma.serviceStaff.deleteMany({
        where: { staffId: id }
      })

      // Criar novas associações
      if (serviceIds.length > 0) {
        await prisma.serviceStaff.createMany({
          data: serviceIds.map((serviceId: string) => ({
            staffId: id,
            serviceId,
          })),
        })
      }
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
        active: active !== undefined ? active : true,
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

    return NextResponse.json(staff)
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar profissional" },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar horários do profissional
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params
    const data = await request.json()
    const { workDays, workStart, workEnd, lunchStart, lunchEnd, slotInterval } = data

    console.log("📝 Dados recebidos:", {
      workDays,
      workDaysType: typeof workDays,
      isArray: Array.isArray(workDays),
      workStart,
      workEnd,
      lunchStart,
      lunchEnd,
      slotInterval,
    })

    // Validação dos horários
    if (workStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(workStart)) {
      return NextResponse.json(
        { error: "Formato de horário de início inválido" },
        { status: 400 }
      )
    }

    if (workEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(workEnd)) {
      return NextResponse.json(
        { error: "Formato de horário de término inválido" },
        { status: 400 }
      )
    }

    // Validação do almoço (se fornecido)
    if (lunchStart && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(lunchStart)) {
      return NextResponse.json(
        { error: "Formato de horário de início do almoço inválido" },
        { status: 400 }
      )
    }

    if (lunchEnd && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(lunchEnd)) {
      return NextResponse.json(
        { error: "Formato de horário de término do almoço inválido" },
        { status: 400 }
      )
    }

    // Validação: pelo menos um dia deve ser selecionado
    if (workDays && (!Array.isArray(workDays) || workDays.length === 0)) {
      return NextResponse.json(
        { error: "Selecione pelo menos um dia de trabalho" },
        { status: 400 }
      )
    }

    // Atualizar dados do profissional
    const staff = await prisma.staff.update({
      where: { id },
      data: {
        workDays: workDays && workDays.length > 0 ? workDays.join(",") : null,
        workStart: workStart || null,
        workEnd: workEnd || null,
        lunchStart: lunchStart && lunchStart.trim() !== "" ? lunchStart : null,
        lunchEnd: lunchEnd && lunchEnd.trim() !== "" ? lunchEnd : null,
        slotInterval: slotInterval || 15,
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

    return NextResponse.json(staff)
  } catch (error) {
    console.error("❌ Erro ao atualizar horários:", error)
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error("   Mensagem:", error.message)
      console.error("   Stack:", error.stack)
    }
    
    return NextResponse.json(
      { 
        error: "Erro ao atualizar horários",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    )
  }
}

// DELETE - Deletar profissional
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await context.params

    await prisma.staff.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Profissional deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar profissional:", error)
    return NextResponse.json(
      { error: "Erro ao deletar profissional" },
      { status: 500 }
    )
  }
}
