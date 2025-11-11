import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

/**
 * POST /api/cashier/close-session
 * 
 * Fecha a conta de um cliente (cria ou atualiza CashierSession)
 * Calcula o total de todos os serviços prestados no dia
 * 
 * Body: {
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

    // Busca o salão do usuário logado
    const salon = await getUserSalon();
    console.log('🏪 Salão encontrado:', salon?.name);
    
    if (!salon) {
      console.log('❌ Salão não encontrado');
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const body = await request.json();
    console.log('📦 Body recebido:', body);
    
    const { clientId, bookingIds, discount = 0, paymentMethod } = body;

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

    // Busca todos os agendamentos especificados
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        salonId: salon.id,
        clientId,
        status: "CONFIRMED",
      },
      include: {
        service: true,
        staff: true,
      },
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: "Nenhum agendamento confirmado encontrado" },
        { status: 404 }
      );
    }

    // Calcula subtotal
    const subtotal = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const total = Math.max(0, subtotal - discount);

    // Cria ou atualiza sessão de caixa
    const cashierSession = await prisma.cashierSession.create({
      data: {
        salonId: salon.id,
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
            discount: 0, // Desconto por item pode ser implementado depois
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

    // Atualiza status dos bookings para COMPLETED
    await prisma.booking.updateMany({
      where: {
        id: { in: bookingIds },
      },
      data: {
        status: "COMPLETED",
      },
    });

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

    const salon = await getUserSalon();
    if (!salon) {
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
        salonId: salon.id,
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
