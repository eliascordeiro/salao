/**
 * Helper functions para verificação de permissões nas APIs
 */

import { Session } from "next-auth";
import { PERMISSIONS } from "./permissions";

/**
 * Verifica se o usuário tem uma permissão específica
 * 
 * @param session - Sessão do NextAuth
 * @param permission - Permissão a ser verificada (ex: PERMISSIONS.BOOKINGS_VIEW)
 * @returns true se o usuário tem a permissão
 */
export function hasPermission(session: Session | null, permission: string): boolean {
  if (!session?.user) return false;
  
  // ADMIN sempre tem todas as permissões
  if (session.user.role === "ADMIN") return true;
  
  // Verificar nas permissões do usuário
  const userPermissions = (session.user as any).permissions;
  if (userPermissions && Array.isArray(userPermissions)) {
    return userPermissions.includes(permission);
  }
  
  return false;
}

/**
 * Verifica se o usuário tem qualquer uma das permissões especificadas
 * 
 * @param session - Sessão do NextAuth
 * @param permissions - Array de permissões
 * @returns true se o usuário tem pelo menos uma das permissões
 */
export function hasAnyPermission(session: Session | null, permissions: string[]): boolean {
  if (!session?.user) return false;
  
  // ADMIN sempre tem todas as permissões
  if (session.user.role === "ADMIN") return true;
  
  const userPermissions = (session.user as any).permissions;
  if (userPermissions && Array.isArray(userPermissions)) {
    return permissions.some(permission => userPermissions.includes(permission));
  }
  
  return false;
}

/**
 * Verifica se o usuário tem todas as permissões especificadas
 * 
 * @param session - Sessão do NextAuth
 * @param permissions - Array de permissões
 * @returns true se o usuário tem todas as permissões
 */
export function hasAllPermissions(session: Session | null, permissions: string[]): boolean {
  if (!session?.user) return false;
  
  // ADMIN sempre tem todas as permissões
  if (session.user.role === "ADMIN") return true;
  
  const userPermissions = (session.user as any).permissions;
  if (userPermissions && Array.isArray(userPermissions)) {
    return permissions.every(permission => userPermissions.includes(permission));
  }
  
  return false;
}

/**
 * Verifica se o usuário é OWNER (proprietário do salão)
 * 
 * @param session - Sessão do NextAuth
 * @returns true se o usuário é OWNER
 */
export function isOwner(session: Session | null): boolean {
  if (!session?.user) return false;
  
  const roleType = (session.user as any).roleType;
  return roleType === "OWNER" || session.user.role === "ADMIN";
}

/**
 * Verifica se o usuário é ADMIN
 * 
 * @param session - Sessão do NextAuth
 * @returns true se o usuário é ADMIN
 */
export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  return session.user.role === "ADMIN";
}
