import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { getWhatsAppClient } from "./evolution-client";
import {
  whatsappBookingCreated,
  whatsappBookingConfirmed,
  whatsappBookingReminder,
  whatsappBookingCancelled,
  whatsappBookingCompleted,
} from "./templates";
import {
  sendBookingCreatedEmail,
  sendBookingConfirmedEmail,
  sendBookingReminderEmail,
  sendBookingCancelledEmail,
} from "@/lib/email";

interface BookingNotificationData {
  salonId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  serviceName: string;
  staffName: string;
  date: Date;
  time: string;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  price: number;
  bookingId: string;
}

type NotificationType = "created" | "confirmed" | "reminder" | "cancelled" | "completed";

/**
 * Envia notificação híbrida (WhatsApp + Email)
 * Tenta WhatsApp primeiro se o salão tiver a feature
 * Sempre envia Email como backup
 */
export async function sendBookingNotification(
  data: BookingNotificationData,
  type: NotificationType
) {
  const results = {
    whatsapp: { sent: false, error: null as string | null },
    email: { sent: false, error: null as string | null },
  };

  // 1. Verificar se salão tem feature WhatsApp
  const hasWhatsApp = await hasFeature(data.salonId, FEATURES.WHATSAPP_NOTIFICATIONS);

  // 2. Tentar enviar WhatsApp (se tiver feature E telefone)
  if (hasWhatsApp && data.clientPhone) {
    try {
      const whatsapp = getWhatsAppClient();
      let message = "";

      switch (type) {
        case "created":
          message = whatsappBookingCreated(data);
          break;
        case "confirmed":
          message = whatsappBookingConfirmed(data);
          break;
        case "reminder":
          message = whatsappBookingReminder(data);
          break;
        case "cancelled":
          message = whatsappBookingCancelled(data);
          break;
        case "completed":
          message = whatsappBookingCompleted(data);
          break;
      }

      await whatsapp.sendText({
        number: data.clientPhone,
        text: message,
        delay: 1200, // Simular digitação
      });

      results.whatsapp.sent = true;
      console.log(`✅ WhatsApp enviado para ${data.clientPhone}`);
    } catch (error: any) {
      results.whatsapp.error = error.message;
      console.error(`❌ Erro ao enviar WhatsApp:`, error);
    }
  }

  // 3. Sempre enviar Email (backup ou principal)
  try {
    switch (type) {
      case "created":
        await sendBookingCreatedEmail({
          to: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          time: data.time,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          salonPhone: data.salonPhone,
        });
        break;
      case "confirmed":
        await sendBookingConfirmedEmail({
          to: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          time: data.time,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          salonPhone: data.salonPhone,
        });
        break;
      case "reminder":
        await sendBookingReminderEmail({
          to: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          time: data.time,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          salonPhone: data.salonPhone,
        });
        break;
      case "cancelled":
        await sendBookingCancelledEmail({
          to: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          date: data.date,
          time: data.time,
          salonName: data.salonName,
        });
        break;
      // 'completed' não tem email ainda, apenas WhatsApp
    }

    results.email.sent = true;
    console.log(`✅ Email enviado para ${data.clientEmail}`);
  } catch (error: any) {
    results.email.error = error.message;
    console.error(`❌ Erro ao enviar email:`, error);
  }

  return results;
}

/**
 * Helper para enviar notificação de agendamento criado
 */
export async function notifyBookingCreated(data: BookingNotificationData) {
  return sendBookingNotification(data, "created");
}

/**
 * Helper para enviar notificação de agendamento confirmado
 */
export async function notifyBookingConfirmed(data: BookingNotificationData) {
  return sendBookingNotification(data, "confirmed");
}

/**
 * Helper para enviar lembrete
 */
export async function notifyBookingReminder(data: BookingNotificationData) {
  return sendBookingNotification(data, "reminder");
}

/**
 * Helper para enviar notificação de cancelamento
 */
export async function notifyBookingCancelled(data: BookingNotificationData) {
  return sendBookingNotification(data, "cancelled");
}

/**
 * Helper para enviar pedido de avaliação
 */
export async function notifyBookingCompleted(data: BookingNotificationData) {
  return sendBookingNotification(data, "completed");
}
