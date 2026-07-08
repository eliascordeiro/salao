import { prisma } from "@/lib/prisma";

/**
 * Verifica se uma assinatura está liberada (ativa ou em período de trial).
 * No modelo de plano único por cadeira, isso libera TODAS as features.
 */
export function isSubscriptionUnlocked(subscription: {
  status: string;
  trialEndsAt?: Date | null;
} | null | undefined): boolean {
  if (!subscription) return false;
  if (subscription.status === "ACTIVE") return true;
  // Trial ainda válido também libera o acesso
  if (
    subscription.status === "PENDING" &&
    subscription.trialEndsAt &&
    new Date(subscription.trialEndsAt) > new Date()
  ) {
    return true;
  }
  return false;
}

/**
 * Features disponíveis no sistema
 */
export const FEATURES = {
  // Notificações
  WHATSAPP_NOTIFICATIONS: "whatsapp",
  EMAIL_NOTIFICATIONS: "email",
  SMS_NOTIFICATIONS: "sms",
  
  // Mapas e Navegação
  MAPS_NAVIGATION: "maps",
  GEOLOCATION: "geolocation",
  
  // Relatórios
  BASIC_REPORTS: "basicReports",
  ADVANCED_REPORTS: "advancedReports",
  FINANCIAL_REPORTS: "financialReports",
  
  // Usuários
  MULTI_USER: "multiUser",
  USER_PERMISSIONS: "userPermissions",
  
  // Outros
  AI_CHAT: "aiChat",
  CUSTOM_BRANDING: "customBranding",
  API_ACCESS: "apiAccess",
  PRIORITY_SUPPORT: "prioritySupport",
} as const;

/**
 * Configuração de features por plano
 */
export const PLAN_FEATURES = {
  ESSENCIAL: {
    email: true,
    basicReports: true,
    geolocation: true,
    // Tudo que não está listado = false
  },
  PROFISSIONAL: {
    email: true,
    whatsapp: true,
    sms: false, // Futuro
    maps: true,
    geolocation: true,
    basicReports: true,
    advancedReports: true,
    financialReports: true,
    multiUser: true,
    userPermissions: true,
    aiChat: true,
    customBranding: false, // Futuro
    apiAccess: false, // Futuro
    prioritySupport: true,
  },
} as const;

/**
 * Plano único "Premium": todas as features liberadas para assinantes ativos.
 */
export const ALL_FEATURES_ENABLED: Record<string, boolean> = {
  email: true,
  whatsapp: true,
  sms: true,
  maps: true,
  geolocation: true,
  basicReports: true,
  advancedReports: true,
  financialReports: true,
  multiUser: true,
  userPermissions: true,
  aiChat: true,
  customBranding: true,
  apiAccess: true,
  prioritySupport: true,
};

/**
 * Labels amigáveis para features
 */
export const FEATURE_LABELS: Record<string, string> = {
  email: "Notificações por Email",
  whatsapp: "Notificações por WhatsApp",
  sms: "Notificações por SMS",
  maps: "Navegação com Mapbox",
  geolocation: "Geolocalização",
  basicReports: "Relatórios Básicos",
  advancedReports: "Relatórios Avançados",
  financialReports: "Relatórios Financeiros",
  multiUser: "Múltiplos Usuários",
  userPermissions: "Controle de Permissões",
  aiChat: "Chat com IA",
  customBranding: "Marca Personalizada",
  apiAccess: "Acesso à API",
  prioritySupport: "Suporte Prioritário",
};

/**
 * Verifica se um salão tem acesso a uma feature
 */
export async function hasFeature(
  salonId: string,
  feature: string
): Promise<boolean> {
  try {
    // 🔧 DESENVOLVIMENTO: Permitir todas as features em dev
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Feature "${feature}" liberada para desenvolvimento`);
      return true;
    }
    
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!salon || !salon.subscription) {
      // Sem assinatura = apenas features básicas
      return feature === FEATURES.EMAIL_NOTIFICATIONS || 
             feature === FEATURES.BASIC_REPORTS;
    }

    // Plano único (por cadeira): assinatura ativa ou em trial libera TODAS as features
    if (isSubscriptionUnlocked(salon.subscription)) {
      return true;
    }

    // Assinatura inativa/expirada = apenas features básicas
    return feature === FEATURES.EMAIL_NOTIFICATIONS || 
           feature === FEATURES.BASIC_REPORTS;
  } catch (error) {
    console.error("Erro ao verificar feature:", error);
    // Em caso de erro, permitir apenas features básicas
    return feature === FEATURES.EMAIL_NOTIFICATIONS || 
           feature === FEATURES.BASIC_REPORTS;
  }
}

/**
 * Verifica se um usuário tem acesso a uma feature (via salão)
 */
export async function userHasFeature(
  userId: string,
  feature: string
): Promise<boolean> {
  try {
    // Buscar salão do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedSalons: {
          take: 1,
          include: {
            subscription: {
              include: {
                plan: true,
              },
            },
          },
        },
      },
    });

    if (!user || user.ownedSalons.length === 0) {
      return feature === FEATURES.EMAIL_NOTIFICATIONS || 
             feature === FEATURES.BASIC_REPORTS;
    }

    const salon = user.ownedSalons[0];
    return hasFeature(salon.id, feature);
  } catch (error) {
    console.error("Erro ao verificar feature do usuário:", error);
    return feature === FEATURES.EMAIL_NOTIFICATIONS || 
           feature === FEATURES.BASIC_REPORTS;
  }
}

/**
 * Retorna todas as features de um salão
 */
export async function getSalonFeatures(salonId: string): Promise<Record<string, boolean>> {
  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!salon || !salon.subscription || !isSubscriptionUnlocked(salon.subscription)) {
      // Features básicas apenas
      return {
        email: true,
        basicReports: true,
        whatsapp: false,
        maps: false,
        advancedReports: false,
        financialReports: false,
        multiUser: false,
        userPermissions: false,
        aiChat: false,
        prioritySupport: false,
      };
    }

    // Plano único: assinatura desbloqueada libera todas as features
    return ALL_FEATURES_ENABLED;
  } catch (error) {
    console.error("Erro ao buscar features do salão:", error);
    return {
      email: true,
      basicReports: true,
      whatsapp: false,
      maps: false,
      advancedReports: false,
      financialReports: false,
      multiUser: false,
      userPermissions: false,
      aiChat: false,
      prioritySupport: false,
    };
  }
}

/**
 * Retorna o plano de um salão
 */
export async function getSalonPlan(salonId: string) {
  try {
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    return salon?.subscription?.plan || null;
  } catch (error) {
    console.error("Erro ao buscar plano do salão:", error);
    return null;
  }
}
