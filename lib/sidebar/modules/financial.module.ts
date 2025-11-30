import { Receipt, TrendingUp } from "lucide-react"
import { MenuModule } from "../types"

/**
 * Módulo FINANCEIRO - Gestão financeira e análises
 */
export const financialModule: MenuModule = {
  id: "financial",
  name: "Financeiro",
  version: "1.0.0",
  description: "Módulo de gestão financeira, despesas e análises",
  enabled: true,
  items: [
    {
      id: "expenses",
      label: "Contas a Pagar",
      icon: Receipt,
      href: "/dashboard/contas-a-pagar",
      permission: "expenses.view",
      order: 1,
      group: "financial",
    },
    {
      id: "financial-analysis",
      label: "Análise Financeira",
      icon: TrendingUp,
      href: "/dashboard/financeiro",
      permission: "financial.view",
      order: 2,
      group: "financial",
    },
  ],
}
