import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// API para forçar migração manualmente
// DELETE ESTE ARQUIVO APÓS USAR!
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Proteção básica
  if (secret !== "migrate-now-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("🔄 Forçando migração...");

    // Tentar migrate deploy
    try {
      const { stdout: migrateOut, stderr: migrateErr } = await execAsync(
        "npx prisma migrate deploy"
      );
      console.log("✅ Migrate deploy:", migrateOut);
      if (migrateErr) console.error("⚠️ Migrate stderr:", migrateErr);
    } catch (error: any) {
      console.error("❌ Migrate deploy falhou:", error.message);
    }

    // Forçar db push como fallback
    console.log("🔄 Executando db push...");
    const { stdout, stderr } = await execAsync(
      "npx prisma db push --accept-data-loss --skip-generate"
    );

    console.log("✅ DB Push output:", stdout);
    if (stderr) console.error("⚠️ DB Push stderr:", stderr);

    // Regenerar client
    console.log("🔄 Regenerando Prisma Client...");
    const { stdout: genOut } = await execAsync("npx prisma generate");
    console.log("✅ Generate output:", genOut);

    return NextResponse.json({
      success: true,
      message: "Migração executada com sucesso!",
      details: {
        migrate: migrateErr || "OK",
        push: stdout,
        generate: genOut,
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao forçar migração:", error);
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
