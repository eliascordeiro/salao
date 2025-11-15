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

// Helper to send invitation email
async function sendInvitationEmail(
  email: string,
  name: string,
  tempPassword: string,
  salonName: string
) {
  try {
    const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: `Convite para acessar ${salonName}`,
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
                  <h1>Bem-vindo(a)!</h1>
                </div>
                <div class="content">
                  <p>Olá <strong>${name}</strong>,</p>
                  
                  <p>Você foi convidado(a) para acessar o sistema de gestão do <strong>${salonName}</strong>.</p>
                  
                  <p>Use as credenciais abaixo para fazer seu primeiro acesso:</p>
                  
                  <div class="credentials">
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Senha Temporária:</strong> <code>${tempPassword}</code></p>
                  </div>
                  
                  <p><strong>⚠️ Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso.</p>
                  
                  <div style="text-align: center;">
                    <a href="${loginUrl}" class="button">Acessar Sistema</a>
                  </div>
                  
                  <div class="footer">
                    <p>Este é um email automático. Por favor, não responda.</p>
                    <p>Se você não solicitou este acesso, por favor ignore este email.</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Erro ao enviar email de convite:", error)
    return false
  }
}

// GET /api/users - List managed users
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas proprietários podem gerenciar usuários" },
        { status: 403 }
      )
    }

    // Get all managed users
    const users = await prisma.user.findMany({
      where: {
        ownerId: currentUser.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleType: true,
        permissions: true,
        active: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro ao listar usuários:", error)
    return NextResponse.json({ error: "Erro ao listar usuários" }, { status: 500 })
  }
}

// POST /api/users - Create new user
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Get current user
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
        { error: "Apenas proprietários podem criar usuários" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, email, roleType, permissions } = body

    // Validate required fields
    if (!name || !email || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: "Nome, email e ao menos uma permissão são obrigatórios" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Generate temporary password
    const tempPassword = generatePassword()

    // Hash password using bcrypt
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "CLIENT", // Managed users are always CLIENT role
        roleType: roleType || "CUSTOM",
        ownerId: currentUser.id,
        permissions,
        active: true,
      },
    })

    // Send invitation email
    const salonName = currentUser.ownedSalons[0]?.name || "Sistema de Agendamento"
    const emailSent = await sendInvitationEmail(email, name, tempPassword, salonName)

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleType: newUser.roleType,
        permissions: newUser.permissions,
      },
      emailSent,
      tempPassword: emailSent ? undefined : tempPassword, // Only return password if email failed
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
