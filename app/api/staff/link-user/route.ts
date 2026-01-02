import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * API para configurar acesso ao portal para um profissional
 * POST /api/staff/link-user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Verificar permissão de gestão de profissionais
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

    const { staffId, email, phone, name, isActive } = await request.json();

    if (!staffId || !email) {
      return NextResponse.json(
        { error: "staffId e email são obrigatórios" },
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

    // Gerar senha temporária aleatória (será redefinida pelo profissional via "Esqueci senha")
    const temporaryPassword = crypto.randomBytes(16).toString('hex');

    // Criar usuário e vincular ao profissional
    const user = await prisma.user.create({
      data: {
        email,
        password: temporaryPassword, // Senha temporária - profissional deve usar "Esqueci senha"
        name: name || staff.name,
        phone: phone || null,
        role: "STAFF",
        roleType: "STAFF",
        active: isActive ?? true,
      },
    });

    // Vincular usuário ao profissional e atualizar dados
    await prisma.staff.update({
      where: { id: staffId },
      data: { 
        userId: user.id,
        email: email,
        phone: phone || staff.phone,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Acesso configurado com sucesso. O profissional deve usar 'Esqueci minha senha' para definir sua senha.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Erro ao configurar acesso:", error);
    return NextResponse.json(
      { error: "Erro ao configurar acesso" },
      { status: 500 }
    );
  }
}

/**
 * API para atualizar status ativo/inativo do acesso
 * PATCH /api/staff/link-user
 */
export async function PATCH(request: NextRequest) {
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

    const { staffId, isActive } = await request.json();

    if (!staffId || isActive === undefined) {
      return NextResponse.json(
        { error: "staffId e isActive são obrigatórios" },
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

    // Atualizar status do usuário
    await prisma.user.update({
      where: { id: staff.userId },
      data: { active: isActive },
    });

    return NextResponse.json({
      success: true,
      message: isActive ? "Acesso ativado com sucesso" : "Acesso desativado com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status" },
      { status: 500 }
    );
  }
}

/**
 * API para remover acesso ao portal (desvincular conta)
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
      data: { active: false },
    });

    return NextResponse.json({
      success: true,
      message: "Acesso removido com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover acesso:", error);
    return NextResponse.json(
      { error: "Erro ao remover acesso" },
      { status: 500 }
    );
  }
}
      { status: 500 }
    );
  }
}
