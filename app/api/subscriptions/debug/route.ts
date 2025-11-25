import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 DEBUG: Iniciando debug da API");
    
    const session = await getServerSession(authOptions);
    console.log("🔍 DEBUG: Session:", session ? "Existe" : "Não existe");
    console.log("🔍 DEBUG: User ID:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: "Não autorizado",
        debug: { session: null }
      }, { status: 401 });
    }

    // Testar conexão com banco
    console.log("🔍 DEBUG: Tentando conectar ao banco...");
    await prisma.$connect();
    console.log("✅ DEBUG: Conectado ao banco");

    // Buscar salão
    console.log("🔍 DEBUG: Buscando salão para userId:", session.user.id);
    const salon = await prisma.salon.findFirst({
      where: {
        ownerId: session.user.id,
      },
    });
    console.log("🔍 DEBUG: Salão encontrado:", salon ? salon.id : "Não encontrado");

    if (!salon) {
      return NextResponse.json({ 
        debug: {
          userId: session.user.id,
          salonFound: false,
          message: "Usuário não tem salão cadastrado"
        }
      }, { status: 200 });
    }

    // Buscar subscription
    console.log("🔍 DEBUG: Buscando subscription para salonId:", salon.id);
    const subscription = await prisma.subscription.findUnique({
      where: {
        salonId: salon.id,
      },
      include: {
        plan: true,
      },
    });
    console.log("🔍 DEBUG: Subscription encontrada:", subscription ? subscription.id : "Não encontrada");

    return NextResponse.json({
      debug: {
        userId: session.user.id,
        salonFound: true,
        salonId: salon.id,
        salonName: salon.name,
        subscriptionFound: !!subscription,
        subscriptionId: subscription?.id,
        planName: subscription?.plan?.name,
      }
    });

  } catch (error) {
    console.error("❌ DEBUG ERROR:", error);
    return NextResponse.json({
      error: "Erro no debug",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
