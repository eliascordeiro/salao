const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalonData() {
  console.log('\n🔍 VERIFICANDO DADOS DOS SALÕES NO BANCO\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const salons = await prisma.salon.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`📊 Total de salões: ${salons.length}\n`);

    for (const salon of salons) {
      console.log(`🏪 ${salon.name} (ID: ${salon.id})`);
      console.log(`   ├─ Email: ${salon.email || '❌ VAZIO'}`);
      console.log(`   ├─ Telefone: ${salon.phone || '❌ VAZIO'}`);
      console.log(`   ├─ Endereço: ${salon.address || '❌ VAZIO'}`);
      console.log(`   ├─ Cidade: ${salon.city || '❌ VAZIO'}`);
      console.log(`   ├─ Estado: ${salon.state || '❌ VAZIO'}`);
      console.log(`   ├─ Latitude: ${salon.latitude || '❌ VAZIO'}`);
      console.log(`   ├─ Longitude: ${salon.longitude || '❌ VAZIO'}`);
      console.log(`   ├─ Horário: ${salon.openTime} - ${salon.closeTime}`);
      console.log(`   ├─ Dias: ${salon.workDays}`);
      console.log(`   ├─ Ativo: ${salon.active ? '✅' : '❌'}`);
      console.log(`   ├─ Proprietário ID: ${salon.userId || '❌ VAZIO'}`);
      console.log(`   └─ Criado em: ${new Date(salon.createdAt).toLocaleString('pt-BR')}`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('⚠️  PROBLEMAS IDENTIFICADOS:\n');

    let hasIssues = false;

    salons.forEach(salon => {
      const issues = [];
      
      if (!salon.email) issues.push('Email vazio');
      if (!salon.address) issues.push('Endereço vazio');
      if (!salon.city) issues.push('Cidade vazia');
      if (!salon.state) issues.push('Estado vazio');
      
      if (issues.length > 0) {
        hasIssues = true;
        console.log(`   ❌ ${salon.name}:`);
        issues.forEach(issue => console.log(`      - ${issue}`));
        console.log('');
      }
    });

    if (!hasIssues) {
      console.log('   ✅ Nenhum problema encontrado! Todos os salões têm dados completos.\n');
    } else {
      console.log('   💡 SOLUÇÃO:');
      console.log('      Edite o salão em "Meu Salão" e preencha os campos vazios.\n');
    }

    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalonData();
