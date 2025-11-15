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
      // bookingType, // Campo removido do schema
      active
    } = data

    // Extrair cidade e estado do endereço
    // Formato esperado: "Rua, 123 - Bairro - Cidade/UF"
    let city = null;
    let state = null;
    
    if (address && typeof address === 'string') {
      const parts = address.split(' - ');
      if (parts.length >= 3) {
        const cityState = parts[parts.length - 1].trim();
        const [cityPart, statePart] = cityState.split('/');
        city = cityPart?.trim() || null;
        state = statePart?.trim() || null;
      }
    }

    // Validações básicas
    if (name && name.trim().length < 3) {
      return NextResponse.json(
        { error: "Nome deve ter pelo menos 3 caracteres" },
        { status: 400 }
      )
    }

    // Campo bookingType removido - sistema agora usa apenas slots

    // Atualizar salão
    const updatedSalon = await prisma.salon.update({
      where: { id: salon.id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || '' }),
        ...(city && { city }),
        ...(state && { state }),
        ...(phone !== undefined && { phone: phone?.trim() || '' }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(openTime !== undefined && { openTime: openTime?.trim() || '09:00' }),
        ...(closeTime !== undefined && { closeTime: closeTime?.trim() || '19:00' }),
        ...(workDays !== undefined && { workDays: workDays?.trim() || '1,2,3,4,5' }),
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
