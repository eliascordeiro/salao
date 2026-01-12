const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function findAndActivateElegancy() {
  try {
    console.log("🔍 Procurando salão 'Elegancy'...\n");

    // Buscar salão com nome similar a "elegancy"
    const salons = await prisma.salon.findMany({
      where: {
        name: {
          contains: 'elegancy',
          mode: 'insensitive'
        }
      }
    });

    if (salons.length === 0) {
      console.log("❌ Nenhum salão encontrado com o nome 'elegancy'");
      return;
    }

    console.log(`✅ Encontrado(s) ${salons.length} salão(ões):\n`);
    
    for (const salon of salons) {
      console.log(`📍 Salão: ${salon.name}`);
      console.log(`   ID: ${salon.id}`);
      console.log(`   Email: ${salon.email}`);
      console.log(`   Ativo: ${salon.active ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Owner ID: ${salon.ownerId}`);
      console.log('');

      if (!salon.active) {
        console.log(`🔄 Ativando salão "${salon.name}"...`);
        
        const updated = await prisma.salon.update({
          where: { id: salon.id },
          data: { active: true }
        });

        console.log(`✅ Salão "${updated.name}" ativado com sucesso!`);
        console.log(`   Status anterior: INATIVO`);
        console.log(`   Status atual: ATIVO ✅\n`);
      } else {
        console.log(`ℹ️ Salão "${salon.name}" já está ativo.\n`);
      }
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndActivateElegancy();
