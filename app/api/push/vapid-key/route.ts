import { NextRequest, NextResponse } from "next/server";
import { pushEnabled } from "@/lib/push";

// GET /api/push/vapid-key — retorna a chave pública VAPID para o cliente
export async function GET(_req: NextRequest) {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey || !pushEnabled()) {
    return NextResponse.json(
      { error: "Push notifications não configuradas" },
      { status: 503 }
    );
  }

  return NextResponse.json({ publicKey });
}
