import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.roleType !== "STAFF" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    const [commissions, totals] = await Promise.all([
      prisma.commission.findMany({
        where: { staffId: staffProfile.id },
        include: {
          service: { select: { name: true } },
          booking: {
            select: {
              date: true,
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),

      prisma.commission.groupBy({
        by: ["status"],
        where: { staffId: staffProfile.id },
        _sum: { calculatedValue: true },
      }),
    ]);

    const pending = totals.find((t) => t.status === "PENDING")?._sum.calculatedValue || 0;
    const paid = totals.find((t) => t.status === "PAID")?._sum.calculatedValue || 0;

    return NextResponse.json({
      commissions,
      totals: {
        pending,
        paid,
        total: pending + paid,
      },
    });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar comissões" }, { status: 500 });
  }
}
