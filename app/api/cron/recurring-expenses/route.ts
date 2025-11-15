import { NextRequest, NextResponse } from "next/server";
import { processRecurringExpenses } from "@/lib/recurring-expenses";

/**
 * POST /api/cron/recurring-expenses
 * Processa despesas recorrentes e cria novas automaticamente
 * 
 * Este endpoint deve ser chamado diariamente por um cron job
 * Ex: Vercel Cron, Railway Cron, ou cron externo
 * 
 * Autenticação: Requer token secreto no header
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação (token secreto)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "change-me-in-production";

    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Invalid or missing cron secret",
        },
        { status: 401 }
      );
    }

    console.log("🔐 Autenticação bem-sucedida, iniciando processamento...");

    // Executar processamento de despesas recorrentes
    const result = await processRecurringExpenses();

    // Log detalhado
    console.log("\n📊 Resultado do processamento:");
    console.log(`   ✅ Processadas: ${result.processed}`);
    console.log(`   ✅ Criadas: ${result.created}`);
    console.log(`   ❌ Erros: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.error("\n❌ Erros encontrados:");
      result.errors.forEach((error, index) => {
        console.error(`   ${index + 1}. ${error}`);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Despesas recorrentes processadas com sucesso",
      data: {
        processed: result.processed,
        created: result.created,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ Erro ao processar despesas recorrentes:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar despesas recorrentes",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/recurring-expenses
 * Informações sobre o cron job (apenas para debug)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Cron job de despesas recorrentes",
    info: {
      description: "Processa despesas recorrentes diariamente",
      method: "POST",
      authentication: "Bearer token via CRON_SECRET env var",
      frequency: "Diário (recomendado às 00:00)",
      example: {
        curl: 'curl -X POST https://seu-dominio.com/api/cron/recurring-expenses -H "Authorization: Bearer YOUR_SECRET"',
      },
    },
  });
}
