#!/usr/bin/env tsx
/**
 * Script para verificar se o banco de dados Railway está atualizado
 * 
 * Uso:
 * 1. Local: npx tsx scripts/check-railway-db.ts
 * 2. Railway: railway run npx tsx scripts/check-railway-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MigrationRecord {
  id: string;
  checksum: string;
  finished_at: Date | null;
  migration_name: string;
  logs: string | null;
  rolled_back_at: Date | null;
  started_at: Date;
  applied_steps_count: number;
}

async function checkRailwayDB() {
  console.log('\n🔍 Verificando status do banco de dados...\n');

  try {
    // 1. Verificar conexão
    console.log('📡 Testando conexão...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!\n');

    // 2. Verificar migrações aplicadas
    console.log('📋 Migrações aplicadas:');
    console.log('─'.repeat(80));
    
    const migrations = await prisma.$queryRaw<MigrationRecord[]>`
      SELECT migration_name, finished_at, applied_steps_count
      FROM "_prisma_migrations"
      ORDER BY finished_at DESC
    `;

    if (migrations.length === 0) {
      console.log('⚠️  NENHUMA migração encontrada! Banco pode não estar inicializado.\n');
    } else {
      migrations.forEach((m, i) => {
        const date = m.finished_at ? new Date(m.finished_at).toLocaleString('pt-BR') : 'N/A';
        const status = m.finished_at ? '✅' : '⏳';
        console.log(`${status} ${i + 1}. ${m.migration_name}`);
        console.log(`   Aplicada em: ${date}`);
        console.log(`   Steps: ${m.applied_steps_count}\n`);
      });
    }

    // 3. Verificar migrações esperadas
    console.log('🎯 Migrações esperadas (do código):');
    console.log('─'.repeat(80));
    
    const expectedMigrations = [
      '20251102000000_init',
      '20251104222817_add_reason_and_created_by_to_availability',
      '20251106225716_add_booking_type_to_salon',
    ];

    const appliedNames = migrations.map(m => m.migration_name);
    
    expectedMigrations.forEach(expected => {
      if (appliedNames.includes(expected)) {
        console.log(`✅ ${expected}`);
      } else {
        console.log(`❌ ${expected} - NÃO APLICADA!`);
      }
    });
    console.log('');

    // 4. Verificar estrutura da tabela Salon
    console.log('🏢 Verificando estrutura da tabela Salon:');
    console.log('─'.repeat(80));
    
    const salonColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Salon' 
      ORDER BY ordinal_position
    `;

    const hasBookingType = salonColumns.some(c => c.column_name === 'bookingType');
    
    if (hasBookingType) {
      console.log('✅ Coluna "bookingType" existe - Banco ATUALIZADO!');
    } else {
      console.log('❌ Coluna "bookingType" NÃO existe - Banco DESATUALIZADO!');
    }
    console.log('');

    // 5. Verificar estrutura da tabela Availability
    console.log('📅 Verificando estrutura da tabela Availability:');
    console.log('─'.repeat(80));
    
    const availabilityColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Availability' 
      ORDER BY ordinal_position
    `;

    const hasReason = availabilityColumns.some(c => c.column_name === 'reason');
    const hasCreatedBy = availabilityColumns.some(c => c.column_name === 'createdBy');
    
    if (hasReason && hasCreatedBy) {
      console.log('✅ Colunas "reason" e "createdBy" existem - Banco ATUALIZADO!');
    } else {
      console.log('❌ Colunas ausentes:');
      if (!hasReason) console.log('   - reason');
      if (!hasCreatedBy) console.log('   - createdBy');
      console.log('   Banco DESATUALIZADO!');
    }
    console.log('');

    // 6. Verificar estrutura da tabela Payment
    console.log('💳 Verificando estrutura da tabela Payment:');
    console.log('─'.repeat(80));
    
    const paymentColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Payment' 
      ORDER BY ordinal_position
    `;

    const hasProvider = paymentColumns.some(c => c.column_name === 'provider');
    const hasCurrency = paymentColumns.some(c => c.column_name === 'currency');
    
    if (hasProvider && hasCurrency) {
      console.log('✅ Colunas "provider" e "currency" existem - Banco ATUALIZADO!');
    } else {
      console.log('❌ Colunas ausentes:');
      if (!hasProvider) console.log('   - provider');
      if (!hasCurrency) console.log('   - currency');
      console.log('   Banco DESATUALIZADO!');
    }
    console.log('');

    // 7. Resumo final
    console.log('📊 RESUMO FINAL:');
    console.log('═'.repeat(80));
    
    const allUpdated = hasBookingType && hasReason && hasCreatedBy && hasProvider && hasCurrency;
    const missingMigrations = expectedMigrations.filter(e => !appliedNames.includes(e));
    
    if (allUpdated && missingMigrations.length === 0) {
      console.log('✅ Banco de dados TOTALMENTE ATUALIZADO!');
      console.log('   Todas as migrações foram aplicadas com sucesso.\n');
    } else {
      console.log('⚠️  Banco de dados DESATUALIZADO!');
      
      if (missingMigrations.length > 0) {
        console.log('\n   Migrações pendentes:');
        missingMigrations.forEach(m => {
          console.log(`   - ${m}`);
        });
      }
      
      console.log('\n   🔧 Para atualizar, execute:');
      console.log('   npx prisma migrate deploy\n');
      console.log('   Ou via Railway CLI:');
      console.log('   railway run npx prisma migrate deploy\n');
    }

    // 8. Informações de ambiente
    console.log('🌍 Informações do ambiente:');
    console.log('─'.repeat(80));
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 30)}...`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
    console.log('');

  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
    console.error('\n💡 Possíveis causas:');
    console.error('   1. DATABASE_URL não configurado');
    console.error('   2. Banco de dados inacessível');
    console.error('   3. Credenciais inválidas');
    console.error('   4. Firewall bloqueando conexão\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar verificação
checkRailwayDB().catch((error) => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
