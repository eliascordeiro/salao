import webpush from "web-push";
import { prisma } from "@/lib/prisma";

// ─── Configuração VAPID ───────────────────────────────────────────────────────
const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? "";
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:contato@agendasalao.com.br";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) return false;
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  configured = true;
  return true;
}

export function pushEnabled(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY);
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

/**
 * Envia notificação push para todos os dispositivos de um usuário.
 * Best-effort: remove subscriptions expiradas (404/410) sem lançar erro.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureConfigured()) return;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  const data = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: sub.id } })
            .catch(() => {});
        }
      }
    })
  );
}

/**
 * Gera um par de chaves VAPID (use apenas uma vez para gerar e salvar no .env)
 */
export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}

/**
 * Envia notificação push para o dono de um salão (busca o ownerId pelo salonId).
 * Best-effort: nunca lança erro, apenas loga falhas.
 */
export async function sendPushToSalonOwner(
  salonId: string,
  payload: PushPayload
): Promise<void> {
  if (!ensureConfigured()) return;

  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { ownerId: true },
    });
    if (!salon?.ownerId) return;

    await sendPushToUser(salon.ownerId, payload);
  } catch (err) {
    console.error("❌ Erro ao enviar push para o dono do salão:", err);
  }
}

