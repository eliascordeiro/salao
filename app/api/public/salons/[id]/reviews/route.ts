import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/public/salons/[id]/reviews
 * Lista todas as avaliações de um salão (acesso público)
 * 
 * Query params:
 * - sort: ordenação (newest, oldest, highest, lowest)
 * - rating: filtrar por nota específica (1-5)
 * - limit: quantidade de resultados (padrão 10)
 * - page: página para paginação (padrão 1)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    
    // Verificar se salão existe e está publicado
    const salon = await prisma.salon.findUnique({
      where: {
        id,
        publishedAt: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        rating: true,
        reviewsCount: true,
      },
    });
    
    if (!salon) {
      return NextResponse.json(
        {
          success: false,
          error: "Salão não encontrado ou não está disponível",
        },
        { status: 404 }
      );
    }
    
    // Parâmetros de busca
    const sort = searchParams.get("sort") || "newest"; // newest, oldest, highest, lowest
    const ratingFilter = searchParams.get("rating");
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    
    // Construir where clause
    const where: any = {
      salonId: id,
    };
    
    // Filtro por rating específico
    if (ratingFilter) {
      const rating = parseInt(ratingFilter);
      if (rating >= 1 && rating <= 5) {
        where.rating = rating;
      }
    }
    
    // Ordenação
    let orderBy: any = {};
    switch (sort) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = { rating: "desc" };
        break;
      case "lowest":
        orderBy = { rating: "asc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Buscar reviews
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
            },
          },
          booking: {
            select: {
              scheduledDate: true,
              service: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);
    
    // Calcular distribuição de ratings (estatísticas)
    const ratingDistribution = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        salonId: id,
      },
      _count: {
        rating: true,
      },
    });
    
    // Formatar distribuição como objeto {1: count, 2: count, ...}
    const distribution = ratingDistribution.reduce((acc: any, curr) => {
      acc[curr.rating] = curr._count.rating;
      return acc;
    }, {});
    
    // Preencher ratings faltantes com 0
    for (let i = 1; i <= 5; i++) {
      if (!distribution[i]) distribution[i] = 0;
    }
    
    // Metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      success: true,
      data: reviews,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
      stats: {
        salonName: salon.name,
        averageRating: salon.rating,
        totalReviews: salon.reviewsCount,
        distribution,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar avaliações:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar avaliações",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public/salons/[id]/reviews
 * Criar uma nova avaliação (requer autenticação)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Autenticação necessária" },
        { status: 401 }
      );
    }

    const { id: salonId } = params;
    const body = await request.json();
    const { bookingId, rating, comment } = body;

    // Validações
    if (!bookingId || !rating) {
      return NextResponse.json(
        { error: "bookingId e rating são obrigatórios" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating deve ser entre 1 e 5" },
        { status: 400 }
      );
    }

    // Verificar se booking existe e pertence ao usuário
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { salon: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Você não tem permissão para avaliar este agendamento" },
        { status: 403 }
      );
    }

    if (booking.salonId !== salonId) {
      return NextResponse.json(
        { error: "Agendamento não pertence a este salão" },
        { status: 400 }
      );
    }

    // Verificar se já existe avaliação para este booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Você já avaliou este agendamento" },
        { status: 400 }
      );
    }

    // Criar avaliação
    const review = await prisma.review.create({
      data: {
        bookingId,
        userId: session.user.id,
        salonId,
        rating,
        comment: comment || "",
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Atualizar rating e reviewsCount do salão
    const allReviews = await prisma.review.findMany({
      where: { salonId },
      select: { rating: true },
    });

    const totalReviews = allReviews.length;
    const averageRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

    await prisma.salon.update({
      where: { id: salonId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // arredondar para 1 casa decimal
        reviewsCount: totalReviews,
      },
    });

    return NextResponse.json({
      success: true,
      data: review,
      message: "Avaliação criada com sucesso",
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Erro ao criar avaliação:", error);
    return NextResponse.json(
      { error: "Erro ao criar avaliação" },
      { status: 500 }
    );
  }
}
