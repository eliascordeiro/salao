import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/**
 * Obtém o salão associado ao usuário logado
 * - Se o usuário é OWNER, retorna o salão que ele possui
 * - Se o usuário é ADMIN, retorna o primeiro salão (ou podemos criar lógica específica)
 * - Se não encontrar, retorna null
 */
export async function getUserSalon() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }

  try {
    // Buscar usuário com seu salão
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedSalons: {
          where: { active: true },
          take: 1
        }
      }
    })

    if (!user) {
      return null
    }

    // Se o usuário tem salão próprio, retornar o primeiro
    if (user.ownedSalons && user.ownedSalons.length > 0) {
      return user.ownedSalons[0]
    }

    // Se o usuário não tem salão próprio mas é ADMIN, 
    // retornar o primeiro salão ativo do sistema
    if (user.role === 'ADMIN') {
      const firstSalon = await prisma.salon.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'asc' }
      })
      return firstSalon
    }

    return null
  } catch (error) {
    console.error('Erro ao buscar salão do usuário:', error)
    return null
  }
}

/**
 * Obtém apenas o ID do salão do usuário logado
 */
export async function getUserSalonId(): Promise<string | null> {
  const salon = await getUserSalon()
  return salon?.id || null
}

/**
 * Verifica se o usuário tem acesso a um salão específico
 */
export async function canAccessSalon(salonId: string): Promise<boolean> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return false
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        ownedSalons: {
          where: { id: salonId, active: true }
        }
      }
    })

    if (!user) {
      return false
    }

    // Se é owner do salão, tem acesso
    if (user.ownedSalons.some(s => s.id === salonId)) {
      return true
    }

    // Se é ADMIN, tem acesso a todos os salões
    if (user.role === 'ADMIN') {
      return true
    }

    return false
  } catch (error) {
    console.error('Erro ao verificar acesso ao salão:', error)
    return false
  }
}
