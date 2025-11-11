import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";

// Forçar Node Runtime para permitir acesso ao sistema de arquivos
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar salão do usuário usando helper
    const salon = await getUserSalon();

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Processar upload
    const formData = await request.formData();
    const file = formData.get("coverPhoto") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      );
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Arquivo deve ser uma imagem" },
        { status: 400 }
      );
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Arquivo muito grande. Máximo 5MB" },
        { status: 400 }
      );
    }

    // Converter File para Buffer e salvar
    const { writeFile, mkdir } = await import("fs/promises");
    const { join } = await import("path");
    const { existsSync } = await import("fs");

    const uploadsDir = join(process.cwd(), "public", "uploads", "covers");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${salon.id}-${Date.now()}.${ext}`;
    const filePath = join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const coverPhotoUrl = `/uploads/covers/${fileName}`;

    // Atualizar banco de dados
    await prisma.salon.update({
      where: { id: salon.id },
      data: { coverPhoto: coverPhotoUrl },
    });

    return NextResponse.json({
      success: true,
      coverPhotoUrl,
    });
  } catch (error: any) {
    console.error("Erro ao fazer upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao fazer upload" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    // Buscar salão do usuário usando helper
    const salon = await getUserSalon();

    if (!salon) {
      return NextResponse.json(
        { error: "Salão não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar banco de dados (remover foto)
    await prisma.salon.update({
      where: { id: salon.id },
      data: { coverPhoto: null },
    });

    return NextResponse.json({
      success: true,
      message: "Foto de capa removida com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao remover foto:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao remover foto" },
      { status: 500 }
    );
  }
}
