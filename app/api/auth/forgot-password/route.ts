import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Por segurança, sempre retorna sucesso mesmo se o email não existir
    // Isso evita que hackers descubram quais emails estão cadastrados
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "Se o email existir, você receberá instruções para redefinir sua senha.",
      });
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Configurar email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/redefinir-senha?token=${resetToken}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 90%; border-collapse: collapse; background: white; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0;">
                      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">🔐 Redefinir Senha</h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Olá, <strong>${user.name}</strong>!
                      </p>
                      
                      <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Recebemos uma solicitação para redefinir a senha da sua conta no <strong>AgendaSalão</strong>.
                      </p>
                      
                      <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                        Clique no botão abaixo para criar uma nova senha:
                      </p>
                      
                      <table role="presentation" style="margin: 0 auto;">
                        <tr>
                          <td style="border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                            <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                              Redefinir Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 20px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      
                      <p style="margin: 0 0 30px; padding: 12px; background: #f3f4f6; border-radius: 6px; word-break: break-all; font-size: 12px; color: #4b5563;">
                        ${resetUrl}
                      </p>
                      
                      <div style="margin: 30px 0; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                          ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por segurança.
                        </p>
                      </div>
                      
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                        AgendaSalão - Sistema de Agendamentos
                      </p>
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        Este é um email automático, por favor não responda.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Enviar email
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: "🔐 Redefinição de Senha - AgendaSalão",
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Erro ao enviar email:", emailError);
      return NextResponse.json(
        { error: "Erro ao enviar email. Verifique as configurações SMTP." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Se o email existir, você receberá instruções para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Erro ao processar solicitação:", error);
    return NextResponse.json(
      { error: "Erro ao processar solicitação" },
      { status: 500 }
    );
  }
}
