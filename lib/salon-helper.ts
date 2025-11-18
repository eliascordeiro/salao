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
  
  console.log('[getUserSalon] Session:', session?.user?.email)
  
  if (!session?.user?.id) {
    console.log('[getUserSalon] Sem sessão ou user ID')
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
        },
        owner: {
          include: {
            ownedSalons: {
              where: { active: true },
              take: 1
            }
          }
        }
      }
    })

    console.log('[getUserSalon] User encontrado:', user?.email)
    console.log('[getUserSalon] Salões próprios:', user?.ownedSalons?.length || 0)

    if (!user) {
      console.log('[getUserSalon] User não encontrado')
      return null
    }

    // Se o usuário tem salão próprio, retornar o primeiro
    if (user.ownedSalons && user.ownedSalons.length > 0) {
      console.log('[getUserSalon] Retornando salão próprio:', user.ownedSalons[0].name)
      return user.ownedSalons[0]
    }

    // Se o usuário é gerenciado (tem ownerId), buscar o salão do owner
    if (user.ownerId && user.owner) {
      console.log('[getUserSalon] Usuário gerenciado, buscando salão do owner...')
      if (user.owner.ownedSalons && user.owner.ownedSalons.length > 0) {
        console.log('[getUserSalon] Retornando salão do owner:', user.owner.ownedSalons[0].name)
        return user.owner.ownedSalons[0]
      }
    }

    // Se o usuário não tem salão próprio mas é ADMIN, 
    // retornar o primeiro salão ativo do sistema
    if (user.role === 'ADMIN') {
      console.log('[getUserSalon] Admin sem salão, buscando primeiro do sistema...')
      const firstSalon = await prisma.salon.findFirst({
        where: { active: true },
        orderBy: { createdAt: 'asc' }
      })
      console.log('[getUserSalon] Primeiro salão:', firstSalon?.name || 'nenhum')
      return firstSalon
    }

    console.log('[getUserSalon] Nenhum salão encontrado')
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
        },
        owner: {
          include: {
            ownedSalons: {
              where: { id: salonId, active: true }
            }
          }
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

    // Se é usuário gerenciado, verificar se o salão pertence ao owner
    if (user.ownerId && user.owner) {
      if (user.owner.ownedSalons.some(s => s.id === salonId)) {
        return true
      }
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
