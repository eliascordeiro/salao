import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// DELETE /api/users/[id] - Deactivate user
export async function DELETE(
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
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas proprietários podem desativar usuários" },
        { status: 403 }
      )
    }

    // Verify the user belongs to current owner
    const userToDeactivate = await prisma.user.findFirst({
      where: {
        id: params.id,
        ownerId: currentUser.id,
      },
    })

    if (!userToDeactivate) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Deactivate user
    await prisma.user.update({
      where: { id: params.id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao desativar usuário:", error)
    return NextResponse.json({ error: "Erro ao desativar usuário" }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update user permissions
export async function PUT(
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
    })

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas proprietários podem atualizar usuários" },
        { status: 403 }
      )
    }

    // Verify the user belongs to current owner
    const userToUpdate = await prisma.user.findFirst({
      where: {
        id: params.id,
        ownerId: currentUser.id,
      },
    })

    if (!userToUpdate) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const body = await request.json()
    const { name, permissions, active } = body

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(permissions && { permissions }),
        ...(active !== undefined && { active }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleType: true,
        permissions: true,
        active: true,
      },
    })

    // Send notification email (only to actual user, not test email)
    try {
      const permissionsCount = Array.isArray(permissions) ? permissions.length : updatedUser.permissions.length
      const statusText = active === false ? "desativado" : active === true ? "reativado" : "atualizado"
      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
      const loginUrl = `${baseUrl}/login`
      
      // Send to actual user email (not hardcoded test email)
      await fetch(`${baseUrl}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: updatedUser.email, // Send to the actual user
          subject: `✅ Suas permissões foram atualizadas - ${updatedUser.name}`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                  .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                  .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
                  .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                  .info-label { font-weight: 600; color: #6b7280; }
                  .info-value { color: #1f2937; }
                  .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; }
                  .badge-active { background: #d1fae5; color: #065f46; }
                  .badge-inactive { background: #fee2e2; color: #991b1b; }
                  .btn-login { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; text-align: center; font-size: 16px; }
                  .btn-login:hover { opacity: 0.9; }
                  .alert-info { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0; }
                  .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>✅ Conta Atualizada</h1>
                  </div>
                  <div class="content">
                    <p>Olá <strong>${updatedUser.name}</strong>,</p>
                    <p>Suas informações de acesso foram atualizadas no sistema.</p>
                    
                    <div class="info-box">
                      <h3 style="margin-top: 0; color: #1f2937;">Resumo da Atualização</h3>
                      <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="badge ${updatedUser.active ? 'badge-active' : 'badge-inactive'}">
                          ${updatedUser.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Permissões:</span>
                        <span class="info-value">${permissionsCount} permissões configuradas</span>
                      </div>
                      <div class="info-row" style="border: none;">
                        <span class="info-label">Data da alteração:</span>
                        <span class="info-value">${new Date().toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                    
                    ${!updatedUser.active ? `
                      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <strong style="color: #92400e;">⚠️ Atenção:</strong>
                        <p style="margin: 5px 0 0 0; color: #78350f;">
                          Sua conta foi desativada e você não poderá mais acessar o sistema até que ela seja reativada por um administrador.
                        </p>
                      </div>
                    ` : `
                      <div class="alert-info">
                        <strong style="color: #1e40af;">ℹ️ Primeiro Acesso?</strong>
                        <p style="margin: 5px 0 0 0; color: #1e3a8a;">
                          Se você ainda não definiu sua senha, verifique seu email de convite original com a senha temporária.
                          Caso não encontre, entre em contato com o administrador para reenviar o convite.
                        </p>
                      </div>
                      
                      <div style="text-align: center; margin: 30px 0;">
                        <p style="color: #1f2937; font-size: 16px; margin-bottom: 15px;">
                          <strong>🔑 Acessar o Sistema:</strong>
                        </p>
                        <a href="${loginUrl}" class="btn-login">
                          Fazer Login
                        </a>
                        <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
                          Use seu email (<strong>${updatedUser.email}</strong>) e sua senha
                        </p>
                      </div>
                    `}
                    
                    <div class="footer">
                      <p>Este é um email automático de notificação do sistema.</p>
                      <p><strong>Sistema de Agendamento para Salões & Barbearias</strong></p>
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `,
        }),
      })
      
      console.log("✅ Email de notificação de atualização enviado para elias157508@gmail.com")
    } catch (emailError) {
      console.error("⚠️ Erro ao enviar email de notificação:", emailError)
      // Não falha a atualização se o email falhar
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}
