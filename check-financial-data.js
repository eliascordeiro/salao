const { PrismaClient } = require("@prisma/client");
const { startOfDay, endOfDay } = require("date-fns");
const prisma = new PrismaClient();

async function check() {
  try {
    console.log("🔍 Verificando dados financeiros de hoje\n");

    const today = new Date();
    const startDate = startOfDay(today);
    const endDate = endOfDay(today);

    // Buscar salão pelo email
    const salon = await prisma.salon.findFirst({
      where: {
        owner: {
          email: "meusalao@ig.com.br",
        },
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
    });

    if (!salon) {
      console.log("❌ Salão não encontrado para meusalao@ig.com.br");
      return;
    }

    console.log("✅ Salão encontrado:");
    console.log(`   Nome: ${salon.name}`);
    console.log(`   ID: ${salon.id}`);
    console.log(`   Owner: ${salon.owner.name} (${salon.owner.email})\n`);

    // 1. VERIFICAR SESSÕES DE CAIXA CRIADAS HOJE
    console.log("💰 SESSÕES DE CAIXA CRIADAS HOJE:");
    const sessionsCreatedToday = await prisma.cashierSession.findMany({
      where: {
        salonId: salon.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: { select: { name: true } },
        items: true,
      },
    });

    console.log(`   Total: ${sessionsCreatedToday.length} sessões\n`);

    for (const session of sessionsCreatedToday) {
      console.log(`   Sessão: ${session.id}`);
      console.log(`   Cliente: ${session.client.name}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Total: R$ ${session.total.toFixed(2)}`);
      console.log(`   Criada em: ${new Date(session.createdAt).toLocaleString()}`);
      console.log(`   Paga em: ${session.paidAt ? new Date(session.paidAt).toLocaleString() : "Não paga"}`);
      console.log(`   Itens: ${session.items.length}`);
      console.log("");
    }

    // 2. VERIFICAR SESSÕES PAGAS HOJE
    console.log("\n💵 SESSÕES PAGAS HOJE (status: CLOSED):");
    const sessionsPaidToday = await prisma.cashierSession.findMany({
      where: {
        salonId: salon.id,
        status: "CLOSED",
        paidAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: { select: { name: true } },
      },
    });

    console.log(`   Total: ${sessionsPaidToday.length} sessões pagas\n`);

    const totalRevenue = sessionsPaidToday.reduce((sum, s) => sum + s.total, 0);
    console.log(`   💰 Receita total: R$ ${totalRevenue.toFixed(2)}\n`);

    for (const session of sessionsPaidToday) {
      console.log(`   Sessão: ${session.id}`);
      console.log(`   Cliente: ${session.client.name}`);
      console.log(`   Total: R$ ${session.total.toFixed(2)}`);
      console.log(`   Paga em: ${new Date(session.paidAt).toLocaleString()}`);
      console.log("");
    }

    // 3. VERIFICAR AGENDAMENTOS COMPLETED HOJE
    console.log("\n📅 AGENDAMENTOS MARCADOS COMO COMPLETED HOJE:");
    const completedBookings = await prisma.booking.findMany({
      where: {
        salonId: salon.id,
        status: "COMPLETED",
        updatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        client: { select: { name: true } },
        service: { select: { name: true, price: true } },
      },
    });

    console.log(`   Total: ${completedBookings.length} agendamentos\n`);

    for (const booking of completedBookings) {
      console.log(`   Agendamento: ${booking.id}`);
      console.log(`   Cliente: ${booking.client.name}`);
      console.log(`   Serviço: ${booking.service.name}`);
      console.log(`   Preço: R$ ${booking.service.price.toFixed(2)}`);
      console.log(`   Data do serviço: ${new Date(booking.date).toLocaleString()}`);
      console.log(`   Atualizado em: ${new Date(booking.updatedAt).toLocaleString()}`);

      // Verificar se tem sessão de caixa
      const cashierItem = await prisma.cashierSessionItem.findFirst({
        where: { bookingId: booking.id },
        include: {
          session: {
            select: { id: true, status: true, paidAt: true },
          },
        },
      });

      if (cashierItem) {
        console.log(`   ✅ Tem sessão de caixa: ${cashierItem.session.id}`);
        console.log(`      Status: ${cashierItem.session.status}`);
        console.log(`      Paga: ${cashierItem.session.paidAt ? "Sim" : "Não"}`);
      } else {
        console.log(`   ❌ SEM sessão de caixa!`);
      }
      console.log("");
    }

    // 4. RESUMO
    console.log("\n📊 RESUMO:");
    console.log(`   Sessões criadas hoje: ${sessionsCreatedToday.length}`);
    console.log(`   Sessões abertas (OPEN): ${sessionsCreatedToday.filter(s => s.status === "OPEN").length}`);
    console.log(`   Sessões pagas hoje (CLOSED): ${sessionsPaidToday.length}`);
    console.log(`   Receita de hoje (sessões pagas): R$ ${totalRevenue.toFixed(2)}`);
    console.log(`   Agendamentos completed hoje: ${completedBookings.length}`);

    console.log("\n💡 EXPLICAÇÃO:");
    console.log("   - Quando você marca um agendamento como COMPLETED, cria uma sessão ABERTA (OPEN)");
    console.log("   - A sessão só gera RECEITA quando o status muda para CLOSED (pago no caixa)");
    console.log("   - Análise Financeira mostra apenas sessões PAGAS (status: CLOSED)");

    if (sessionsCreatedToday.length > 0 && sessionsPaidToday.length === 0) {
      console.log("\n⚠️  ATENÇÃO:");
      console.log("   Você tem sessões abertas que NÃO foram pagas ainda!");
      console.log("   Vá em 'Caixa' e finalize os pagamentos para aparecer na Análise Financeira.");
    }

  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

check();
