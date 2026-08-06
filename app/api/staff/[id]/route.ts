import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

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

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const { id } = await context.params

    const staff = await prisma.staff.findUnique({
      where: { id, salonId: session.user.salonId },
      include: {
        salon: true,
        services: {
          include: {
            service: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            active: true
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

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const { id } = await context.params
    const data = await request.json()
    const { name, email, phone, specialty, active, serviceIds, loginEnabled, canEditSchedule, canManageBlocks, canConfirmBooking, canCancelBooking } = data

    // Buscar profissional atual
    const currentStaff = await prisma.staff.findUnique({
      where: { id, salonId: session.user.salonId },
      select: { userId: true, email: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    // Gerenciar acesso ao portal
    let userId = currentStaff.userId

    if (loginEnabled && email) {
      console.log('🔑 [PUT /api/staff] Gerenciando acesso ao portal para:', email)

      if (userId) {
        // Usuário já existe, apenas ativar
        await prisma.user.update({
          where: { id: userId },
          data: { 
            active: true,
            email, // Atualizar email se mudou
            name,
            phone: phone || null
          }
        })
        console.log('✅ [PUT /api/staff] Usuário ativado:', userId)
      } else {
        // Criar novo usuário
        const existingUser = await prisma.user.findUnique({
          where: { email }
        })

        if (existingUser) {
          // Vincular ao usuário existente
          userId = existingUser.id
          await prisma.user.update({
            where: { id: userId },
            data: { active: true }
          })
          console.log('✅ [PUT /api/staff] Vinculado a usuário existente:', userId)
        } else {
          // Criar novo usuário com senha temporária
          const temporaryPassword = crypto.randomBytes(16).toString('hex')
          const newUser = await prisma.user.create({
            data: {
              email,
              password: temporaryPassword,
              name,
              phone: phone || null,
              role: "STAFF",
              roleType: "STAFF",
              active: true,
              ownerId: session.user.id,
            }
          })
          userId = newUser.id
          console.log('✅ [PUT /api/staff] Novo usuário criado:', userId)
        }
      }
    } else if (!loginEnabled && userId) {
      // Desativar acesso ao portal
      await prisma.user.update({
        where: { id: userId },
        data: { active: false }
      })
      console.log('🔒 [PUT /api/staff] Usuário desativado:', userId)
    }

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

    // Construir objeto de atualização para o PUT
    const updateDataPut: any = {
      name,
      email: email || null,
      phone: phone || null,
      specialty: specialty || null,
      active: active !== undefined ? active : true,
      userId, // Atualizar vínculo com usuário
    }

    // Apenas atualizar permissões se foram enviadas
    if (canEditSchedule !== undefined) {
      updateDataPut.canEditSchedule = canEditSchedule
    }
    if (canManageBlocks !== undefined) {
      updateDataPut.canManageBlocks = canManageBlocks
    }
    if (canConfirmBooking !== undefined) {
      updateDataPut.canConfirmBooking = canConfirmBooking
    }
    if (canCancelBooking !== undefined) {
      updateDataPut.canCancelBooking = canCancelBooking
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateDataPut,
      include: {
        salon: true,
        services: {
          include: {
            service: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            active: true
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

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const { id } = await context.params
    const data = await request.json()
    const { workDays, workStart, workEnd, lunchStart, lunchEnd, slotInterval, canEditSchedule, canManageBlocks, canConfirmBooking, canCancelBooking } = data

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

    // Construir objeto de atualização com apenas os campos enviados
    const updateData: any = {}

    // Apenas atualizar campos de horário se foram enviados
    if (workDays !== undefined) {
      updateData.workDays = workDays.length > 0 ? workDays.join(",") : null
    }
    if (workStart !== undefined) {
      updateData.workStart = workStart || null
    }
    if (workEnd !== undefined) {
      updateData.workEnd = workEnd || null
    }
    if (lunchStart !== undefined) {
      updateData.lunchStart = lunchStart && lunchStart.trim() !== "" ? lunchStart : null
    }
    if (lunchEnd !== undefined) {
      updateData.lunchEnd = lunchEnd && lunchEnd.trim() !== "" ? lunchEnd : null
    }
    if (slotInterval !== undefined) {
      updateData.slotInterval = slotInterval || 15
    }

    // Apenas atualizar permissões se foram enviadas
    if (canEditSchedule !== undefined) {
      updateData.canEditSchedule = canEditSchedule
    }
    if (canManageBlocks !== undefined) {
      updateData.canManageBlocks = canManageBlocks
    }
    if (canConfirmBooking !== undefined) {
      updateData.canConfirmBooking = canConfirmBooking
    }
    if (canCancelBooking !== undefined) {
      updateData.canCancelBooking = canCancelBooking
    }

    // Atualizar dados do profissional
    const staffToUpdate = await prisma.staff.findUnique({
      where: { id, salonId: session.user.salonId },
      select: { id: true },
    })

    if (!staffToUpdate) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
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

    if (!session.user.salonId) {
      return NextResponse.json({ error: "Salão não associado à sessão" }, { status: 400 })
    }

    const { id } = await context.params

    const staffToDelete = await prisma.staff.findUnique({
      where: { id, salonId: session.user.salonId },
      select: { id: true },
    })

    if (!staffToDelete) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 })
    }

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
