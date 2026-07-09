import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSalonId } from "@/lib/salon-helper";
import { getOrCreateConversation } from "@/lib/chat";

// GET /api/chat/conversations
// - CLIENT: lista suas conversas (com todos os salões que já falou)
// - ADMIN/STAFF: lista as conversas do salão (com todos os clientes)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role === "CLIENT") {
      const conversations = await prisma.chatConversation.findMany({
        where: { clientId: session.user.id },
        include: {
          salon: { select: { id: true, name: true, logo: true } },
        },
        orderBy: { lastMessageAt: "desc" },
      });

      return NextResponse.json(
        conversations.map((c) => ({
          id: c.id,
          salon: c.salon,
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: c.lastMessagePreview,
          unreadCount: c.clientUnreadCount,
        }))
      );
    }

    // ADMIN / STAFF
    const salonId = await getUserSalonId();
    if (!salonId) {
      return NextResponse.json({ error: "Usuário não possui salão associado" }, { status: 400 });
    }

    const conversations = await prisma.chatConversation.findMany({
      where: { salonId },
      include: {
        client: { select: { id: true, name: true, email: true, phone: true, image: true } },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json(
      conversations.map((c) => ({
        id: c.id,
        client: c.client,
        lastMessageAt: c.lastMessageAt,
        lastMessagePreview: c.lastMessagePreview,
        unreadCount: c.ownerUnreadCount,
      }))
    );
  } catch (error) {
    console.error("Erro ao listar conversas:", error);
    return NextResponse.json({ error: "Erro ao listar conversas" }, { status: 500 });
  }
}

// POST /api/chat/conversations — cliente inicia (ou reabre) uma conversa com um salão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Apenas clientes podem iniciar uma conversa por este endpoint" },
        { status: 403 }
      );
    }

    const { salonId } = await request.json();
    if (!salonId) {
      return NextResponse.json({ error: "salonId é obrigatório" }, { status: 400 });
    }

    const salon = await prisma.salon.findUnique({ where: { id: salonId }, select: { id: true } });
    if (!salon) {
      return NextResponse.json({ error: "Salão não encontrado" }, { status: 404 });
    }

    const conversation = await getOrCreateConversation(salonId, session.user.id);
    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Erro ao criar conversa:", error);
    return NextResponse.json({ error: "Erro ao criar conversa" }, { status: 500 });
  }
}
