import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * API para criar/vincular conta de usuário a um profissional
 * POST /api/staff/link-user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar permissão de gestão de profissionais
    // OWNER tem acesso total, outros precisam de permissão específica
    const hasPermission = 
      session.user.roleType === "OWNER" ||
      session.user.permissions?.includes("staff.manage") ||
      session.user.permissions?.includes("users.manage");
    
    if (!hasPermission) {
      console.error("Permissão negada para:", {
        roleType: session.user.roleType,
        permissions: session.user.permissions,
      });
      return NextResponse.json({ error: "Sem permissão para gerenciar profissionais" }, { status: 403 });
    }

    const { staffId, email, password, name } = await request.json();

    if (!staffId || !email || !password) {
      return NextResponse.json(
        { error: "staffId, email e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se profissional existe
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: { user: true },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se já tem usuário vinculado
    if (staff.userId) {
      return NextResponse.json(
        { error: "Este profissional já possui uma conta vinculada" },
        { status: 400 }
      );
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário e vincular ao profissional
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || staff.name,
        role: "STAFF",
        roleType: "STAFF",
        isActive: true,
      },
    });

    // Vincular usuário ao profissional
    await prisma.staff.update({
      where: { id: staffId },
      data: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      message: "Conta criada e vinculada com sucesso",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Erro ao vincular usuário:", error);
    return NextResponse.json(
      { error: "Erro ao criar conta" },
      { status: 500 }
    );
  }
}

/**
 * API para desvincular conta de usuário de um profissional
 * DELETE /api/staff/link-user?staffId=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar permissão
    const hasPermission = 
      session.user.roleType === "OWNER" ||
      session.user.permissions?.includes("staff.manage") ||
      session.user.permissions?.includes("users.manage");
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Sem permissão para gerenciar profissionais" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json(
        { error: "staffId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar profissional
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
    });

    if (!staff) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 }
      );
    }

    if (!staff.userId) {
      return NextResponse.json(
        { error: "Este profissional não possui conta vinculada" },
        { status: 400 }
      );
    }

    // Desvincular (opcional: deletar usuário também)
    await prisma.staff.update({
      where: { id: staffId },
      data: { userId: null },
    });

    // Desativar usuário em vez de deletar
    await prisma.user.update({
      where: { id: staff.userId },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Conta desvinculada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao desvincular usuário:", error);
    return NextResponse.json(
      { error: "Erro ao desvincular conta" },
      { status: 500 }
    );
  }
}
