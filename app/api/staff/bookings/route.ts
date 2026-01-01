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

    const bookings = await prisma.booking.findMany({
      where: { staffId: staffProfile.id },
      include: {
        service: { select: { name: true, duration: true } },
        client: { select: { name: true, phone: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Erro:", error);
    return NextResponse.json({ error: "Erro ao buscar agendamentos" }, { status: 500 });
  }
}
