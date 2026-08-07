import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { setTyping, isOtherPartyTyping } from "@/lib/chat";

async function getAuthorizedConversation(conversationId: string, session: any) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, salonId: true, clientId: true },
  });
  if (!conversation) return { conversation: null, role: null as null };

  if (conversation.clientId === session.user.id) {
    return { conversation, role: "CLIENT" as const };
  }

  const salonId = session.user.salonId;
  if (salonId && salonId === conversation.salonId) {
    return { conversation, role: "ADMIN" as const };
  }

  return { conversation: null, role: null };
}

// GET /api/chat/conversations/[id]/typing — indica se o outro lado está digitando
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { conversation, role } = await getAuthorizedConversation(params.id, session);
    if (!conversation || !role) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    const typing = await isOtherPartyTyping(conversation.id, role);
    return NextResponse.json({ typing });
  } catch (error) {
    console.error("Erro ao verificar digitação:", error);
    return NextResponse.json({ error: "Erro ao verificar digitação" }, { status: 500 });
  }
}

// POST /api/chat/conversations/[id]/typing — sinaliza que o remetente está digitando
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { conversation, role } = await getAuthorizedConversation(params.id, session);
    if (!conversation || !role) {
      return NextResponse.json({ error: "Conversa não encontrada" }, { status: 404 });
    }

    await setTyping(conversation.id, role);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao sinalizar digitação:", error);
    return NextResponse.json({ error: "Erro ao sinalizar digitação" }, { status: 500 });
  }
}
