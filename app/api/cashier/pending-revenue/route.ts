import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

/**
 * GET /api/cashier/pending-revenue
 * 
 * Retorna o total de receita pendente (sessões em status OPEN)
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    // Busca todas as sessões OPEN (aguardando pagamento)
    const pendingSessions = await prisma.cashierSession.findMany({
      where: {
        salonId: salon.id,
        status: "OPEN",
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalPending = pendingSessions.reduce((sum, session) => sum + session.total, 0);
    const sessionCount = pendingSessions.length;

    return NextResponse.json({
      success: true,
      data: {
        totalPending,
        sessionCount,
        sessions: pendingSessions,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar receita pendente:", error);
    return NextResponse.json(
      { error: "Erro ao buscar receita pendente" },
      { status: 500 }
    );
  }
}
