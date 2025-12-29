import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      );
    }

    // Buscar usuário pelo token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Token inválido ou expirado" },
        { status: 400 }
      );
    }

    // Verificar se o token expirou
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: "Token expirado. Solicite uma nova redefinição de senha." },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e remover token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Senha redefinida com sucesso! Você já pode fazer login.",
    });
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha" },
      { status: 500 }
    );
  }
}
