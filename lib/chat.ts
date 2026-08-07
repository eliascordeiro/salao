import { prisma } from "@/lib/prisma";
import { sendPushToUser, sendPushToSalonOwner, pushEnabled } from "@/lib/push";

export type SenderRole = "CLIENT" | "ADMIN";

/**
 * Busca (ou cria) a conversa entre um cliente e um salão.
 */
export async function getOrCreateConversation(salonId: string, clientId: string) {
  return prisma.chatConversation.upsert({
    where: { salonId_clientId: { salonId, clientId } },
    update: {},
    create: { salonId, clientId },
  });
}

/**
 * Envia uma mensagem em uma conversa existente, atualiza os contadores de
 * não lidas e dispara push para o destinatário.
 */
export async function sendChatMessage({
  conversationId,
  senderId,
  senderRole,
  content,
}: {
  conversationId: string;
  senderId: string;
  senderRole: SenderRole;
  content: string;
}) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    include: {
      salon: { select: { id: true, name: true, ownerId: true } },
      client: { select: { id: true, name: true } },
    },
  });

  if (!conversation) {
    throw new Error("Conversa não encontrada");
  }

  const preview = content.length > 120 ? `${content.slice(0, 117)}...` : content;

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: { conversationId, senderId, senderRole, content },
    }),
    prisma.chatConversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: preview,
        ...(senderRole === "CLIENT"
          ? { ownerUnreadCount: { increment: 1 } }
          : { clientUnreadCount: { increment: 1 } }),
      },
    }),
  ]);

  // Push para o outro lado da conversa
  if (pushEnabled()) {
    if (senderRole === "CLIENT") {
      sendPushToSalonOwner(conversation.salon.id, {
        title: `💬 ${conversation.client.name}`,
        body: content,
        url: "/dashboard/mensagens",
        tag: `chat-${conversationId}`,
      }).catch((err) => console.error("❌ Erro ao enviar push (chat, dono):", err));
    } else {
      sendPushToUser(conversation.client.id, {
        title: `💬 ${conversation.salon.name}`,
        body: content,
        url: "/mensagens",
        tag: `chat-${conversationId}`,
      }).catch((err) => console.error("❌ Erro ao enviar push (chat, cliente):", err));
    }
  }

  return message;
}

/**
 * Zera o contador de não lidas do lado que está abrindo a conversa.
 */
export async function markConversationRead(conversationId: string, role: SenderRole) {
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data:
      role === "CLIENT" ? { clientUnreadCount: 0 } : { ownerUnreadCount: 0 },
  });
}

// Após esse período sem novo "ping" de digitação, o indicador expira.
const TYPING_TTL_MS = 5000;

/**
 * Registra que `role` está digitando agora nesta conversa.
 */
export async function setTyping(conversationId: string, role: SenderRole) {
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data:
      role === "CLIENT" ? { clientTypingAt: new Date() } : { ownerTypingAt: new Date() },
  });
}

/**
 * Verifica se o outro lado da conversa (oposto a `role`) está digitando no momento.
 */
export async function isOtherPartyTyping(conversationId: string, role: SenderRole) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { clientTypingAt: true, ownerTypingAt: true },
  });
  if (!conversation) return false;

  const otherTypingAt = role === "CLIENT" ? conversation.ownerTypingAt : conversation.clientTypingAt;
  if (!otherTypingAt) return false;

  return Date.now() - otherTypingAt.getTime() < TYPING_TTL_MS;
}
