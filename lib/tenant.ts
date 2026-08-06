import { prisma } from "@/lib/prisma"

type TenantUser = {
  role: string
  roleType: string | null
  ownerId: string | null
}

/**
 * Resolve o salão principal associado a um usuário.
 * Prioridade:
 * - perfil de staff vinculado
 * - salão próprio do owner
 * - salão do owner direto
 * - primeiro salão ativo para ADMIN
 */
export async function getTenantSalonIdByUserId(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        roleType: true,
        ownerId: true,
        staffProfile: {
          select: {
            salonId: true,
          },
        },
        ownedSalons: {
          where: { active: true },
          select: {
            id: true,
          },
          take: 1,
        },
        owner: {
          select: {
            ownedSalons: {
              where: { active: true },
              select: {
                id: true,
              },
              take: 1,
            },
          },
        },
      },
    })

    if (!user) {
      return null
    }

    if (user.staffProfile?.salonId) {
      return user.staffProfile.salonId
    }

    if (user.ownedSalons.length > 0) {
      return user.ownedSalons[0].id
    }

    if (user.ownerId && user.owner?.ownedSalons.length) {
      return user.owner.ownedSalons[0].id
    }

    if (user.role === "ADMIN") {
      const firstSalon = await prisma.salon.findFirst({
        where: { active: true },
        select: { id: true },
        orderBy: { createdAt: "asc" },
      })

      return firstSalon?.id || null
    }

    return null
  } catch (error) {
    console.error("[getTenantSalonIdByUserId] Erro:", error)
    return null
  }
}

export async function getTenantContextByUserId(userId: string) {
  const salonId = await getTenantSalonIdByUserId(userId)

  return {
    salonId,
  }
}

export function isTenantUser(user: TenantUser) {
  return user.roleType === "STAFF" || user.roleType === "OWNER" || user.ownerId !== null
}