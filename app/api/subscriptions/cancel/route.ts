import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Cancela assinatura recorrente no Mercado Pago
 * POST /api/subscriptions/cancel
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Buscar salão do usuário
    const salon = await prisma.salon.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Buscar assinatura
    const subscription = await prisma.subscription.findUnique({
      where: { salonId: salon.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 404 }
      );
    }

    if (subscription.status === 'CANCELED') {
      return NextResponse.json(
        { error: "Assinatura já está cancelada" },
        { status: 400 }
      );
    }

    // Cancelar no Mercado Pago (se tiver ID)
    if (subscription.mpSubscriptionId) {
      console.log("🔄 Cancelando assinatura no MP:", subscription.mpSubscriptionId);

      const response = await fetch(
        `https://api.mercadopago.com/preapproval/${subscription.mpSubscriptionId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
          },
          body: JSON.stringify({
            status: 'cancelled',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Erro ao cancelar no MP:", error);
        // Continua mesmo se falhar no MP (pode já estar cancelada)
      } else {
        console.log("✅ Assinatura cancelada no MP");
      }
    }

    // Atualizar no banco
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    console.log("✅ Assinatura cancelada no banco:", subscription.id);

    return NextResponse.json({
      success: true,
      message: "Assinatura cancelada com sucesso",
    });

  } catch (error: any) {
    console.error("❌ Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
