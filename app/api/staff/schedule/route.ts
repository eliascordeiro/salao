import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API para atualizar horários de trabalho do profissional
 * PATCH /api/staff/schedule
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

    // Verificar se o profissional tem permissão para editar
    if (!staffProfile.canEditSchedule) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar seus horários. Contate o administrador." },
        { status: 403 }
      );
    }

    const { workDays, workStart, workEnd, lunchStart, lunchEnd } =
      await request.json();

    // Validações
    if (!workDays || workDays.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um dia de trabalho" },
        { status: 400 }
      );
    }

    if (!workStart || !workEnd) {
      return NextResponse.json(
        { error: "Horário de início e término são obrigatórios" },
        { status: 400 }
      );
    }

    // Converter array de workDays para string CSV
    const workDaysString = Array.isArray(workDays) ? workDays.join(',') : workDays;

    // Atualizar horários
    const updatedStaff = await prisma.staff.update({
      where: { id: staffProfile.id },
      data: {
        workDays: workDaysString,
        workStart,
        workEnd,
        lunchStart: lunchStart || null,
        lunchEnd: lunchEnd || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Horários atualizados com sucesso",
      staff: updatedStaff,
    });
  } catch (error) {
    console.error("Erro ao atualizar horários:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar horários" },
      { status: 500 }
    );
  }
}
