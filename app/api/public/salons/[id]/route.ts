import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/public/salons/[id]
 * Retorna detalhes completos de um salão (acesso público)
 * Inclui: informações básicas, serviços, profissionais, estatísticas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Buscar salão com todos os detalhes
    const salon = await prisma.salon.findUnique({
      where: {
        id,
        // Apenas salões publicados
        publishedAt: {
          not: null,
        },
      },
      include: {
        // Serviços ativos
        services: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            active: true,
            _count: {
              select: {
                staff: true, // Quantos profissionais oferecem este serviço
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        // Profissionais ativos
        staff: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            specialty: true,
            active: true,
            _count: {
              select: {
                services: true, // Quantos serviços este profissional oferece
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        },
        // Reviews recentes (últimas 5)
        reviews: {
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
    
    // Verificar se salão existe e está publicado
    if (!salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Salão não encontrado ou não está disponível",
        },
        { status: 404 }
      );
    }
    
    // Calcular estatísticas adicionais
    const stats = {
      totalServices: salon.services.length,
      totalStaff: salon.staff.length,
      totalReviews: salon.reviewsCount,
      averageRating: salon.rating,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        ...salon,
        stats,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar detalhes do salão:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar detalhes do salão",
      },
      { status: 500 }
    );
  }
}
