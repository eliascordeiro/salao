import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/public/locations
 * Lista cidades e estados onde existem salões publicados
 * Útil para popular filtros de localização
 */
export async function GET(request: NextRequest) {
  try {
    // Buscar salões ativos com localização definida
    const salons = await prisma.salon.findMany({
      where: {
        active: true, // Apenas salões ativos
        AND: [
          { city: { not: null } },
          { state: { not: null } },
          { city: { not: "" } },
          { state: { not: "" } },
        ],
      },
      select: {
        city: true,
        state: true,
      },
      distinct: ["city", "state"],
      orderBy: [
        { state: "asc" },
        { city: "asc" },
      ],
    });
    
    // Agrupar por estado
    const locationsByState: Record<string, string[]> = {};
    const uniqueStates: string[] = [];
    const uniqueCities: string[] = [];
    
    salons.forEach((salon) => {
      const state = salon.state || "";
      const city = salon.city || "";
      
      if (!state || !city) return;
      
      // Adicionar estado se não existir
      if (!uniqueStates.includes(state)) {
        uniqueStates.push(state);
        locationsByState[state] = [];
      }
      
      // Adicionar cidade ao estado
      if (!locationsByState[state].includes(city)) {
        locationsByState[state].push(city);
        uniqueCities.push(city);
      }
    });
    
    // Ordenar cidades dentro de cada estado
    Object.keys(locationsByState).forEach((state) => {
      locationsByState[state].sort();
    });
    
    return NextResponse.json({
      success: true,
      data: {
        states: uniqueStates.sort(),
        cities: uniqueCities.sort(),
        byState: locationsByState,
      },
      meta: {
        totalStates: uniqueStates.length,
        totalCities: uniqueCities.length,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar localizações:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar localizações",
      },
      { status: 500 }
    );
  }
}
