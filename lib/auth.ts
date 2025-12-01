import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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
      // Permitir login com Google
      if (account?.provider === "google") {
        try {
          // Verificar se usuário já existe
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! }
          })

          if (existingUser) {
            // Usuário já existe, atualizar imagem se necessário
            if (user.image && !existingUser.image) {
              await prisma.user.update({
                where: { email: user.email! },
                data: { image: user.image }
              })
            }
          } else {
            // Novo usuário - PrismaAdapter já criou, apenas configurar role
            // Aguardar um momento para o adapter criar
            await new Promise(resolve => setTimeout(resolve, 100))
            
            const newUser = await prisma.user.findUnique({
              where: { email: user.email! }
            })
            
            if (newUser) {
              await prisma.user.update({
                where: { email: user.email! },
                data: {
                  role: "CLIENT",
                  roleType: null,
                  active: true,
                  password: ""
                }
              })
            }
          }
        } catch (error) {
          console.error("Erro no signIn callback:", error)
          // Continuar mesmo com erro para não bloquear o login
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
