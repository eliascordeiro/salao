import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalon } from "@/lib/salon-helper";
import { v2 as cloudinary } from "cloudinary";

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Forçar Node Runtime para permitir upload
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

    // Converter para base64 e fazer upload para Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload para Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: 'salao/covers',
      public_id: `${salon.id}-${Date.now()}`,
      overwrite: true,
      resource_type: 'image',
    });

    const coverPhotoUrl = uploadResponse.secure_url;

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

    // Se tiver foto no Cloudinary, deletar
    if (salon.coverPhoto && salon.coverPhoto.includes('cloudinary.com')) {
      try {
        // Extrair public_id da URL do Cloudinary
        const urlParts = salon.coverPhoto.split('/');
        const publicIdWithExt = urlParts.slice(-2).join('/'); // Ex: "salao/covers/id-timestamp.jpg"
        const publicId = publicIdWithExt.split('.')[0]; // Remove extensão
        
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error('Erro ao deletar do Cloudinary:', err);
        // Continua mesmo se falhar (pode já ter sido deletado)
      }
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
