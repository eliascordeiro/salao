import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // Remover adapter quando usando JWT strategy
  // adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "seu@email.com" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email e senha são obrigatórios")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          throw new Error("Usuário não encontrado")
        }

        // Check if user is active
        if (!user.active) {
          throw new Error("Usuário inativo. Entre em contato com o administrador.")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Senha incorreta")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          roleType: user.roleType,
          permissions: user.permissions,
          createdAt: user.createdAt,
          image: user.image
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    signOut: "/",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Login com Google OAuth
      if (account?.provider === "google") {
        try {
          // Verificar se usuário já existe
          let existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Usuário já existe
            console.log("✅ Usuário Google existente:", user.email)
            
            // Se usuário estava inativo, reativar automaticamente via Google OAuth
            if (!existingUser.active) {
              console.log("🔄 Reativando usuário inativo via Google OAuth:", user.email)
              await prisma.user.update({
                where: { email: user.email! },
                data: { 
                  active: true,
                  image: user.image || existingUser.image
                }
              })
            } else if (user.image && !existingUser.image) {
              // Atualizar apenas imagem se usuário já está ativo
              await prisma.user.update({
                where: { email: user.email! },
                data: { image: user.image }
              })
            }
            
            // Atualizar user.id para JWT
            user.id = existingUser.id
          } else {
            // Criar novo usuário
            console.log("✅ Criando novo usuário Google:", user.email)
            
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name || "",
                image: user.image,
                role: "CLIENT",
                roleType: null,
                active: true,
                password: "", // OAuth não precisa senha
                permissions: []
              }
            })
            
            console.log("✅ Usuário criado:", newUser.id)
            
            // Atualizar user.id para JWT
            user.id = newUser.id
          }
        } catch (error) {
          console.error("❌ Erro no signIn Google callback:", error)
          return false // Bloquear login se houver erro
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.roleType = (user as any).roleType
        token.permissions = (user as any).permissions || []
        token.createdAt = (user as any).createdAt
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        ;(session.user as any).roleType = token.roleType
        ;(session.user as any).permissions = token.permissions || []
        ;(session.user as any).createdAt = token.createdAt
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
