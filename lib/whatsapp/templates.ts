import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BookingData {
  clientName: string;
  serviceName: string;
  staffName: string;
  date: Date;
  time: string;
  salonName: string;
  salonAddress: string;
  salonPhone: string;
  price: number;
}

/**
 * Template: Agendamento Criado (PENDING)
 */
export function whatsappBookingCreated(data: BookingData): string {
  const formattedDate = format(data.date, "dd/MM/yyyy", { locale: ptBR });
  const dayOfWeek = format(data.date, "EEEE", { locale: ptBR });

  return `🎉 *Agendamento Recebido!*

Olá *${data.clientName}*! 👋

Recebemos seu pedido de agendamento:

📅 *Data:* ${dayOfWeek}, ${formattedDate}
🕐 *Horário:* ${data.time}
💇 *Serviço:* ${data.serviceName}
✨ *Profissional:* ${data.staffName}
💰 *Valor:* R$ ${data.price.toFixed(2)}

📍 *${data.salonName}*
${data.salonAddress}

⏳ *Aguardando confirmação do salão...*

📞 Dúvidas? Ligue: ${data.salonPhone}

_Você receberá outra mensagem assim que for confirmado!_ ✅`;
}

/**
 * Template: Agendamento Confirmado
 */
export function whatsappBookingConfirmed(data: BookingData): string {
  const formattedDate = format(data.date, "dd/MM/yyyy", { locale: ptBR });
  const dayOfWeek = format(data.date, "EEEE", { locale: ptBR });

  return `✅ *Agendamento Confirmado!*

Olá *${data.clientName}*! 🎊

Seu agendamento foi *confirmado* com sucesso!

📅 *Data:* ${dayOfWeek}, ${formattedDate}
🕐 *Horário:* ${data.time}
💇 *Serviço:* ${data.serviceName}
✨ *Profissional:* ${data.staffName}
💰 *Valor:* R$ ${data.price.toFixed(2)}

📍 *${data.salonName}*
${data.salonAddress}

💡 *Dicas:*
• Chegue 5 minutos antes
• Traga um documento com foto
• Em caso de atraso, avise o salão

📞 Contato: ${data.salonPhone}

_Esperamos você! 🌟_`;
}

/**
 * Template: Lembrete 24h antes
 */
export function whatsappBookingReminder(data: BookingData): string {
  const formattedDate = format(data.date, "dd/MM/yyyy", { locale: ptBR });
  const tomorrow = format(data.date, "EEEE", { locale: ptBR });

  return `⏰ *Lembrete de Agendamento*

Olá *${data.clientName}*! 

Este é um lembrete do seu agendamento *amanhã*:

📅 *${tomorrow}*, ${formattedDate}
🕐 *Horário:* ${data.time}
💇 *Serviço:* ${data.serviceName}
✨ *Profissional:* ${data.staffName}

📍 *${data.salonName}*
${data.salonAddress}

⚠️ *Importante:*
Se não puder comparecer, por favor avise com antecedência.

📞 Contato: ${data.salonPhone}

_Até amanhã! 😊_`;
}

/**
 * Template: Agendamento Cancelado
 */
export function whatsappBookingCancelled(data: BookingData): string {
  const formattedDate = format(data.date, "dd/MM/yyyy", { locale: ptBR });

  return `❌ *Agendamento Cancelado*

Olá *${data.clientName}*,

Seu agendamento foi cancelado:

📅 *Data:* ${formattedDate}
🕐 *Horário:* ${data.time}
💇 *Serviço:* ${data.serviceName}

📍 *${data.salonName}*

Que pena! 😔
Esperamos vê-lo em outra ocasião.

📞 Para reagendar: ${data.salonPhone}

_Até breve!_ ✨`;
}

/**
 * Template: Agendamento Completado (pedir avaliação)
 */
export function whatsappBookingCompleted(data: BookingData): string {
  return `⭐ *Como foi sua experiência?*

Olá *${data.clientName}*! 

Esperamos que tenha gostado do atendimento no *${data.salonName}*! 💇✨

Sua opinião é muito importante para nós!

🌟 *Avalie o serviço:*
💇 Serviço: ${data.serviceName}
✨ Profissional: ${data.staffName}

📝 Deixe seu feedback e ajude outros clientes!

📞 Gostou? Indique para amigos!

_Até a próxima! 🎉_`;
}

/**
 * Template: Promoção/Marketing
 */
export function whatsappPromotion(clientName: string, salonName: string, promoText: string): string {
  return `🎁 *Promoção Especial!*

Olá *${clientName}*! 

${promoText}

📍 *${salonName}*

⏰ *Aproveite enquanto durar!*

_Agende já o seu horário!_ 💜`;
}
