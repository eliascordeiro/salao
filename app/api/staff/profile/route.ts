import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

/**
 * API para obter dados do perfil do profissional logado
 * GET /api/staff/profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se é staff
    if (session.user.roleType !== "STAFF" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar perfil do staff
    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(staffProfile);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

/**
 * API para atualizar dados do perfil do profissional
 * PATCH /api/staff/profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar se é staff
    if (session.user.roleType !== "STAFF" && session.user.role !== "STAFF") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Buscar perfil do staff
    const staffProfile = await prisma.staff.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json(
        { error: "Perfil não encontrado" },
        { status: 404 }
      );
    }

    const { name, email, phone, specialty } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Atualizar dados do staff
    const updatedStaff = await prisma.staff.update({
      where: { id: staffProfile.id },
      data: {
        name: name.trim(),
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
      },
    });

    // Se o nome mudou, atualizar também no User
    if (name.trim() !== staffProfile.name) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name: name.trim() },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
