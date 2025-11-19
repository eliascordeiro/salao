import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getUserSalon } from "@/lib/salon-helper"
import { prisma } from "@/lib/prisma"

// Força renderização dinâmica
export const dynamic = 'force-dynamic'

// GET - Obter informações do salão do usuário logado
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const salon = await getUserSalon()
    
    if (!salon) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 404 })
    }

    return NextResponse.json(salon)
  } catch (error) {
    console.error("Erro ao buscar informações do salão:", error)
    return NextResponse.json(
      { error: "Erro ao buscar informações do salão" },
      { status: 500 }
    )
  }
}

// PUT - Atualizar informações do salão do usuário logado
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const salon = await getUserSalon()
    
    if (!salon) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 404 })
    }

    const data = await request.json()
    const {
      name,
      description,
      address,
      phone,
      email,
      openTime,
      closeTime,
      workDays,
      bookingType,
      active,
      // Novos campos de endereço separados
      cep,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
    } = data

    // Montar endereço completo se os campos separados foram fornecidos
    let fullAddress = address;
    if (street) {
      fullAddress = street;
      if (number) fullAddress += `, ${number}`;
      if (neighborhood) fullAddress += ` - ${neighborhood}`;
      if (city && state) fullAddress += ` - ${city}/${state}`;
    }

    // Validações básicas
    if (name && name.trim().length < 3) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 3 caracteres" },
        { status: 400 }
      )
    }

    if (bookingType && !['DYNAMIC', 'SLOT_BASED', 'BOTH'].includes(bookingType)) {
      return NextResponse.json(
        { error: "Tipo de agendamento inválido" },
        { status: 400 }
      )
    }

    // Atualizar salão
    const updatedSalon = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(fullAddress && { address: fullAddress.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || '' }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(openTime !== undefined && { openTime: openTime?.trim() || '09:00' }),
        ...(closeTime !== undefined && { closeTime: closeTime?.trim() || '19:00' }),
        ...(workDays !== undefined && { workDays: workDays?.trim() || '1,2,3,4,5' }),
        // Novos campos de endereço
        ...(cep !== undefined && { zipCode: cep?.replace(/\D/g, '') || null }),
        ...(street !== undefined && { street: street?.trim() || null }),
        ...(number !== undefined && { number: number?.trim() || null }),
        ...(complement !== undefined && { complement: complement?.trim() || null }),
        ...(neighborhood !== undefined && { neighborhood: neighborhood?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(state !== undefined && { state: state?.trim().toUpperCase() || null }),
        // bookingType removido do schema
        ...(active !== undefined && { active }),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedSalon)
  } catch (error) {
    console.error("Erro ao atualizar salão:", error)
    return NextResponse.json(
      { error: "Erro ao atualizar salão" },
      { status: 500 }
    )
  }
}
