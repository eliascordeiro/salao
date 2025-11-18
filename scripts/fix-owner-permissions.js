/**
 * Script para corrigir permissões de proprietários de salão
 * Atualiza usuários ADMIN sem roleType para OWNER com todas as permissões
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Todas as permissões do OWNER
const OWNER_PERMISSIONS = [
  // Dashboard
  "VIEW_DASHBOARD",
  
  // Salão
  "VIEW_SALON",
  "EDIT_SALON",
  
  // Agendamentos
  "VIEW_BOOKINGS",
  "CREATE_BOOKING",
  "EDIT_BOOKING",
  "DELETE_BOOKING",
  
  // Profissionais
  "VIEW_STAFF",
  "CREATE_STAFF",
  "EDIT_STAFF",
  "DELETE_STAFF",
  
  // Serviços
  "VIEW_SERVICES",
  "CREATE_SERVICE",
  "EDIT_SERVICE",
  "DELETE_SERVICE",
  
  // Caixa/Pagamentos
  "VIEW_PAYMENTS",
  "MANAGE_PAYMENTS",
  
  // Despesas
  "VIEW_EXPENSES",
  "CREATE_EXPENSE",
  "EDIT_EXPENSE",
  "DELETE_EXPENSE",
  
  // Relatórios Financeiros
  "VIEW_FINANCIAL_REPORTS",
  
  // Gestão de Usuários
  "VIEW_USERS",
  "CREATE_USER",
  "EDIT_USER",
  "DELETE_USER",
  
  // Configurações
  "VIEW_SETTINGS",
  "EDIT_SETTINGS",
];

async function fixOwnerPermissions() {
  try {
    console.log("🔍 Procurando proprietários de salão sem permissões corretas...\n");
    
    // Buscar todos os usuários ADMIN que são donos de salão
    const salons = await prisma.salon.findMany({
      include: {
        owner: true,
      },
    });
    
    console.log(`📊 Encontrados ${salons.length} salões\n`);
    
    let updatedCount = 0;
    
    for (const salon of salons) {
      const owner = salon.owner;
      
      console.log(`\n🏪 Salão: ${salon.name}`);
      console.log(`👤 Proprietário: ${owner.name} (${owner.email})`);
      console.log(`   Role: ${owner.role}`);
      console.log(`   RoleType: ${owner.roleType || 'NÃO DEFINIDO'}`);
      console.log(`   Permissões atuais: ${owner.permissions?.length || 0}`);
      
      // Verificar se precisa atualizar
      const needsUpdate = 
        owner.roleType !== "OWNER" || 
        !owner.permissions || 
        owner.permissions.length < OWNER_PERMISSIONS.length;
      
      if (needsUpdate) {
        console.log(`   ⚠️  PRECISA DE ATUALIZAÇÃO`);
        
        await prisma.user.update({
          where: { id: owner.id },
          data: {
            roleType: "OWNER",
            permissions: OWNER_PERMISSIONS,
            isActive: true,
          },
        });
        
        console.log(`   ✅ ATUALIZADO com ${OWNER_PERMISSIONS.length} permissões`);
        updatedCount++;
      } else {
        console.log(`   ✅ Já está correto`);
      }
    }
    
    console.log(`\n\n📊 RESUMO:`);
    console.log(`   Total de salões: ${salons.length}`);
    console.log(`   Proprietários atualizados: ${updatedCount}`);
    console.log(`\n✅ Processo concluído!`);
    
  } catch (error) {
    console.error("❌ Erro ao atualizar permissões:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
fixOwnerPermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
