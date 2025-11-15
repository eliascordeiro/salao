import { NextResponse } from "next/server"
import nodemailer from "nodemailer"

// Configuração do transportador SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// Verificar se o email está configurado
function isEmailConfigured() {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  )
}

interface SendEmailRequest {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

// POST /api/email/send - Send email
export async function POST(request: Request) {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn("⚠️ Email não configurado. Configure as variáveis SMTP_* no .env")
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "Configure SMTP variables in environment",
        },
        { status: 503 }
      )
    }

    const body: SendEmailRequest = await request.json()
    const { to, subject, html, text, from } = body

    // Validate required fields
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Missing required fields: to, subject, html" },
        { status: 400 }
      )
    }

    // Send email
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text: text || undefined,
    })

    console.log("✅ Email enviado:", {
      messageId: info.messageId,
      to: Array.isArray(to) ? to : [to],
      subject,
    })

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    })
  } catch (error: any) {
    console.error("❌ Erro ao enviar email:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    )
  }
}

// GET /api/email/send - Get email configuration status
export async function GET() {
  const configured = isEmailConfigured()
  
  return NextResponse.json({
    configured,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT || null,
    user: process.env.SMTP_USER || null,
    secure: process.env.SMTP_SECURE === "true",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
    message: configured
      ? "Email service is configured and ready"
      : "Email service not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in environment variables",
  })
}
