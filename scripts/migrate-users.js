const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Script de migração: Corrige usuários existentes
 * Adiciona roleType e permissions para usuários criados antes do sistema multi-usuário
 */
async function migrate() {
  console.log('🔄 Iniciando migração de usuários...\n');

  try {
    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleType: true,
        permissions: true,
        ownerId: true,
      }
    });

    console.log(`📊 Encontrados ${users.length} usuários no banco\n`);

    let updated = 0;
    let skipped = 0;

    for (const user of users) {
      // Se já tem roleType configurado, pular
      if (user.roleType) {
        console.log(`⏭️  ${user.email} - Já configurado (${user.roleType})`);
        skipped++;
        continue;
      }

      // Determinar roleType baseado no role antigo
      let roleType;
      let permissions = [];

      if (user.role === 'ADMIN') {
        roleType = 'OWNER';
        permissions = []; // Owners têm acesso total, não precisam de permissões
        console.log(`✅ ${user.email} - Migrado para OWNER`);
      } else if (user.role === 'CLIENT') {
        // Clientes não precisam de roleType/permissions (são do sistema público)
        console.log(`⏭️  ${user.email} - Cliente (sem mudanças)`);
        skipped++;
        continue;
      } else {
        console.log(`⚠️  ${user.email} - Role desconhecido: ${user.role}`);
        skipped++;
        continue;
      }

      // Atualizar usuário
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roleType,
          permissions,
          active: true, // Garantir que está ativo
        }
      });

      updated++;
    }

    console.log(`\n📊 Resultado da migração:`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ⏭️  Pulados: ${skipped}`);
    console.log(`   📝 Total: ${users.length}\n`);

    console.log('✅ Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
