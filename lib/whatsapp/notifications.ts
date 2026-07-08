import { hasFeature, FEATURES } from "@/lib/subscription-features";
import { sendWhatsAppMessage, isWhatsAppConfigured } from "./whatsapp-official-client";
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
import { sendPushToUser, pushEnabled } from "@/lib/push";

interface BookingNotificationData {
  salonId: string;
  clientId?: string; // ID do usuário cliente (para Web Push)
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
 * 
 * LÓGICA DOS PLANOS:
 * - Plano ESSENCIAL: Apenas Email
 * - Plano PROFISSIONAL: WhatsApp (API Oficial) + Email
 * 
 * WHATSAPP BUSINESS API OFICIAL:
 * - 1.000 conversas grátis/mês
 * - Não precisa de QR Code
 * - Funciona em produção (Railway)
 * - Templates precisam ser aprovados pela Meta
 */
export async function sendBookingNotification(
  data: BookingNotificationData,
  type: NotificationType
) {
  const results = {
    whatsapp: { sent: false, error: null as string | null },
    email: { sent: false, error: null as string | null },
  };

  // 1. Verificar se salão tem plano PROFISSIONAL (feature WhatsApp)
  const hasWhatsAppFeature = await hasFeature(data.salonId, FEATURES.WHATSAPP_NOTIFICATIONS);

  console.log(`📊 Enviando notificação de ${type} para ${data.clientName}`);
  console.log(`📱 Plano tem WhatsApp: ${hasWhatsAppFeature ? 'SIM (Profissional)' : 'NÃO (Essencial)'}`);

  // 2. Tentar enviar WhatsApp (APENAS se Plano Profissional + telefone disponível)
  if (hasWhatsAppFeature && data.clientPhone) {
    try {
      // Verificar se WhatsApp está configurado
      const isConfigured = isWhatsAppConfigured();
      
      if (!isConfigured) {
        console.warn('⚠️ WhatsApp não está configurado. Configure WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_ACCESS_TOKEN.');
        results.whatsapp.error = 'WhatsApp não configurado. Configure as credenciais da API.';
      } else {
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

        // Enviar via WhatsApp Business API Oficial
        const result = await sendWhatsAppMessage(data.clientPhone, message);

        if (result.success) {
          results.whatsapp.sent = true;
          console.log(`✅ WhatsApp enviado para ${data.clientPhone} (ID: ${result.messageId})`);
        } else {
          results.whatsapp.error = result.error || 'Erro ao enviar mensagem';
          console.error(`❌ Falha ao enviar WhatsApp:`, result.error);
        }
      }
    } catch (error: any) {
      results.whatsapp.error = error.message;
      console.error(`❌ Erro ao enviar WhatsApp:`, error);
      console.log('📧 Continuando com envio de email (backup)...');
    }
  } else if (!hasWhatsAppFeature) {
    console.log('📧 Plano Essencial: Enviando apenas email (sem WhatsApp)');
  } else if (!data.clientPhone) {
    console.log('⚠️ Cliente não tem telefone cadastrado. Enviando apenas email.');
  }

  // 3. SEMPRE enviar Email (principal no Essencial, backup no Profissional)
  try {
    switch (type) {
      case "created":
        await sendBookingCreatedEmail({
          clientEmail: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          price: data.price,
        });
        break;
      case "confirmed":
        await sendBookingConfirmedEmail({
          clientEmail: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          price: data.price,
        });
        break;
      case "reminder":
        await sendBookingReminderEmail({
          clientEmail: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          salonName: data.salonName,
          salonAddress: data.salonAddress,
          price: data.price,
        });
        break;
      case "cancelled":
        await sendBookingCancelledEmail({
          clientEmail: data.clientEmail,
          clientName: data.clientName,
          serviceName: data.serviceName,
          staffName: data.staffName,
          date: data.date,
          salonName: data.salonName,
        }, "admin");
        break;
      // 'completed' não tem email ainda, apenas WhatsApp
    }

    results.email.sent = true;
    console.log(`✅ Email enviado para ${data.clientEmail}`);
  } catch (error: any) {
    results.email.error = error.message;
    console.error(`❌ Erro ao enviar email:`, error);
  }

  // 4. Web Push (se cliente tem ID e push está configurado)
  if (data.clientId && pushEnabled()) {
    const pushMessages: Record<typeof type, { title: string; body: string }> = {
      created: {
        title: "✅ Agendamento recebido!",
        body: `${data.serviceName} com ${data.staffName} em ${data.time} — ${data.salonName}`,
      },
      confirmed: {
        title: "🎉 Agendamento confirmado!",
        body: `${data.serviceName} confirmado para ${data.time} — ${data.salonName}`,
      },
      reminder: {
        title: "⏰ Lembrete de agendamento",
        body: `Amanhã: ${data.serviceName} às ${data.time} — ${data.salonName}`,
      },
      cancelled: {
        title: "❌ Agendamento cancelado",
        body: `Seu agendamento de ${data.serviceName} foi cancelado.`,
      },
      completed: {
        title: "⭐ Como foi seu atendimento?",
        body: `Avalie ${data.serviceName} em ${data.salonName}`,
      },
    };

    const msg = pushMessages[type];
    sendPushToUser(data.clientId, {
      title: msg.title,
      body: msg.body,
      url: "/meus-agendamentos",
      tag: `booking-${data.bookingId}`,
    }).catch((err) => console.error("❌ Erro ao enviar push:", err));
  }

  // 5. Log do resultado final
  console.log('📊 Resultado do envio:', {
    whatsapp: results.whatsapp.sent ? '✅ Enviado' : (results.whatsapp.error || '❌ Não enviado'),
    email: results.email.sent ? '✅ Enviado' : '❌ Falhou',
    push: data.clientId && pushEnabled() ? '✅ Disparado' : '⏭ Ignorado',
  });

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
