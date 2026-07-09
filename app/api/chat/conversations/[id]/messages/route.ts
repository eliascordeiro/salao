import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalonId } from "@/lib/salon-helper";
import { sendChatMessage, markConversationRead } from "@/lib/chat";

async function getAuthorizedConversation(conversationId: string, session: any) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, salonId: true, clientId: true },
  });
  if (!conversation) return { conversation: null, role: null as null };

  if (session.user.role === "CLIENT") {
    if (conversation.clientId !== session.user.id) return { conversation: null, role: null };
    return { conversation, role: "CLIENT" as const };
  }

  // ADMIN / STAFF: precisa ser do salão da conversa
  const salonId = await getUserSalonId();
  if (!salonId || salonId !== conversation.salonId) return { conversation: null, role: null };
  return { conversation, role: "ADMIN" as const };
}

// GET /api/chat/conversations/[id]/messages — lista mensagens e marca como lidas
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

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        senderId: true,
        senderRole: true,
        content: true,
        createdAt: true,
      },
    });

    await markConversationRead(conversation.id, role);

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json({ error: "Erro ao buscar mensagens" }, { status: 500 });
  }
}

// POST /api/chat/conversations/[id]/messages — envia uma mensagem
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

    const { content } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Mensagem vazia" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Mensagem muito longa" }, { status: 400 });
    }

    const message = await sendChatMessage({
      conversationId: conversation.id,
      senderId: session.user.id,
      senderRole: role,
      content: content.trim(),
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 });
  }
}
