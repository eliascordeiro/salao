import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

export async function sendEmailViaResend({
  to,
  subject,
  html,
  from = process.env.SMTP_FROM || 'AgendaSalão <onboarding@resend.dev>',
}: SendEmailParams) {
  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    console.log('✅ Email enviado via Resend:', data)
    return { success: true, messageId: data.id }
  } catch (error: any) {
    console.error('❌ Erro ao enviar email via Resend:', error)
    throw error
  }
}
