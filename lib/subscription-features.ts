import { prisma } from "@/lib/prisma";

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

    // Verificar se assinatura está ativa
    if (salon.subscription.status !== "ACTIVE") {
      return feature === FEATURES.EMAIL_NOTIFICATIONS || 
             feature === FEATURES.BASIC_REPORTS;
    }

    // Verificar feature no plano
    const planFeatures = salon.subscription.plan.features as Record<string, boolean>;
    return planFeatures[feature] === true;
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

    if (!salon || !salon.subscription || salon.subscription.status !== "ACTIVE") {
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

    return salon.subscription.plan.features as Record<string, boolean>;
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
