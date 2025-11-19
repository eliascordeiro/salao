const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalonFields() {
  console.log('\n🔍 VERIFICANDO CAMPOS DETALHADOS DO SALÃO\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Buscar primeiro salão
    const salon = await prisma.salon.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            email: true,
            name: true
          }
        }
      }
    });

    if (!salon) {
      console.log('❌ Nenhum salão encontrado\n');
      return;
    }

    console.log(`🏪 Salão: ${salon.name}\n`);
    console.log('📊 CAMPOS NO BANCO DE DADOS:\n');
    
    // Mostrar todos os campos relacionados ao endereço
    console.log('Endereço completo:');
    console.log(`   address: "${salon.address || 'VAZIO'}"`);
    console.log('');
    
    console.log('Campos separados (se existirem):');
    console.log(`   zipCode: "${salon.zipCode || 'VAZIO'}"`);
    console.log(`   city: "${salon.city || 'VAZIO'}"`);
    console.log(`   state: "${salon.state || 'VAZIO'}"`);
    console.log('');
    
    console.log('Outros campos:');
    console.log(`   email: "${salon.email || 'VAZIO'}"`);
    console.log(`   phone: "${salon.phone || 'VAZIO'}"`);
    console.log('');

    console.log('═══════════════════════════════════════════════════════\n');
    console.log('❗ PROBLEMA IDENTIFICADO:\n');
    console.log('   O schema do Salon tem os seguintes campos:');
    console.log('   - address (String) → Endereço completo');
    console.log('   - zipCode (String?) → CEP');
    console.log('   - city (String?) → Cidade');
    console.log('   - state (String?) → Estado');
    console.log('');
    console.log('   Mas NÃO tem:');
    console.log('   - street (Rua)');
    console.log('   - number (Número)');
    console.log('   - complement (Complemento)');
    console.log('   - neighborhood (Bairro)');
    console.log('');
    console.log('💡 SOLUÇÃO NECESSÁRIA:\n');
    console.log('   1. Adicionar campos ao schema do Salon:');
    console.log('      - street String?');
    console.log('      - number String?');
    console.log('      - complement String?');
    console.log('      - neighborhood String?');
    console.log('');
    console.log('   2. Atualizar API de registro para salvar campos separados');
    console.log('   3. Atualizar API de atualização (my-salon) para salvar campos separados');
    console.log('   4. Página "Meu Salão" já está preparada para campos separados');
    console.log('');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalonFields();
