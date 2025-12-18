import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// API para migração manual SQL
// DELETE ESTE ARQUIVO APÓS USAR!
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== "migrate-now-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Executando migração SQL manual...");

    // Step 1: Adicionar featuresList (backup)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Plan" 
      ADD COLUMN IF NOT EXISTS "featuresList" TEXT[] DEFAULT ARRAY[]::TEXT[];
    `);
    console.log("✅ Coluna featuresList criada");

    // Step 2: Copiar dados existentes
    await prisma.$executeRawUnsafe(`
      UPDATE "Plan" SET "featuresList" = "features" WHERE "featuresList" IS NULL OR array_length("featuresList", 1) IS NULL;
    `);
    console.log("✅ Dados copiados para featuresList");

    // Step 3: Adicionar features_new (JSON)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Plan" 
      ADD COLUMN IF NOT EXISTS "features_new" JSONB;
    `);
    console.log("✅ Coluna features_new criada");

    // Step 4: Migrar dados para JSON baseado no slug
    await prisma.$executeRawUnsafe(`
      UPDATE "Plan" SET "features_new" = 
        CASE 
          WHEN "slug" = 'essencial' THEN '{"email": true, "basicReports": true, "geolocation": true, "maxStaff": 2}'::jsonb
          WHEN "slug" = 'profissional' THEN '{"email": true, "whatsapp": true, "basicReports": true, "advancedReports": true, "geolocation": true, "maps": true, "multiUser": true, "aiChat": true, "prioritySupport": true}'::jsonb
          ELSE '{"email": true}'::jsonb
        END
      WHERE "features_new" IS NULL;
    `);
    console.log("✅ Dados convertidos para JSON");

    // Step 5: Dropar coluna antiga
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Plan" DROP COLUMN IF EXISTS "features";
    `);
    console.log("✅ Coluna features antiga removida");

    // Step 6: Renomear features_new para features
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Plan" RENAME COLUMN "features_new" TO "features";
    `);
    console.log("✅ Coluna renomeada");

    // Step 7: Tornar NOT NULL
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Plan" ALTER COLUMN "features" SET NOT NULL;
    `);
    console.log("✅ Coluna features configurada como NOT NULL");

    // Verificar resultado
    const plans = await prisma.plan.findMany();
    console.log("✅ Planos após migração:", plans);

    return NextResponse.json({
      success: true,
      message: "Migração SQL executada com sucesso!",
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        features: p.features,
        featuresList: p.featuresList,
      })),
    });
  } catch (error: any) {
    console.error("❌ Erro na migração SQL:", error);
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
