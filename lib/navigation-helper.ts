import { Permission } from "./permissions"

/**
 * Menu items with their required permissions
 * This matches the sidebar configuration
 */
export const NAVIGATION_ROUTES = [
  {
    label: "Dashboard",
    href: "/dashboard",
    permission: "dashboard.view",
  },
  {
    label: "Meu Salão",
    href: "/dashboard/meu-salao",
    permission: "salon.view",
  },
  {
    label: "Agendamentos",
    href: "/dashboard/agendamentos",
    permission: "bookings.view",
  },
  {
    label: "Profissionais",
    href: "/dashboard/profissionais",
    permission: "staff.view",
  },
  {
    label: "Serviços",
    href: "/dashboard/servicos",
    permission: "services.view",
  },
  {
    label: "Caixa",
    href: "/dashboard/caixa",
    permission: "cashier.view",
  },
  {
    label: "Contas a Pagar",
    href: "/dashboard/contas-a-pagar",
    permission: "expenses.view",
  },
  {
    label: "Análise Financeira",
    href: "/dashboard/financeiro",
    permission: "financial.view",
  },
  {
    label: "Usuários",
    href: "/dashboard/usuarios",
    permission: "users.view",
  },
  {
    label: "Assinatura",
    href: "/dashboard/assinatura",
    permission: null, // No permission required
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    permission: "settings.view",
  },
] as const

/**
 * Get the first accessible route for a user based on their permissions
 * @param permissions - Array of user permissions
 * @param roleType - User's role type (OWNER, STAFF, CUSTOM)
 * @returns The first accessible route href
 */
export function getFirstAccessibleRoute(
  permissions: Permission[],
  roleType?: string | null
): string {
  // Owners have access to everything, default to dashboard
  if (roleType === "OWNER") {
    return "/dashboard"
  }

  // For other users, find first route they have permission for
  for (const route of NAVIGATION_ROUTES) {
    // If no permission required, it's accessible
    if (!route.permission) {
      return route.href
    }

    // Check if user has the required permission
    if (permissions.includes(route.permission as Permission)) {
      return route.href
    }
  }

  // Fallback: if user has no permissions, redirect to a "no access" page
  // or just dashboard (they'll see a limited view)
  return "/dashboard"
}

/**
 * Check if user has access to a specific route
 * @param route - The route to check
 * @param permissions - Array of user permissions
 * @param roleType - User's role type
 * @returns boolean indicating if user has access
 */
export function hasRouteAccess(
  route: string,
  permissions: Permission[],
  roleType?: string | null
): boolean {
  // Owners have access to everything
  if (roleType === "OWNER") {
    return true
  }

  // Find the route in navigation
  const navRoute = NAVIGATION_ROUTES.find(r => r.href === route)
  
  // If route not found in navigation, check if it's a sub-route
  if (!navRoute) {
    // Check parent routes (e.g., /dashboard/agendamentos/novo -> /dashboard/agendamentos)
    const parentRoute = NAVIGATION_ROUTES.find(r => route.startsWith(r.href))
    if (parentRoute) {
      return !parentRoute.permission || permissions.includes(parentRoute.permission as Permission)
    }
    // Unknown route, deny access by default
    return false
  }

  // If no permission required, allow access
  if (!navRoute.permission) {
    return true
  }

  // Check if user has required permission
  return permissions.includes(navRoute.permission as Permission)
}
