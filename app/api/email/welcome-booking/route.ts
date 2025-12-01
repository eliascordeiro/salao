import { NextRequest, NextResponse } from "next/server";
import { sendEmailViaResend } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const { clientEmail, clientName, bookingId } = await request.json();

    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Template do email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f8f9fa;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 8px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 12px;
            }
            .highlight {
              background: #e3f2fd;
              padding: 15px;
              border-left: 4px solid #667eea;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✨ Bem-vindo!</h1>
          </div>
          <div class="content">
            <h2>Olá, ${clientName}!</h2>
            
            <p>Seu agendamento foi criado com sucesso! 🎉</p>
            
            <div class="highlight">
              <p><strong>💡 Dica:</strong> Você pode gerenciar seus agendamentos de forma fácil e rápida usando nosso aplicativo!</p>
            </div>
            
            <p>Com o app você pode:</p>
            <ul>
              <li>✅ Ver todos os seus agendamentos</li>
              <li>📅 Agendar novos serviços</li>
              <li>🔔 Receber lembretes automáticos</li>
              <li>⏰ Cancelar ou reagendar quando precisar</li>
              <li>💳 Fazer pagamentos online</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${appUrl}/login" class="button">
                Acessar Meu Painel
              </a>
            </div>
            
            <p style="margin-top: 30px;">
              Se tiver alguma dúvida, estamos à disposição!
            </p>
            
            <p>
              Atenciosamente,<br>
              <strong>Equipe AgendaSalão</strong>
            </p>
          </div>
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} AgendaSalão - Todos os direitos reservados</p>
          </div>
        </body>
      </html>
    `;

    // Enviar email via Resend
    await sendEmailViaResend({
      to: clientEmail,
      subject: "🎉 Bem-vindo ao AgendaHora Salão!",
      html: htmlContent,
      from: process.env.SMTP_FROM,
    });

    return NextResponse.json({ 
      success: true,
      message: "Email enviado com sucesso" 
    });

  } catch (error) {
    console.error("Erro ao enviar email de boas-vindas:", error);
    return NextResponse.json(
      { error: "Erro ao enviar email" },
      { status: 500 }
    );
  }
}
