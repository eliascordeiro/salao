import { UserCog, Settings, Headset } from "lucide-react"
import { MenuModule } from "../types"

/**
 * Módulo ADMIN - Administracao e configuracoes
 */
export const adminModule: MenuModule = {
  id: "admin",
  name: "Administração",
  version: "1.0.0",
  description: "Configurações administrativas e suporte",
  enabled: true,
  items: [
    {
      id: "users",
      label: "Usuários",
      icon: UserCog,
      href: "/dashboard/usuarios",
      permission: "users.view",
      order: 1,
      group: "admin",
    },
    {
      id: "platform-support",
      label: "Suporte",
      icon: Headset,
      href: "/dashboard/suporte-plataforma",
      order: 2,
      group: "admin",
    },
    {
      id: "settings",
      label: "Configurações",
      icon: Settings,
      href: "/dashboard/configuracoes",
      permission: "settings.view",
      order: 3,
      group: "admin",
    },
  ],
}
