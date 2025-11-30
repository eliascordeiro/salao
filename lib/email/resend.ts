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
  from,
}: SendEmailParams) {
  try {
    // Resend requer domínio verificado. Use onboarding@resend.dev se não tiver domínio próprio
    const senderEmail = from || process.env.SMTP_FROM || 'AgendaSalão <onboarding@resend.dev>'
    
    // Se o email for @gmail.com ou outro não verificado, usar padrão do Resend
    const finalFrom = senderEmail.includes('@gmail.com') 
      ? 'AgendaSalão <onboarding@resend.dev>'
      : senderEmail

    console.log(`📧 Enviando email de: ${finalFrom} para: ${to}`)

    const data = await resend.emails.send({
      from: finalFrom,
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
