import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getUserSalonId } from "@/lib/salon-helper"
import { canAddStaff } from "@/lib/seat-pricing"
import crypto from "crypto"

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
    console.log('📝 [POST /api/staff] Dados recebidos:', { 
      name: data.name, 
      salonId: userSalonId,
      workDays: data.workDays,
      workStart: data.workStart,
      workEnd: data.workEnd,
      slotInterval: data.slotInterval,
      loginEnabled: data.loginEnabled
    })
    
    const { 
      name, 
      email, 
      phone, 
      specialty, 
      serviceIds = [],
      workDays,
      workStart,
      workEnd,
      lunchStart,
      lunchEnd,
      slotInterval,
      canEditSchedule = false,
      canManageBlocks = false,
      canConfirmBooking = false,
      canCancelBooking = false,
      loginEnabled = false
    } = data

    // Validações
    if (!name) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      )
    }

    // Enforcement de cadeiras: não permitir mais profissionais que o contratado
    const seatCheck = await canAddStaff(userSalonId)
    if (!seatCheck.allowed) {
      console.log('⛔ [POST /api/staff] Limite de cadeiras atingido:', seatCheck)
      return NextResponse.json(
        {
          error: `Você atingiu o limite de ${seatCheck.seats} cadeira(s) da sua assinatura. Adicione mais cadeiras para cadastrar novos profissionais.`,
          code: "SEAT_LIMIT_REACHED",
          seats: seatCheck.seats,
          activeStaff: seatCheck.activeStaff,
        },
        { status: 402 }
      )
    }

    // Calcular slotInterval inteligente baseado nos serviços
    let finalSlotInterval = slotInterval || 15; // Padrão mínimo de 15 minutos
    
    // Se o profissional presta apenas UM serviço, usar a duração desse serviço como intervalo
    if (!slotInterval && serviceIds.length === 1) {
      const service = await prisma.service.findUnique({
        where: { id: serviceIds[0] },
        select: { duration: true }
      });
      if (service) {
        finalSlotInterval = service.duration;
        console.log(`🎯 [POST /api/staff] Intervalo calculado automaticamente: ${finalSlotInterval} min (baseado no serviço único)`);
      }
    }

    // Criar usuário se loginEnabled estiver ativo
    let userId: string | undefined = undefined;
    if (loginEnabled && email) {
      console.log('🔑 [POST /api/staff] Criando acesso ao portal para:', email);
      
      // Verificar se já existe um usuário com este email
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        console.log('⚠️ [POST /api/staff] Usuário já existe:', existingUser.id);
        userId = existingUser.id;
        
        // Reativar se estiver inativo
        if (!existingUser.active) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { active: true }
          });
          console.log('✅ [POST /api/staff] Usuário reativado');
        }
      } else {
        // Criar novo usuário com senha temporária
        const temporaryPassword = crypto.randomBytes(16).toString('hex');
        const newUser = await prisma.user.create({
          data: {
            email,
            password: temporaryPassword, // Senha temporária (profissional usará "Esqueci senha")
            name,
            phone: phone || null,
            role: "STAFF",
            roleType: "STAFF",
            active: true,
            ownerId: session.user.id, // Vincular ao dono do salão
          }
        });
        userId = newUser.id;
        console.log('✅ [POST /api/staff] Usuário criado:', newUser.id);
      }
    }

    const staff = await prisma.staff.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
        salonId: userSalonId, // Usar salão do usuário automaticamente
        userId, // Vincular ao usuário criado
        // Adicionar dados de horário
        workDays: workDays || null,
        workStart: workStart || null,
        workEnd: workEnd || null,
        lunchStart: lunchStart || null,
        lunchEnd: lunchEnd || null,
        slotInterval: finalSlotInterval,
        canEditSchedule: canEditSchedule,
        canManageBlocks: canManageBlocks,
        canConfirmBooking: canConfirmBooking,
        canCancelBooking: canCancelBooking,
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
