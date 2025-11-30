/**
 * Index de todos os módulos de menu
 * 
 * Para adicionar um novo módulo:
 * 1. Crie um arquivo [nome].module.ts nesta pasta
 * 2. Defina seu MenuModule com itens
 * 3. Importe e exporte aqui
 * 4. Registre em setup.ts
 * 
 * O sistema detectará e incluirá automaticamente!
 */

export { coreModule } from "./core.module"
export { financialModule } from "./financial.module"
export { adminModule } from "./admin.module"

// Adicione novos módulos aqui:
// export { novoModule } from "./novo.module"
