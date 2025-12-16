import { NextResponse } from "next/server"
import { sendEmailViaResend } from "@/lib/email/resend"

// Verificar se o email está configurado
function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY
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
      console.warn("⚠️ Email não configurado. Configure RESEND_API_KEY no .env")
      return NextResponse.json(
        {
          error: "Email service not configured",
          message: "Configure RESEND_API_KEY in environment",
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

    // Enviar via Resend
    console.log("📧 Enviando email via Resend...")
    const result = await sendEmailViaResend({
      to,
      subject,
      html,
      from: from || process.env.SMTP_FROM,
    })
    return NextResponse.json(result)
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
    provider: "Resend",
    from: process.env.SMTP_FROM || "agenda@salon-booking.com.br",
    message: configured
      ? "Email service is configured and ready (Resend)"
      : "Email service not configured. Set RESEND_API_KEY in environment variables",
  })
}
