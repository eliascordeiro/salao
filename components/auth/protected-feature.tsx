"use client"

import { usePermissions } from "@/hooks/use-permissions"
import { Permission } from "@/lib/permissions"

interface ProtectedFeatureProps {
  permission: Permission | Permission[]
  fallback?: React.ReactNode
  requireAll?: boolean // If true, requires all permissions (AND). If false, requires any (OR). Default: false
  children: React.ReactNode
}

export function ProtectedFeature({
  permission,
  fallback = null,
  requireAll = false,
  children,
}: ProtectedFeatureProps) {
  const { hasPermission, hasAllPermissions, hasAnyPermission, isOwner } = usePermissions()
  
  // Owner has access to everything
  if (isOwner) {
    return <>{children}</>
  }
  
  // Check permission(s)
  let hasAccess = false
  
  if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
  } else {
    hasAccess = hasPermission(permission)
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}
