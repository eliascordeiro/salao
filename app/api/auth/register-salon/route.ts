import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
    
    console.log("📝 Dados recebidos:", body);
    
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
      console.log("❌ Validação falhou: dados do proprietário incompletos");
      return NextResponse.json(
        {
          success: false,
          error: "Nome, email e senha do proprietário são obrigatórios",
        },
        { status: 400 }
      );
    }
    
    if (!salonName || !salonPhone || !salonAddress || !salonCity || !salonState) {
      console.log("❌ Validação falhou: dados do salão incompletos", {
        salonName: !!salonName,
        salonPhone: !!salonPhone,
        salonAddress: !!salonAddress,
        salonCity: !!salonCity,
        salonState: !!salonState,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Dados do salão incompletos",
        },
        { status: 400 }
      );
    }
    
    // Verificar se email já existe
    console.log("🔍 Verificando email:", ownerEmail);
    const existingUser = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });
    
    if (existingUser) {
      console.log("❌ Email já cadastrado");
      return NextResponse.json(
        {
          success: false,
          error: "Este email já está cadastrado",
        },
        { status: 400 }
      );
    }
    
    console.log("✅ Email disponível");
    
    // Testar conexão com o banco antes de prosseguir
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("✅ Conexão com banco OK");
    } catch (dbError) {
      console.error("❌ Erro de conexão com banco:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Erro de conexão com banco de dados",
          details: dbError instanceof Error ? dbError.message : "Erro desconhecido",
        },
        { status: 503 }
      );
    }
    
    // Hash da senha
    console.log("🔐 Gerando hash da senha...");
    const hashedPassword = await bcrypt.hash(ownerPassword, 10);
    
    console.log("💾 Iniciando transação...");
    // Criar usuário e salão em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar usuário proprietário primeiro
      console.log("👤 Criando usuário com dados:", {
        name: ownerName,
        email: ownerEmail,
        role: "ADMIN",
      });
      
      const user = await tx.user.create({
        data: {
          name: ownerName,
          email: ownerEmail,
          password: hashedPassword,
          role: "ADMIN", // Proprietários são ADMIN
        },
      });
      
      console.log("✅ Usuário criado:", user.id);
      
      // 2. Criar salão vinculado ao proprietário
      console.log("🏪 Criando salão com dados:", {
        name: salonName,
        phone: salonPhone,
        address: salonAddress,
        city: salonCity,
        state: salonState,
        zipCode: salonZipCode || null,
        ownerId: user.id,
      });
      
      const salon = await tx.salon.create({
        data: {
          name: salonName,
          phone: salonPhone,
          address: salonAddress,
          city: salonCity,
          state: salonState,
          zipCode: salonZipCode || null,
          description: salonDescription || null,
          // Valores padrão para campos obrigatórios
          openTime: "09:00",
          closeTime: "18:00",
          workDays: "1,2,3,4,5", // Segunda a Sexta
          active: true, // Salão começa ativo
          // Salão criado começa não publicado (owner precisa completar cadastro)
          publishedAt: null,
          // Vincular ao proprietário
          ownerId: user.id,
        },
      });
      
      console.log("✅ Salão criado:", salon.id);
      
      return { user, salon };
    });
    
    console.log("✅ Transação concluída com sucesso!");
    
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
    
    // Log detalhado para debug
    if (error instanceof Error) {
      console.error("Tipo do erro:", error.constructor.name);
      console.error("Mensagem:", error.message);
      console.error("Stack:", error.stack);
    }
    
    // Verificar se é erro do Prisma
    const isPrismaError = error && typeof error === 'object' && 'code' in error;
    if (isPrismaError) {
      console.error("Código Prisma:", (error as any).code);
      console.error("Meta:", (error as any).meta);
    }
    
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao criar cadastro. Tente novamente.",
        details: error instanceof Error ? error.message : "Erro desconhecido",
        prismaCode: isPrismaError ? (error as any).code : undefined,
      },
      { status: 500 }
    );
  }
}
