"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Permission } from "@/lib/permissions"
import { hasRouteAccess } from "@/lib/navigation-helper"

interface RouteGuardProps {
  children: React.ReactNode
  requiredPermission?: Permission | Permission[]
  requireAll?: boolean // If multiple permissions, require all (AND) vs any (OR)
  fallbackRoute?: string
}

/**
 * Component to protect routes based on user permissions
 * Redirects to fallback route if user lacks required permissions
 */
export function RouteGuard({
  children,
  requiredPermission,
  requireAll = false,
  fallbackRoute = "/dashboard/acesso-negado"
}: RouteGuardProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // Wait for session to load
    if (status === "loading") return

    // Not authenticated - will be handled by middleware
    if (status === "unauthenticated") return

    // No permission required, allow access
    if (!requiredPermission) return

    const userPermissions = ((session?.user as any)?.permissions || []) as Permission[]
    const roleType = (session?.user as any)?.roleType

    // Owners have access to everything
    if (roleType === "OWNER") return

    // Check permissions
    let hasAccess = false
    
    if (Array.isArray(requiredPermission)) {
      if (requireAll) {
        // Require ALL permissions (AND)
        hasAccess = requiredPermission.every(perm => userPermissions.includes(perm))
      } else {
        // Require ANY permission (OR)
        hasAccess = requiredPermission.some(perm => userPermissions.includes(perm))
      }
    } else {
      // Single permission
      hasAccess = userPermissions.includes(requiredPermission)
    }

    // Redirect if no access
    if (!hasAccess) {
      console.warn("⚠️ Access denied:", {
        required: requiredPermission,
        has: userPermissions,
        requireAll
      })
      router.replace(fallbackRoute)
    }
  }, [session, status, requiredPermission, requireAll, fallbackRoute, router])

  // Show children if authenticated and has permission
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
