import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cashier/close-session
 * 
 * Fecha a conta de um cliente (cria ou atualiza CashierSession)
 * Calcula o total de todos os serviços prestados no dia
 * 
 * Body: {
 *   sessionId?: string,       // Se fornecido, atualiza sessão OPEN existente
 *   clientId: string,
 *   bookingIds: string[],
 *   discount?: number,
 *   paymentMethod: "CASH" | "CARD" | "PIX" | "MULTIPLE"
 * }
 */
export async function POST(request: Request) {
  console.log('🔵 [API] POST /api/cashier/close-session - Iniciando...');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('🔑 Session user:', session?.user?.email);
    
    if (!session?.user?.id) {
      console.log('❌ Não autenticado');
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const salonId = session.user.salonId;
    console.log('🏪 Salão encontrado:', salonId);

    if (!salonId) {
      console.log('❌ Salão não encontrado');
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    console.log('📦 Body recebido:', body);
    
    const { sessionId, clientId, bookingIds, discount = 0, paymentMethod } = body;

    // Validações
    if (!clientId || !bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { error: "clientId e bookingIds são obrigatórios" },
        { status: 400 }
      );
    }

    if (!paymentMethod || !["CASH", "CARD", "PIX", "MULTIPLE"].includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pagamento inválido" },
        { status: 400 }
      );
    }

    // Se sessionId foi fornecido, processa apenas os itens selecionados
    if (sessionId) {
      console.log('♻️ Processando sessão existente:', sessionId);
      console.log('📋 Bookings selecionados para pagamento:', bookingIds);
      
      const existingSession = await prisma.cashierSession.findUnique({
        where: { id: sessionId, salonId },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      if (!existingSession) {
        return NextResponse.json(
          { error: "Sessão não encontrada" },
          { status: 404 }
        );
      }

      if (existingSession.status !== "OPEN") {
        return NextResponse.json(
          { error: "Sessão já foi fechada ou cancelada" },
          { status: 400 }
        );
      }

      // Separa itens selecionados dos não selecionados
      const selectedItems = existingSession.items.filter(item => 
        bookingIds.includes(item.bookingId)
      );
      const unselectedItems = existingSession.items.filter(item => 
        !bookingIds.includes(item.bookingId)
      );

      console.log('✅ Itens selecionados:', selectedItems.length);
      console.log('⏸️ Itens não selecionados (ficam pendentes):', unselectedItems.length);

      if (selectedItems.length === 0) {
        return NextResponse.json(
          { error: "Nenhum item selecionado para pagamento" },
          { status: 400 }
        );
      }

      // Calcula subtotal apenas dos itens selecionados
      const subtotalSelected = selectedItems.reduce((sum, item) => sum + item.price, 0);
      const total = Math.max(0, subtotalSelected - discount);

      // Cria nova sessão CLOSED com apenas os itens pagos
      const closedSession = await prisma.cashierSession.create({
        data: {
          salonId,
          clientId,
          subtotal: subtotalSelected,
          discount,
          total,
          status: "CLOSED",
          paymentMethod,
          paidAt: new Date(),
          closedAt: new Date(),
          items: {
            create: selectedItems.map(item => ({
              bookingId: item.bookingId,
              serviceName: item.serviceName,
              staffName: item.staffName,
              price: item.price,
              discount: 0,
            })),
          },
        },
        include: {
          items: true,
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      console.log('✅ Nova sessão CLOSED criada:', closedSession.id);

      // 💰 CALCULAR COMISSÕES AUTOMATICAMENTE para os itens pagos
      console.log('💰 Calculando comissões para os agendamentos pagos...');
      for (const item of selectedItems) {
        try {
          // Buscar informações do booking
          const booking = await prisma.booking.findUnique({
            where: { id: item.bookingId },
            include: {
              service: true,
              staff: true,
            },
          });

          if (!booking) continue;

          // Verificar se já existe comissão
          const existingCommission = await prisma.commission.findFirst({
            where: {
              bookingId: booking.id,
              staffId: booking.staffId,
            },
          });

          if (existingCommission) {
            console.log(`⏭️ Comissão já existe para booking ${booking.id}, pulando...`);
            continue;
          }

          // Buscar configuração de comissão
          const staffConfig = await prisma.staffCommissionConfig.findUnique({
            where: { staffId: booking.staffId },
            include: {
              serviceOverrides: {
                where: { serviceId: booking.serviceId },
              },
            },
          });

          if (!staffConfig) {
            console.log(`⚠️ Profissional ${booking.staff.name} não possui configuração de comissão`);
            continue;
          }

          // Usar override se existir
          const config =
            staffConfig.serviceOverrides.length > 0
              ? staffConfig.serviceOverrides[0]
              : staffConfig;

          // Função de cálculo
          const calculateCommission = (
            servicePrice: number,
            commissionType: string,
            percentageValue: number | null,
            fixedValue: number | null
          ): number => {
            switch (commissionType) {
              case "PERCENTAGE":
                return servicePrice * ((percentageValue || 0) / 100);
              case "FIXED":
                return fixedValue || 0;
              case "MIXED":
                return (fixedValue || 0) + servicePrice * ((percentageValue || 0) / 100);
              default:
                return 0;
            }
          };

          // Calcular comissão
          const calculatedValue = calculateCommission(
            booking.totalPrice,
            config.commissionType,
            config.percentageValue,
            config.fixedValue
          );

          // Criar registro de comissão
          await prisma.commission.create({
            data: {
              bookingId: booking.id,
              staffId: booking.staffId,
              salonId,
              serviceId: booking.serviceId,
              servicePrice: booking.totalPrice,
              commissionType: config.commissionType,
              percentageValue: config.percentageValue,
              fixedValue: config.fixedValue,
              calculatedValue,
              status: "PENDING",
            },
          });

          console.log(`✅ Comissão criada: R$ ${calculatedValue.toFixed(2)} para ${booking.staff.name}`);
        } catch (commissionError) {
          console.error(`❌ Erro ao calcular comissão para item ${item.id}:`, commissionError);
          // Não interrompe o fluxo
        }
      }

      // Atualizar status dos bookings para COMPLETED
      await prisma.booking.updateMany({
        where: {
          id: { in: bookingIds },
          status: "CONFIRMED",
        },
        data: {
          status: "COMPLETED",
        },
      });

      // Se ainda há itens não selecionados, mantém sessão OPEN com eles
      if (unselectedItems.length > 0) {
        console.log('♻️ Mantendo itens não pagos na sessão OPEN');
        
        // Remove os itens pagos da sessão original
        await prisma.cashierSessionItem.deleteMany({
          where: {
            id: { in: selectedItems.map(item => item.id) },
          },
        });

        // Recalcula subtotal e total da sessão OPEN
        const newSubtotal = unselectedItems.reduce((sum, item) => sum + item.price, 0);
        
        await prisma.cashierSession.update({
          where: { id: sessionId },
          data: {
            subtotal: newSubtotal,
            total: newSubtotal,
            discount: 0,
          },
        });

        console.log('✅ Sessão OPEN atualizada com itens restantes');
      } else {
        // Todos os itens foram pagos, pode deletar a sessão original
        console.log('🗑️ Todos os itens pagos, removendo sessão OPEN original');
        await prisma.cashierSession.delete({
          where: { id: sessionId },
        });
      }

      return NextResponse.json({
        success: true,
        message: "Conta fechada com sucesso",
        session: closedSession,
        remainingItems: unselectedItems.length,
      });
    }

    // Se não tem sessionId, cria nova sessão (fluxo antigo - backwards compatibility)
    console.log('🆕 Criando nova sessão de caixa');

    // Busca todos os agendamentos especificados
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        salonId,
        clientId,
        status: { in: ["CONFIRMED", "COMPLETED"] }, // Aceita ambos os status
      },
      include: {
        service: true,
        staff: true,
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum agendamento encontrado" },
        { status: 404 }
      );
    }

    // Calcula subtotal
    const subtotal = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const total = Math.max(0, subtotal - discount);

    // Cria nova sessão de caixa
    const cashierSession = await prisma.cashierSession.create({
      data: {
        salonId,
        clientId,
        subtotal,
        discount,
        total,
        status: "CLOSED",
        paymentMethod,
        paidAt: new Date(),
        closedAt: new Date(),
        items: {
          create: bookings.map((booking) => ({
            bookingId: booking.id,
            serviceName: booking.service.name,
            staffName: booking.staff.name,
            price: booking.totalPrice,
            discount: 0,
          })),
        },
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Atualiza status dos bookings para COMPLETED (se ainda não estiverem)
    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
        status: "CONFIRMED",
      },
      data: {
        status: "COMPLETED",
      },
    });

    // 💰 CALCULAR COMISSÕES AUTOMATICAMENTE
    console.log('💰 Calculando comissões para os agendamentos pagos...');
    for (const booking of bookings) {
      try {
        // Verificar se já existe comissão para este agendamento
        const existingCommission = await prisma.commission.findFirst({
          where: {
            bookingId: booking.id,
            staffId: booking.staffId,
          },
        });

        if (existingCommission) {
          console.log(`⏭️ Comissão já existe para booking ${booking.id}, pulando...`);
          continue;
        }

        // Buscar configuração de comissão do profissional
        const staffConfig = await prisma.staffCommissionConfig.findUnique({
          where: { staffId: booking.staffId },
          include: {
            serviceOverrides: {
              where: { serviceId: booking.serviceId },
            },
          },
        });

        if (!staffConfig) {
          console.log(`⚠️ Profissional ${booking.staff.name} não possui configuração de comissão`);
          continue;
        }

        // Usar override se existir, senão usar configuração padrão
        const config =
          staffConfig.serviceOverrides.length > 0
            ? staffConfig.serviceOverrides[0]
            : staffConfig;

        // Função de cálculo
        const calculateCommission = (
          servicePrice: number,
          commissionType: string,
          percentageValue: number | null,
          fixedValue: number | null
        ): number => {
          switch (commissionType) {
            case "PERCENTAGE":
              return servicePrice * ((percentageValue || 0) / 100);
            case "FIXED":
              return fixedValue || 0;
            case "MIXED":
              return (fixedValue || 0) + servicePrice * ((percentageValue || 0) / 100);
            default:
              return 0;
          }
        };

        // Calcular comissão
        const calculatedValue = calculateCommission(
          booking.totalPrice,
          config.commissionType,
          config.percentageValue,
          config.fixedValue
        );

        // Criar registro de comissão
        await prisma.commission.create({
          data: {
            bookingId: booking.id,
            staffId: booking.staffId,
            salonId,
            serviceId: booking.serviceId,
            servicePrice: booking.totalPrice,
            commissionType: config.commissionType,
            percentageValue: config.percentageValue,
            fixedValue: config.fixedValue,
            calculatedValue,
            status: "PENDING",
          },
        });

        console.log(`✅ Comissão criada: R$ ${calculatedValue.toFixed(2)} para ${booking.staff.name}`);
      } catch (commissionError) {
        console.error(`❌ Erro ao calcular comissão para booking ${booking.id}:`, commissionError);
        // Não interrompe o fluxo se falhar a comissão
      }
    }

    console.log('✅ Nova sessão criada e fechada:', cashierSession.id);

    return NextResponse.json({
      success: true,
      message: "Conta fechada com sucesso",
      session: cashierSession,
    });
  } catch (error) {
    console.error("Erro ao fechar sessão de caixa:", error);
    return NextResponse.json(
      { error: "Erro ao fechar sessão de caixa" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cashier/close-session?sessionId={id}
 * 
 * Busca uma sessão de caixa fechada específica (para exibir comprovante)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const salonId = session.user.salonId;
    if (!salonId) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId é obrigatório" },
        { status: 400 }
      );
    }

    const cashierSession = await prisma.cashierSession.findUnique({
      where: {
        id: sessionId,
        salonId,
      },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!cashierSession) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session: cashierSession,
    });
  } catch (error) {
    console.error("Erro ao buscar sessão de caixa:", error);
    return NextResponse.json(
      { error: "Erro ao buscar sessão de caixa" },
      { status: 500 }
    );
  }
}
