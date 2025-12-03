// Script para remover usuário do Railway
// Execute: npx tsx scripts/remove-user-railway.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:bfzNahVPyVcwzIewNotORAKWJFOZiFpW@gondola.proxy.rlwy.net:20615/railway'
    }
  }
});

async function removeUser() {
  const email = 'agendahorasalao@gmail.com';

  try {
    console.log(`🔍 Buscando usuário: ${email}`);

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);

    // Buscar salões
    const salons = await prisma.salon.findMany({
      where: { ownerId: user.id },
    });

    console.log(`📊 Salões associados: ${salons.length}`);

    console.log('\n🗑️  Iniciando exclusão...');

    // Para cada salão, deletar (cascade deleta tudo relacionado)
    if (salons.length > 0) {
      for (const salon of salons) {
        console.log(`\n🏢 Deletando salão: ${salon.name} (ID: ${salon.id})`);

        // Contar registros
        const [bookingsCount, staffCount, servicesCount] = await Promise.all([
          prisma.booking.count({ where: { salonId: salon.id } }),
          prisma.staff.count({ where: { salonId: salon.id } }),
          prisma.service.count({ where: { salonId: salon.id } }),
        ]);

        console.log(`  📋 Agendamentos: ${bookingsCount}`);
        console.log(`  👥 Profissionais: ${staffCount}`);
        console.log(`  💇 Serviços: ${servicesCount}`);

        // Deletar salão (cascade deleta tudo)
        await prisma.salon.delete({
          where: { id: salon.id },
        });

        console.log(`  ✅ Salão deletado com sucesso`);
      }
    }

    // Deletar usuário (cascade deleta sessions e accounts)
    await prisma.user.delete({
      where: { id: user.id },
    });

    console.log(`\n✅ Usuário ${email} deletado com sucesso!`);
    console.log(`\n🎉 Operação concluída!`);

  } catch (error) {
    console.error('❌ Erro ao deletar usuário:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
removeUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
