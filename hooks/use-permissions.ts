"use client"

import { useSession } from "next-auth/react"
import { Permission, hasPermission, hasAllPermissions, hasAnyPermission } from "@/lib/permissions"

export function usePermissions() {
  const { data: session } = useSession()
  
  // Get user permissions from session
  const userPermissions = (session?.user as any)?.permissions || []
  
  // If user is ADMIN (owner), they have all permissions
  const isOwner = session?.user?.role === "ADMIN"
  
  const checkPermission = (permission: Permission): boolean => {
    if (isOwner) return true
    return hasPermission(userPermissions, permission)
  }
  
  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (isOwner) return true
    return hasAllPermissions(userPermissions, permissions)
  }
  
  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (isOwner) return true
    return hasAnyPermission(userPermissions, permissions)
  }
  
  return {
    permissions: userPermissions,
    isOwner,
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission,
  }
}
