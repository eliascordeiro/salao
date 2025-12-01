import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailViaResend } from "@/lib/email/resend";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export async function POST(request: NextRequest) {
  try {
    const { bookingId, isNewClient, isUpdate } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar dados do agendamento
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            name: true,
            specialty: true,
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    const bookingDate = new Date(booking.date);
    const formattedDate = format(bookingDate, "dd/MM/yyyy", { locale: ptBR });
    const formattedTime = format(bookingDate, "HH:mm", { locale: ptBR });
    const formattedDay = format(bookingDate, "EEEE", { locale: ptBR });

    // Definir assunto e mensagem baseado no tipo
    let subject = "";
    let greetingMessage = "";
    let mainMessage = "";

    if (isNewClient) {
      subject = `Bem-vindo! Agendamento confirmado - ${booking.salon.name}`;
      greetingMessage = `Olá ${booking.client.name}, seja bem-vindo(a)!`;
      mainMessage = `
        <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">
          É um prazer tê-lo(a) conosco! Seu primeiro agendamento foi criado com sucesso.
        </p>
      `;
    } else if (isUpdate) {
      subject = `Agendamento Alterado - ${booking.salon.name}`;
      greetingMessage = `Olá ${booking.client.name}!`;
      mainMessage = `
        <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">
          Seu agendamento foi <strong>alterado</strong>. Confira os novos detalhes abaixo:
        </p>
      `;
    } else {
      subject = `Agendamento Confirmado - ${booking.salon.name}`;
      greetingMessage = `Olá ${booking.client.name}!`;
      mainMessage = `
        <p style="font-size: 16px; color: #4B5563; margin-bottom: 20px;">
          Seu agendamento foi criado com sucesso. Confira os detalhes:
        </p>
      `;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #F3F4F6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
            <!-- Header com gradiente -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: bold;">
                ${booking.salon.name}
              </h1>
              <p style="color: #E0E7FF; margin: 10px 0 0 0; font-size: 16px;">
                ${isUpdate ? "Agendamento Alterado" : "Agendamento Confirmado"}
              </p>
            </div>

            <!-- Conteúdo -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1F2937; font-size: 24px; margin-bottom: 10px;">
                ${greetingMessage}
              </h2>
              
              ${mainMessage}

              <!-- Card de Detalhes -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
                <div style="background-color: rgba(255, 255, 255, 0.95); border-radius: 8px; padding: 25px;">
                  
                  <!-- Serviço -->
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <span style="font-size: 20px; margin-right: 10px;">✂️</span>
                      <strong style="color: #667eea; font-size: 14px;">SERVIÇO</strong>
                    </div>
                    <p style="margin: 0; color: #1F2937; font-size: 18px; font-weight: bold;">
                      ${booking.service.name}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">
                      Duração: ${booking.service.duration} minutos | Valor: R$ ${booking.service.price.toFixed(2)}
                    </p>
                  </div>

                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">

                  <!-- Profissional -->
                  <div style="margin-bottom: 20px;">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <span style="font-size: 20px; margin-right: 10px;">👤</span>
                      <strong style="color: #667eea; font-size: 14px;">PROFISSIONAL</strong>
                    </div>
                    <p style="margin: 0; color: #1F2937; font-size: 18px; font-weight: bold;">
                      ${booking.staff.name}
                    </p>
                    ${booking.staff.specialty ? `
                      <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 14px;">
                        ${booking.staff.specialty}
                      </p>
                    ` : ""}
                  </div>

                  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;">

                  <!-- Data e Hora -->
                  <div>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                      <span style="font-size: 20px; margin-right: 10px;">📅</span>
                      <strong style="color: #667eea; font-size: 14px;">DATA E HORÁRIO</strong>
                    </div>
                    <p style="margin: 0; color: #1F2937; font-size: 18px; font-weight: bold;">
                      ${formattedDay}, ${formattedDate}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #1F2937; font-size: 24px; font-weight: bold;">
                      ${formattedTime}
                    </p>
                  </div>

                </div>
              </div>

              <!-- Localização -->
              <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <div style="display: flex; align-items: center; margin-bottom: 10px;">
                  <span style="font-size: 20px; margin-right: 10px;">📍</span>
                  <strong style="color: #374151; font-size: 14px;">LOCAL</strong>
                </div>
                <p style="margin: 0; color: #1F2937; font-size: 16px;">
                  ${booking.salon.address}
                </p>
                ${booking.salon.phone ? `
                  <p style="margin: 10px 0 0 0; color: #6B7280; font-size: 14px;">
                    📞 ${booking.salon.phone}
                  </p>
                ` : ""}
              </div>

              ${isNewClient ? `
                <!-- Mensagem de Boas-vindas -->
                <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="color: #FFFFFF; margin: 0; font-size: 16px; font-weight: bold;">
                    🎉 Primeira vez aqui? Seja muito bem-vindo(a)!
                  </p>
                  <p style="color: #D1FAE5; margin: 10px 0 0 0; font-size: 14px;">
                    Estamos ansiosos para atendê-lo(a)!
                  </p>
                </div>
              ` : ""}

              <!-- Dicas -->
              <div style="margin-top: 30px; padding: 20px; background-color: #FEF3C7; border-radius: 8px; border-left: 4px solid #F59E0B;">
                <p style="margin: 0 0 10px 0; color: #92400E; font-size: 14px; font-weight: bold;">
                  💡 Dicas importantes:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #92400E; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Chegue com 10 minutos de antecedência</li>
                  <li style="margin-bottom: 8px;">Em caso de imprevistos, avise com antecedência</li>
                  <li style="margin-bottom: 8px;">Traga documentos se for sua primeira visita</li>
                </ul>
              </div>

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; text-align: center;">
                <p style="color: #6B7280; font-size: 14px; margin: 0;">
                  Este é um e-mail automático, por favor não responda.
                </p>
                <p style="color: #9CA3AF; font-size: 12px; margin: 10px 0 0 0;">
                  ${booking.salon.name} | ${booking.salon.address}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Enviar email via Resend
    await sendEmailViaResend({
      to: booking.client.email,
      subject,
      html,
      from: process.env.SMTP_FROM,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Email de notificação enviado com sucesso" 
    });
  } catch (error) {
    console.error("Erro ao enviar email de notificação:", error);
    return NextResponse.json(
      { error: "Erro ao enviar email de notificação" },
      { status: 500 }
    );
  }
}
