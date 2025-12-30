import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

// GET - Obter configuração de comissão de um profissional
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "staffId é obrigatório" }, { status: 400 });
    }

    // Verificar se o profissional pertence ao salão
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        salonId: salon.id,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Buscar configuração de comissão
    const config = await prisma.staffCommissionConfig.findUnique({
      where: { staffId },
      include: {
        serviceOverrides: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(config || null);
  } catch (error) {
    console.error("Erro ao buscar configuração de comissão:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configuração" },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar configuração de comissão
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const { staffId, commissionType, percentageValue, fixedValue, serviceOverrides } = body;

    if (!staffId || !commissionType) {
      return NextResponse.json(
        { error: "staffId e commissionType são obrigatórios" },
        { status: 400 }
      );
    }

    // Validar tipo de comissão
    if (!["PERCENTAGE", "FIXED", "MIXED"].includes(commissionType)) {
      return NextResponse.json({ error: "Tipo de comissão inválido" }, { status: 400 });
    }

    // Validar valores conforme o tipo
    if (commissionType === "PERCENTAGE" && !percentageValue) {
      return NextResponse.json(
        { error: "percentageValue é obrigatório para comissão percentual" },
        { status: 400 }
      );
    }

    if (commissionType === "FIXED" && !fixedValue) {
      return NextResponse.json(
        { error: "fixedValue é obrigatório para comissão fixa" },
        { status: 400 }
      );
    }

    if (commissionType === "MIXED" && (!percentageValue || !fixedValue)) {
      return NextResponse.json(
        { error: "percentageValue e fixedValue são obrigatórios para comissão mista" },
        { status: 400 }
      );
    }

    // Verificar se o profissional pertence ao salão
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        salonId: salon.id,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Criar ou atualizar configuração
    const config = await prisma.staffCommissionConfig.upsert({
      where: { staffId },
      create: {
        staffId,
        commissionType,
        percentageValue: percentageValue || null,
        fixedValue: fixedValue || null,
      },
      update: {
        commissionType,
        percentageValue: percentageValue || null,
        fixedValue: fixedValue || null,
      },
    });

    // Se houver overrides de serviço, processar
    if (serviceOverrides && Array.isArray(serviceOverrides)) {
      // Deletar overrides anteriores
      await prisma.serviceCommissionConfig.deleteMany({
        where: { staffConfigId: config.id },
      });

      // Criar novos overrides
      if (serviceOverrides.length > 0) {
        await prisma.serviceCommissionConfig.createMany({
          data: serviceOverrides.map((override: any) => ({
            staffConfigId: config.id,
            serviceId: override.serviceId,
            commissionType: override.commissionType,
            percentageValue: override.percentageValue || null,
            fixedValue: override.fixedValue || null,
          })),
        });
      }
    }

    // Buscar configuração completa atualizada
    const updatedConfig = await prisma.staffCommissionConfig.findUnique({
      where: { id: config.id },
      include: {
        serviceOverrides: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error("Erro ao salvar configuração de comissão:", error);
    return NextResponse.json(
      { error: "Erro ao salvar configuração" },
      { status: 500 }
    );
  }
}

// DELETE - Remover configuração de comissão
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const salon = await getUserSalon();
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "staffId é obrigatório" }, { status: 400 });
    }

    // Verificar se o profissional pertence ao salão
    const staff = await prisma.staff.findFirst({
      where: {
        id: staffId,
        salonId: salon.id,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
    }

    // Deletar configuração (cascade deleta os overrides)
    await prisma.staffCommissionConfig.delete({
      where: { staffId },
    });

    return NextResponse.json({ message: "Configuração removida com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar configuração de comissão:", error);
    return NextResponse.json(
      { error: "Erro ao deletar configuração" },
      { status: 500 }
    );
  }
}
