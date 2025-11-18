import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

/**
 * GET /api/public/salons
 * Lista todos os salões ativos/publicados (acesso público)
 * 
 * Query params:
 * - city: filtrar por cidade
 * - state: filtrar por estado
 * - service: filtrar por serviço (nome ou ID)
 * - featured: apenas salões em destaque (true/false)
 * - verified: apenas salões verificados (true/false)
 * - sort: ordenação (rating, newest, name)
 * - limit: quantidade de resultados (padrão 20)
 * - page: página para paginação (padrão 1)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Filtros da query
    const city = searchParams.get("city");
    const state = searchParams.get("state");
    const service = searchParams.get("service");
    const featured = searchParams.get("featured") === "true";
    const verified = searchParams.get("verified") === "true";
    const sort = searchParams.get("sort") || "rating"; // rating, newest, name
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    
    // Construir where clause
    const where: any = {
      // Apenas salões ativos (visíveis na plataforma)
      active: true,
    };
    
    // Filtro por localização
    if (city) where.city = city;
    if (state) where.state = state;
    
    // Filtro por featured/verified
    if (featured) where.featured = true;
    if (verified) where.verified = true;
    
    // Filtro por serviço (busca no nome do serviço)
    if (service) {
      where.services = {
        some: {
          OR: [
            { name: { contains: service, mode: "insensitive" } },
            { id: service }, // Suporta busca por ID também
          ],
        },
      };
    }
    
    // Ordenação
    let orderBy: any = {};
    switch (sort) {
      case "newest":
        orderBy = { publishedAt: "desc" };
        break;
      case "name":
        orderBy = { name: "asc" };
        break;
      case "rating":
      default:
        orderBy = [
          { rating: "desc" },
          { reviewsCount: "desc" },
        ];
        break;
    }
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Buscar salões
    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          latitude: true,
          longitude: true,
          description: true,
          coverPhoto: true,
          photos: true,
          rating: true,
          reviewsCount: true,
          featured: true,
          verified: true,
          specialties: true,
          publishedAt: true,
          // Contadores
          _count: {
            select: {
              services: true,
              staff: true,
            },
          },
        },
      }),
      prisma.salon.count({ where }),
    ]);
    
    // Calcular metadados de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      success: true,
      data: salons,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar salões:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar salões",
      },
      { status: 500 }
    );
  }
}
