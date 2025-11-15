import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// Helper to generate random password
function generatePassword(length = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  const randomValues = randomBytes(length)
  let password = ""
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length]
  }
  return password
}

// POST /api/users/[id]/resend-invite - Resend invitation email
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        ownedSalons: {
          take: 1,
        },
      },
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas proprietários podem reenviar convites" },
        { status: 403 }
      )
    }

    // Verify the user belongs to current owner
    const userToInvite = await prisma.user.findFirst({
      where: {
        id: params.id,
        ownerId: currentUser.id,
        active: true,
      },
    })

    if (!userToInvite) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Generate new temporary password
    const tempPassword = generatePassword()

    // Hash password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: params.id },
      data: { password: hashedPassword },
    })

    // Send invitation email
    const salonName = currentUser.ownedSalons[0]?.name || "Sistema de Agendamento"
    const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: userToInvite.email,
        subject: `Nova senha de acesso - ${salonName}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
                .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Nova Senha de Acesso</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${userToInvite.name}</strong>,</p>
                  
                  <p>Uma nova senha temporária foi gerada para sua conta no <strong>${salonName}</strong>.</p>
                  
                  <div class="credentials">
                    <p><strong>Email:</strong> ${userToInvite.email}</p>
                    <p><strong>Nova Senha Temporária:</strong> <code>${tempPassword}</code></p>
                  </div>
                  
                  <p><strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha após fazer login.</p>
                  
                  <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Acessar Sistema</a>
                  </div>
                  
                  <div class="footer">
                    <p>Este é um email automático. Por favor, não responda.</p>
                    <p>Se você não solicitou esta alteração, entre em contato com o administrador.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    const emailSent = response.ok

    return NextResponse.json({
      success: true,
      emailSent,
      tempPassword: emailSent ? undefined : tempPassword, // Only return password if email failed
    })
  } catch (error) {
    console.error("Erro ao reenviar convite:", error)
    return NextResponse.json({ error: "Erro ao reenviar convite" }, { status: 500 })
  }
}
