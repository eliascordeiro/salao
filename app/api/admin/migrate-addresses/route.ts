import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API para migrar endereços de salões
 * Converte campo único 'address' em campos separados (street, number, neighborhood, etc)
 * 
 * Acesso: Apenas OWNER ou ADMIN
 * Método: POST
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    // Verificar autorização
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas OWNER pode executar (segurança)
    if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
      return NextResponse.json({ 
        error: "Apenas proprietários podem executar esta migração" 
      }, { status: 403 });
    }

    console.log("🔧 Iniciando migração de endereços...");
    console.log("👤 Usuário:", session.user.email);

    // Buscar salões que precisam de migração
    const salons = await prisma.salon.findMany({
      where: {
        AND: [
          { street: null }, // Sem campos separados
          { address: { not: null } } // Mas com endereço completo
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        street: true,
        number: true,
        neighborhood: true,
        city: true,
        state: true,
        zipCode: true,
      }
    });

    console.log(`📊 Salões encontrados para migrar: ${salons.length}`);

    const results = {
      total: salons.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      details: [] as any[]
    };

    for (const salon of salons) {
      try {
        console.log(`\n🔄 Processando: ${salon.name}`);
        console.log(`   Endereço: ${salon.address}`);

        // Parsear endereço
        const parsed = parseAddress(salon.address!);

        if (!parsed.street) {
          console.log(`   ⚠️  Não foi possível extrair rua do endereço`);
          results.skipped++;
          results.details.push({
            salonId: salon.id,
            salonName: salon.name,
            status: "skipped",
            reason: "Não foi possível parsear endereço"
          });
          continue;
        }

        // Atualizar salão
        await prisma.salon.update({
          where: { id: salon.id },
          data: {
            street: parsed.street,
            number: parsed.number || null,
            neighborhood: parsed.neighborhood || null,
            // Manter city/state se já existirem
            ...(salon.city ? {} : { city: parsed.city || null }),
            ...(salon.state ? {} : { state: parsed.state || null }),
          }
        });

        console.log(`   ✅ Atualizado com sucesso`);
        results.updated++;
        results.details.push({
          salonId: salon.id,
          salonName: salon.name,
          status: "success",
          extracted: {
            street: parsed.street,
            number: parsed.number,
            neighborhood: parsed.neighborhood,
            city: parsed.city,
            state: parsed.state,
          }
        });

      } catch (error) {
        console.error(`   ❌ Erro ao atualizar salão ${salon.name}:`, error);
        results.errors++;
        results.details.push({
          salonId: salon.id,
          salonName: salon.name,
          status: "error",
          error: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }

    console.log("\n📈 Resumo da migração:");
    console.log(`   ✅ Atualizados: ${results.updated}`);
    console.log(`   ⏭️  Pulados: ${results.skipped}`);
    console.log(`   ❌ Erros: ${results.errors}`);
    console.log(`   📊 Total: ${results.total}`);

    return NextResponse.json({
      message: "Migração concluída",
      ...results
    });

  } catch (error) {
    console.error("❌ Erro na migração de endereços:", error);
    return NextResponse.json(
      { 
        error: "Erro ao executar migração",
        details: error instanceof Error ? error.message : "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}

/**
 * Parseia um endereço em formato completo para campos separados
 */
function parseAddress(address: string) {
  const result = {
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: ''
  };

  try {
    address = address.trim();

    // Formato: "Rua X, 123 - Bairro - Cidade/UF"
    if (address.includes(',')) {
      const parts = address.split(',');
      result.street = parts[0].trim();
      
      const rest = parts.slice(1).join(',').trim();
      
      // Extrair número
      const numberMatch = rest.match(/^(\d+[A-Za-z]?)\b/);
      if (numberMatch) {
        result.number = numberMatch[1];
        const afterNumber = rest.substring(numberMatch[0].length).trim();
        
        if (afterNumber.startsWith('-')) {
          const segments = afterNumber.substring(1).split('-').map(s => s.trim());
          
          if (segments.length >= 1) {
            result.neighborhood = segments[0];
          }
          
          if (segments.length >= 2) {
            const lastSegment = segments[segments.length - 1];
            if (lastSegment.includes('/')) {
              const [city, state] = lastSegment.split('/').map(s => s.trim());
              result.city = city;
              result.state = state;
            } else {
              result.city = lastSegment;
            }
          }
        }
      }
    } 
    // Formato: "Rua X - Bairro - Cidade/UF"
    else if (address.includes(' - ')) {
      const segments = address.split(' - ').map(s => s.trim());
      
      if (segments.length >= 1) result.street = segments[0];
      if (segments.length >= 2) result.neighborhood = segments[1];
      
      if (segments.length >= 3) {
        const lastSegment = segments[2];
        if (lastSegment.includes('/')) {
          const [city, state] = lastSegment.split('/').map(s => s.trim());
          result.city = city;
          result.state = state;
        } else {
          result.city = lastSegment;
        }
      }
    }
    // Formato simples: apenas rua
    else {
      result.street = address;
    }

  } catch (error) {
    console.error('Erro ao parsear endereço:', error);
  }

  return result;
}

/**
 * GET - Verificar status da migração (quantos salões precisam)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Contar salões que precisam de migração
    const needsMigration = await prisma.salon.count({
      where: {
        AND: [
          { street: null },
          { address: { not: null } }
        ]
      }
    });

    // Contar salões já migrados
    const alreadyMigrated = await prisma.salon.count({
      where: {
        street: { not: null }
      }
    });

    return NextResponse.json({
      needsMigration,
      alreadyMigrated,
      total: needsMigration + alreadyMigrated,
      message: needsMigration > 0 
        ? `${needsMigration} salão(ões) precisam de migração`
        : "Todos os salões já foram migrados!"
    });

  } catch (error) {
    console.error("Erro ao verificar status:", error);
    return NextResponse.json(
      { error: "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
