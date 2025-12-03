// Script para listar todos os usuários
// Execute: npx tsx scripts/list-users.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listando todos os usuários...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        _count: {
          select: {
            ownedSalons: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
      return;
    }

    console.log(`✅ Total de usuários: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'Sem nome'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   ✅ Ativo: ${user.active ? 'Sim' : 'Não'}`);
      console.log(`   🏢 Salões: ${user._count.ownedSalons}`);
      console.log(`   📅 Criado em: ${user.createdAt.toLocaleDateString('pt-BR')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
listUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
