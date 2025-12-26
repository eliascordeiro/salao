import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { name, email, phone, password, role } = await request.json()

    // Validações
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (!phone || phone.trim() === '') {
      return NextResponse.json(
        { error: "Telefone é obrigatório para receber notificações WhatsApp" },
        { status: 400 }
      )
    }

    // Validar formato do telefone (apenas números, deve ter 10 ou 11 dígitos)
    const phoneNumbers = phone.replace(/\D/g, '')
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      return NextResponse.json(
        { error: "Telefone inválido. Digite um número válido com DDD" },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 400 }
      )
    }

    // Determinar role
    // Se role foi passado, verificar se quem está criando tem permissão
    let userRole = "CLIENT";
    if (role) {
      const session = await getServerSession(authOptions);
      // Apenas admin/staff pode definir role
      if (session && (session.user.role === "ADMIN" || session.user.role === "STAFF")) {
        userRole = role;
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10)

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phoneNumbers, // Salvar apenas números (sem formatação)
        password: hashedPassword,
        role: userRole
      }
    })

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { user: userWithoutPassword, message: "Conta criada com sucesso!" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro ao criar conta. Tente novamente." },
      { status: 500 }
    )
  }
}
