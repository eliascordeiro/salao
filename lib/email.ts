import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { sendEmailViaResend } from "@/lib/email/resend";

// Verificar conexão de email (Resend)
export async function verifyEmailConnection() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY não configurada");
      return false;
    }
    console.log("✅ Resend configurado e pronto para enviar emails");
    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar configuração de email:", error);
    return false;
  }
}

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  salonName: string;
  salonAddress?: string;
  date: Date;
  duration: number;
  price: number;
  notes?: string;
}

// Template base HTML para emails
function getEmailTemplate(title: string, content: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin: 0;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin: 0 0 20px 0;
    }
    .info-box {
      background-color: #f9fafb;
      border-left: 4px solid #2563eb;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      margin: 10px 0;
      display: flex;
      justify-content: space-between;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
    }
    .info-value {
      color: #1f2937;
      text-align: right;
    }
    .price {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
      text-align: center;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #2563eb;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px auto;
      text-align: center;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .alert {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .success {
      background-color: #d1fae5;
      border-left: 4px solid #10b981;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <p class="logo">✂️ AgendaSalão</p>
    </div>
    ${content}
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
      <p>© ${new Date().getFullYear()} AgendaSalão. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// Email: Novo agendamento criado (para cliente)
export async function sendBookingCreatedEmail(
  data: BookingEmailData,
  bookingId?: string
) {
  const formattedDate = format(data.date, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(data.date, "HH:mm");

  const content = `
    <h1>Agendamento Realizado com Sucesso! 🎉</h1>
    <p>Olá <strong>${data.clientName}</strong>,</p>
    <p>Seu agendamento foi realizado com sucesso e está aguardando confirmação.</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Serviço:</span>
        <span class="info-value">${data.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Profissional:</span>
        <span class="info-value">${data.staffName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Horário:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Duração:</span>
        <span class="info-value">${data.duration} minutos</span>
      </div>
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${data.salonName}${
    data.salonAddress ? ` - ${data.salonAddress}` : ""
  }</span>
      </div>
    </div>
    
    <div class="price">R$ ${data.price.toFixed(2)}</div>
    
    ${
      data.notes
        ? `
    <div class="info-box">
      <p class="info-label">Observações:</p>
      <p>${data.notes}</p>
    </div>
    `
        : ""
    }
    
    <div class="alert">
      <p><strong>⏳ Aguardando Confirmação</strong></p>
      <p>Seu agendamento será confirmado em breve. Você receberá um email assim que for confirmado.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/meus-agendamentos" class="button">
        Ver Meus Agendamentos
      </a>
    </p>
  `;

  const subject = `Agendamento Realizado - ${data.serviceName}`;

  try {
    await sendEmailViaResend({
      to: data.clientEmail,
      subject,
      html: getEmailTemplate("Agendamento Realizado", content),
      from: process.env.SMTP_FROM,
    });
    
    console.log(`✅ Email de criação enviado para ${data.clientEmail}`);
    
    // Registrar notificação no banco
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CREATED",
        data.clientEmail,
        subject,
        "SENT"
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar email de criação:", error);
    
    // Registrar falha no banco
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CREATED",
        data.clientEmail,
        subject,
        "FAILED",
        error
      );
    }
    
    return { success: false, error };
  }
}

// Email: Agendamento confirmado pelo admin
export async function sendBookingConfirmedEmail(
  data: BookingEmailData,
  bookingId?: string
) {
  const formattedDate = format(data.date, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(data.date, "HH:mm");

  const content = `
    <h1>Agendamento Confirmado! ✅</h1>
    <p>Olá <strong>${data.clientName}</strong>,</p>
    <p>Ótimas notícias! Seu agendamento foi confirmado.</p>
    
    <div class="success">
      <p><strong>✓ Confirmado</strong></p>
      <p>Seu horário está reservado e garantido!</p>
    </div>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Serviço:</span>
        <span class="info-value">${data.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Profissional:</span>
        <span class="info-value">${data.staffName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Horário:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Duração:</span>
        <span class="info-value">${data.duration} minutos</span>
      </div>
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${data.salonName}${
    data.salonAddress ? ` - ${data.salonAddress}` : ""
  }</span>
      </div>
    </div>
    
    <div class="price">R$ ${data.price.toFixed(2)}</div>
    
    <div class="alert">
      <p><strong>📅 Lembre-se</strong></p>
      <p>Chegue com alguns minutos de antecedência. Enviaremos um lembrete 24 horas antes.</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/meus-agendamentos" class="button">
        Ver Meus Agendamentos
      </a>
    </p>
  `;

  const subject = `✅ Agendamento Confirmado - ${data.serviceName}`;

  try {
    await sendEmailViaResend({
      to: data.clientEmail,
      subject,
      html: getEmailTemplate("Agendamento Confirmado", content),
      from: process.env.SMTP_FROM,
    });
    
    console.log(`✅ Email de confirmação enviado para ${data.clientEmail}`);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CONFIRMED",
        data.clientEmail,
        subject,
        "SENT"
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar email de confirmação:", error);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CONFIRMED",
        data.clientEmail,
        subject,
        "FAILED",
        error
      );
    }
    
    return { success: false, error };
  }
}

// Email: Lembrete 24h antes do agendamento
export async function sendBookingReminderEmail(
  data: BookingEmailData,
  bookingId?: string
) {
  const formattedDate = format(data.date, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(data.date, "HH:mm");
  const tomorrow = format(data.date, "EEEE", { locale: ptBR });

  const content = `
    <h1>Lembrete: Seu Agendamento é Amanhã! ⏰</h1>
    <p>Olá <strong>${data.clientName}</strong>,</p>
    <p>Este é um lembrete de que você tem um agendamento amanhã (${tomorrow}).</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Serviço:</span>
        <span class="info-value">${data.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Profissional:</span>
        <span class="info-value">${data.staffName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Horário:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Duração:</span>
        <span class="info-value">${data.duration} minutos</span>
      </div>
      <div class="info-row">
        <span class="info-label">Local:</span>
        <span class="info-value">${data.salonName}${
    data.salonAddress ? ` - ${data.salonAddress}` : ""
  }</span>
      </div>
    </div>
    
    <div class="alert">
      <p><strong>⏰ Chegue com antecedência</strong></p>
      <p>Recomendamos chegar 5-10 minutos antes do horário agendado.</p>
    </div>
    
    <p>Se precisar cancelar ou remarcar, acesse sua área de agendamentos.</p>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/meus-agendamentos" class="button">
        Ver Meus Agendamentos
      </a>
    </p>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      Nos vemos amanhã! 👋
    </p>
  `;

  const subject = `🔔 Lembrete: Agendamento amanhã às ${formattedTime}`;

  try {
    await sendEmailViaResend({
      to: data.clientEmail,
      subject,
      html: getEmailTemplate("Lembrete de Agendamento", content),
      from: process.env.SMTP_FROM,
    });
    
    console.log(`✅ Email de lembrete enviado para ${data.clientEmail}`);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_REMINDER",
        data.clientEmail,
        subject,
        "SENT"
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar email de lembrete:", error);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_REMINDER",
        data.clientEmail,
        subject,
        "FAILED",
        error
      );
    }
    
    return { success: false, error };
  }
}

// Email: Agendamento cancelado
export async function sendBookingCancelledEmail(
  data: BookingEmailData,
  cancelledBy: "client" | "admin",
  bookingId?: string
) {
  const formattedDate = format(data.date, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(data.date, "HH:mm");

  const content = `
    <h1>Agendamento Cancelado</h1>
    <p>Olá <strong>${data.clientName}</strong>,</p>
    <p>${
      cancelledBy === "client"
        ? "Confirmamos o cancelamento do seu agendamento."
        : "Informamos que seu agendamento foi cancelado."
    }</p>
    
    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Serviço:</span>
        <span class="info-value">${data.serviceName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Profissional:</span>
        <span class="info-value">${data.staffName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Data:</span>
        <span class="info-value">${formattedDate}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Horário:</span>
        <span class="info-value">${formattedTime}</span>
      </div>
    </div>
    
    <div class="alert">
      <p><strong>ℹ️ Informação</strong></p>
      <p>${
        cancelledBy === "client"
          ? "Se mudou de ideia, você pode fazer um novo agendamento a qualquer momento."
          : "Se tiver dúvidas sobre este cancelamento, entre em contato conosco."
      }</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${process.env.NEXTAUTH_URL}/saloes" class="button">
        Fazer Novo Agendamento
      </a>
    </p>
  `;

  const subject = `Agendamento Cancelado - ${data.serviceName}`;

  try {
    await sendEmailViaResend({
      to: data.clientEmail,
      subject,
      html: getEmailTemplate("Agendamento Cancelado", content),
      from: process.env.SMTP_FROM,
    });
    
    console.log(`✅ Email de cancelamento enviado para ${data.clientEmail}`);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CANCELLED",
        data.clientEmail,
        subject,
        "SENT"
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao enviar email de cancelamento:", error);
    
    if (bookingId) {
      await logNotification(
        bookingId,
        "BOOKING_CANCELLED",
        data.clientEmail,
        subject,
        "FAILED",
        error
      );
    }
    
    return { success: false, error };
  }
}

// Função auxiliar para registrar notificação no banco
async function logNotification(
  bookingId: string,
  type: string,
  email: string,
  subject: string,
  status: "SENT" | "FAILED",
  error?: any
) {
  try {
    await prisma.notification.create({
      data: {
        bookingId,
        type,
        email,
        subject,
        status,
        sentAt: status === "SENT" ? new Date() : null,
        error: error ? JSON.stringify(error) : null,
      },
    });
  } catch (err) {
    console.error("Erro ao registrar notificação no banco:", err);
  }
}

// Função auxiliar para formatar dados de agendamento
export function formatBookingDataForEmail(booking: any): BookingEmailData {
  return {
    clientName: booking.client?.name || "Cliente",
    clientEmail: booking.client?.email || "",
    serviceName: booking.service?.name || "Serviço",
    staffName: booking.staff?.name || "Profissional",
    salonName: booking.salon?.name || "Salão",
    salonAddress: booking.salon?.address,
    date: new Date(booking.date),
    duration: booking.service?.duration || 30,
    price: booking.totalPrice || 0,
    notes: booking.notes,
  };
}

// Função para obter ID do booking a partir dos dados
export function getBookingId(booking: any): string {
  return booking.id || "";
}
