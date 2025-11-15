/**
 * Sistema de Permissões Granulares
 * Define todas as permissões disponíveis no sistema
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",
  
  // Salão
  SALON_VIEW: "salon.view",
  SALON_EDIT: "salon.edit",
  
  // Agendamentos
  BOOKINGS_VIEW: "bookings.view",
  BOOKINGS_CREATE: "bookings.create",
  BOOKINGS_EDIT: "bookings.edit",
  BOOKINGS_DELETE: "bookings.delete",
  BOOKINGS_CHANGE_STATUS: "bookings.changeStatus",
  
  // Profissionais
  STAFF_VIEW: "staff.view",
  STAFF_CREATE: "staff.create",
  STAFF_EDIT: "staff.edit",
  STAFF_DELETE: "staff.delete",
  
  // Serviços
  SERVICES_VIEW: "services.view",
  SERVICES_CREATE: "services.create",
  SERVICES_EDIT: "services.edit",
  SERVICES_DELETE: "services.delete",
  
  // Caixa
  CASHIER_VIEW: "cashier.view",
  CASHIER_OPEN_SESSION: "cashier.openSession",
  CASHIER_CLOSE_SESSION: "cashier.closeSession",
  
  // Contas a Pagar
  EXPENSES_VIEW: "expenses.view",
  EXPENSES_CREATE: "expenses.create",
  EXPENSES_EDIT: "expenses.edit",
  EXPENSES_DELETE: "expenses.delete",
  
  // Análise Financeira
  FINANCIAL_VIEW: "financial.view",
  
  // Usuários (apenas OWNER)
  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_EDIT: "users.edit",
  USERS_DELETE: "users.delete",
  
  // Configurações
  SETTINGS_VIEW: "settings.view",
  SETTINGS_EDIT: "settings.edit",
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Grupos de permissões por módulo (para organização na UI)
 */
export const PERMISSION_GROUPS = [
  {
    label: "Dashboard",
    description: "Visualização do painel principal com estatísticas",
    permissions: [
      { key: PERMISSIONS.DASHBOARD_VIEW, label: "Visualizar Dashboard" },
    ],
  },
  {
    label: "Meu Salão",
    description: "Gerenciar informações do salão",
    permissions: [
      { key: PERMISSIONS.SALON_VIEW, label: "Visualizar dados do salão" },
      { key: PERMISSIONS.SALON_EDIT, label: "Editar dados do salão" },
    ],
  },
  {
    label: "Agendamentos",
    description: "Gerenciar agendamentos de clientes",
    permissions: [
      { key: PERMISSIONS.BOOKINGS_VIEW, label: "Visualizar agendamentos" },
      { key: PERMISSIONS.BOOKINGS_CREATE, label: "Criar agendamentos" },
      { key: PERMISSIONS.BOOKINGS_EDIT, label: "Editar agendamentos" },
      { key: PERMISSIONS.BOOKINGS_DELETE, label: "Cancelar agendamentos" },
      { key: PERMISSIONS.BOOKINGS_CHANGE_STATUS, label: "Alterar status dos agendamentos" },
    ],
  },
  {
    label: "Profissionais",
    description: "Gerenciar equipe de profissionais",
    permissions: [
      { key: PERMISSIONS.STAFF_VIEW, label: "Visualizar profissionais" },
      { key: PERMISSIONS.STAFF_CREATE, label: "Cadastrar profissionais" },
      { key: PERMISSIONS.STAFF_EDIT, label: "Editar profissionais" },
      { key: PERMISSIONS.STAFF_DELETE, label: "Excluir profissionais" },
    ],
  },
  {
    label: "Serviços",
    description: "Gerenciar catálogo de serviços",
    permissions: [
      { key: PERMISSIONS.SERVICES_VIEW, label: "Visualizar serviços" },
      { key: PERMISSIONS.SERVICES_CREATE, label: "Cadastrar serviços" },
      { key: PERMISSIONS.SERVICES_EDIT, label: "Editar serviços" },
      { key: PERMISSIONS.SERVICES_DELETE, label: "Excluir serviços" },
    ],
  },
  {
    label: "Caixa",
    description: "Controle de caixa e pagamentos",
    permissions: [
      { key: PERMISSIONS.CASHIER_VIEW, label: "Visualizar caixa" },
      { key: PERMISSIONS.CASHIER_OPEN_SESSION, label: "Abrir sessão de caixa" },
      { key: PERMISSIONS.CASHIER_CLOSE_SESSION, label: "Fechar sessão de caixa" },
    ],
  },
  {
    label: "Contas a Pagar",
    description: "Gerenciar despesas e contas",
    permissions: [
      { key: PERMISSIONS.EXPENSES_VIEW, label: "Visualizar despesas" },
      { key: PERMISSIONS.EXPENSES_CREATE, label: "Cadastrar despesas" },
      { key: PERMISSIONS.EXPENSES_EDIT, label: "Editar despesas" },
      { key: PERMISSIONS.EXPENSES_DELETE, label: "Excluir despesas" },
    ],
  },
  {
    label: "Análise Financeira",
    description: "Visualizar relatórios financeiros",
    permissions: [
      { key: PERMISSIONS.FINANCIAL_VIEW, label: "Visualizar relatórios financeiros" },
    ],
  },
  {
    label: "Usuários",
    description: "Gerenciar usuários do salão (apenas proprietário)",
    permissions: [
      { key: PERMISSIONS.USERS_VIEW, label: "Visualizar usuários" },
      { key: PERMISSIONS.USERS_CREATE, label: "Criar usuários" },
      { key: PERMISSIONS.USERS_EDIT, label: "Editar usuários" },
      { key: PERMISSIONS.USERS_DELETE, label: "Excluir usuários" },
    ],
  },
  {
    label: "Configurações",
    description: "Acessar configurações do sistema",
    permissions: [
      { key: PERMISSIONS.SETTINGS_VIEW, label: "Visualizar configurações" },
      { key: PERMISSIONS.SETTINGS_EDIT, label: "Editar configurações" },
    ],
  },
] as const;

/**
 * Permissões completas para OWNER (proprietário do salão)
 */
export const OWNER_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

/**
 * Verifica se um usuário tem todas as permissões necessárias
 */
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

/**
 * Verifica se um usuário tem pelo menos uma das permissões
 */
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}
