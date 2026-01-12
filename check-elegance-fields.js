const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkElegance() {
  try {
    const salon = await prisma.salon.findFirst({
      where: {
        name: { contains: 'elegance', mode: 'insensitive' }
      },
      include: {
        services: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        staff: {
          select: {
            id: true,
            name: true,
            active: true
          }
        }
      }
    });

    if (!salon) {
      console.log('❌ Salão não encontrado');
      return;
    }

    console.log('\n=== DIAGNÓSTICO SALÃO ELEGANCE ===\n');
    console.log('📋 CAMPOS PRINCIPAIS:');
    console.log(`   Nome: ${salon.name}`);
    console.log(`   ID: ${salon.id}`);
    console.log(`   Ativo: ${salon.active ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Cidade: ${salon.city || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Estado: ${salon.state || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Endereço: ${salon.address || '❌ NÃO PREENCHIDO'}`);
    console.log(`   CEP: ${salon.zipCode || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Telefone: ${salon.phone || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Descrição: ${salon.description ? '✅ PREENCHIDO' : '❌ NÃO PREENCHIDO'}`);
    console.log(`   Foto Capa: ${salon.coverPhoto || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Latitude: ${salon.latitude || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Longitude: ${salon.longitude || '❌ NÃO PREENCHIDO'}`);
    console.log(`   Featured: ${salon.featured ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   Verified: ${salon.verified ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   PublishedAt: ${salon.publishedAt || '❌ NÃO PREENCHIDO'}`);
    
    console.log('\n📊 SERVIÇOS:');
    if (salon.services.length === 0) {
      console.log('   ❌ Nenhum serviço cadastrado');
    } else {
      console.log(`   ✅ ${salon.services.length} serviço(s) cadastrado(s):`);
      salon.services.forEach(s => {
        console.log(`      - ${s.name} (${s.active ? 'ativo' : 'inativo'})`);
      });
    }
    
    console.log('\n👥 PROFISSIONAIS:');
    if (salon.staff.length === 0) {
      console.log('   ❌ Nenhum profissional cadastrado');
    } else {
      console.log(`   ✅ ${salon.staff.length} profissional(is) cadastrado(s):`);
      salon.staff.forEach(s => {
        console.log(`      - ${s.name} (${s.active ? 'ativo' : 'inativo'})`);
      });
    }
    
    console.log('\n🔍 ANÁLISE:');
    const issues = [];
    if (!salon.active) issues.push('Salão está INATIVO');
    if (!salon.city) issues.push('Cidade não preenchida');
    if (!salon.state) issues.push('Estado não preenchido');
    if (!salon.latitude || !salon.longitude) issues.push('Coordenadas GPS não preenchidas');
    if (!salon.publishedAt) issues.push('Data de publicação não definida');
    if (salon.services.length === 0) issues.push('Sem serviços cadastrados');
    if (salon.staff.length === 0) issues.push('Sem profissionais cadastrados');
    
    if (issues.length === 0) {
      console.log('   ✅ Salão configurado corretamente!');
    } else {
      console.log('   ⚠️ Problemas encontrados:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkElegance();
