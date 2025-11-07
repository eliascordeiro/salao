import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/register-salon
 * Cria conta de proprietário (ADMIN) e salão simultaneamente
 * 
 * Body:
 * - ownerName, ownerEmail, ownerPassword (dados do proprietário)
 * - salonName, salonPhone, salonAddress, salonCity, salonState, salonZipCode, salonDescription
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      // Dados do proprietário
      ownerName,
      ownerEmail,
      ownerPassword,
      // Dados do salão
      salonName,
      salonPhone,
      salonAddress,
      salonCity,
      salonState,
      salonZipCode,
      salonDescription,
    } = body;
    
    // Validações
    if (!ownerName || !ownerEmail || !ownerPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome, email e senha do proprietário são obrigatórios",
        },
        { status: 400 }
      );
    }
    
    if (!salonName || !salonPhone || !salonAddress || !salonCity || !salonState) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados do salão incompletos",
        },
        { status: 400 }
      );
    }
    
    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Este email já está cadastrado",
        },
        { status: 400 }
      );
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    
    // Criar usuário e salão em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar salão
      const salon = await tx.salon.create({
        data: {
          name: salonName,
          phone: salonPhone,
          address: salonAddress,
          city: salonCity,
          state: salonState,
          zipCode: salonZipCode || null,
          description: salonDescription || null,
          // Salão criado começa não publicado (owner precisa completar cadastro)
          publishedAt: null,
        },
      });
      
      // 2. Criar usuário proprietário vinculado ao salão
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          role: "ADMIN", // Proprietários são ADMIN
          salonId: salon.id,
        },
      });
      
      return { user, salon };
    });
    
    // TODO: Enviar email de boas-vindas
    // await sendWelcomeEmail(result.user.email, result.user.name, result.salon.name);
    
    return NextResponse.json({
      success: true,
      message: "Cadastro criado com sucesso!",
      data: {
        userId: result.user.id,
        salonId: result.salon.id,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar cadastro:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar cadastro. Tente novamente.",
      },
      { status: 500 }
    );
  }
}
