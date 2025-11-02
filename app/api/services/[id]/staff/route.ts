import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const serviceId = params.id;

    // Buscar profissionais associados a este serviço
    const serviceStaff = await prisma.serviceStaff.findMany({
      where: {
        serviceId: serviceId,
      },
      select: {
        staff: {
          select: {
            id: true,
            name: true,
            specialty: true,
            active: true,
          },
        },
      },
    });

    // Extrair apenas os dados dos profissionais
    const staff = serviceStaff.map((ss) => ({
      id: ss.staff.id,
      name: ss.staff.name,
      specialty: ss.staff.specialty,
      isActive: ss.staff.active,
    }));

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Erro ao buscar profissionais do serviço:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissionais do serviço" },
      { status: 500 }
    );
  }
}
