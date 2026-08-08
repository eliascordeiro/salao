import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

/**
 * API temporária para migrar usuários existentes
 * Adiciona roleType e permissions para usuários criados antes do sistema multi-usuário
 * 
 * DELETE this file after running once in production!
 */
export async function GET() {
  try {
    console.log('🔄 Iniciando migração de usuários...');

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        roleType: true,
        permissions: true,
      }
    });

    console.log(`📊 Encontrados ${users.length} usuários`);

    const results = {
      total: users.length,
      updated: 0,
      skipped: 0,
      details: [] as any[],
    };

    for (const user of users) {
      // Se já tem roleType configurado, pular
      if (user.roleType) {
        console.log(`⏭️  ${user.email} - Já configurado`);
        results.skipped++;
        results.details.push({
          email: user.email,
          status: 'skipped',
          reason: `Already configured as ${user.roleType}`,
        });
        continue;
      }

      // Determinar roleType baseado no role antigo
      let roleType;
      let permissions = [];

      if (user.role === 'ADMIN') {
        roleType = 'OWNER';
        permissions = []; // Owners têm acesso total
        
        // Atualizar usuário
        await prisma.user.update({
          where: { id: user.id },
          data: {
            roleType,
            permissions,
            active: true,
          }
        });

        console.log(`✅ ${user.email} - Migrado para OWNER`);
        results.updated++;
        results.details.push({
          email: user.email,
          status: 'updated',
          oldRole: user.role,
          newRoleType: roleType,
        });
      } else if (user.role === 'CLIENT') {
        // Clientes não precisam de roleType/permissions
        console.log(`⏭️  ${user.email} - Cliente (sem mudanças)`);
        results.skipped++;
        results.details.push({
          email: user.email,
          status: 'skipped',
          reason: 'Client user (no migration needed)',
        });
      } else {
        console.log(`⚠️  ${user.email} - Role desconhecido: ${user.role}`);
        results.skipped++;
        results.details.push({
          email: user.email,
          status: 'skipped',
          reason: `Unknown role: ${user.role}`,
        });
      }
    }

    console.log(`✅ Migração concluída: ${results.updated} atualizados, ${results.skipped} pulados`);

    return NextResponse.json({
      success: true,
      message: 'Migração concluída com sucesso',
      results,
    });

  } catch (error) {
    console.error('❌ Erro durante migração:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
