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

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}
