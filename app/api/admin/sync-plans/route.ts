import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Força rendering dinâmico
export const dynamic = 'force-dynamic';

// API administrativa para criar/atualizar planos
export async function POST(request: NextRequest) {
  try {
    console.log('💳 Iniciando sincronização de planos...');

    // Verificar planos existentes
    const existingPlans = await prisma.plan.findMany();
    console.log(`📋 Planos encontrados: ${existingPlans.length}`);
    
    if (existingPlans.length > 0) {
      console.log('Planos existentes:', existingPlans.map(p => `${p.name} (${p.slug}): R$ ${p.price}`));
    }

    // Criar ou atualizar Essencial
    const essencial = await prisma.plan.upsert({
      where: { slug: 'essencial' },
      update: {
        name: 'Essencial',
        description: 'Perfeito para salões pequenos que estão começando',
        price: 49.00,
        maxStaff: 2,
        maxUsers: 1,
        features: [
          'Até 2 profissionais',
          'Agendamentos ilimitados',
          'Catálogo de serviços',
          'Calendário e horários',
          'Notificações por email',
          '14 dias grátis'
        ],
        active: true,
      },
      create: {
        name: 'Essencial',
        slug: 'essencial',
        description: 'Perfeito para salões pequenos que estão começando',
        price: 49.00,
        maxStaff: 2,
        maxUsers: 1,
        features: [
          'Até 2 profissionais',
          'Agendamentos ilimitados',
          'Catálogo de serviços',
          'Calendário e horários',
          'Notificações por email',
          '14 dias grátis'
        ],
        active: true,
      },
    });

    console.log(`✅ Plano Essencial: ${essencial.id}`);

    // Criar ou atualizar Profissional
    const profissional = await prisma.plan.upsert({
      where: { slug: 'profissional' },
      update: {
        name: 'Profissional',
        description: 'Para salões que querem crescer e ter todos os recursos',
        price: 149.00,
        maxStaff: null,
        maxUsers: 5,
        features: [
          'Profissionais ilimitados',
          'Pagamentos online (Stripe)',
          'WhatsApp Business',
          'Relatórios financeiros',
          'Controle de despesas',
          'Multi-usuários (5 admins)',
          'Chat com IA',
          'Suporte prioritário',
          '14 dias grátis'
        ],
        active: true,
      },
      create: {
        name: 'Profissional',
        slug: 'profissional',
        description: 'Para salões que querem crescer e ter todos os recursos',
        price: 149.00,
        maxStaff: null,
        maxUsers: 5,
        features: [
          'Profissionais ilimitados',
          'Pagamentos online (Stripe)',
          'WhatsApp Business',
          'Relatórios financeiros',
          'Controle de despesas',
          'Multi-usuários (5 admins)',
          'Chat com IA',
          'Suporte prioritário',
          '14 dias grátis'
        ],
        active: true,
      },
    });

    console.log(`✅ Plano Profissional: ${profissional.id}`);

    // Desativar plano "Free" se existir
    const freePlans = await prisma.plan.findMany({
      where: { 
        OR: [
          { slug: 'free' },
          { name: 'Free' }
        ]
      }
    });

    for (const freePlan of freePlans) {
      await prisma.plan.update({
        where: { id: freePlan.id },
        data: { active: false }
      });
      console.log(`⚠️  Plano Free desativado: ${freePlan.id}`);
    }

    // Buscar todos os planos atualizados
    const allPlans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    return NextResponse.json({
      success: true,
      message: 'Planos sincronizados com sucesso',
      plans: allPlans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        active: p.active,
      }))
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar planos:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao sincronizar planos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET para verificar planos atuais
export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });

    return NextResponse.json({
      count: plans.length,
      plans: plans.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        maxStaff: p.maxStaff,
        maxUsers: p.maxUsers,
        features: p.features,
        active: p.active,
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar planos' },
      { status: 500 }
    );
  }
}
