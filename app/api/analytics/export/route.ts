import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * API de Exportação de Relatórios
 * GET /api/analytics/export?type=bookings&period=30d
 * 
 * Gera arquivos CSV para download
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "bookings"; // bookings, revenue, services
    const period = searchParams.get("period") || "30d";

    // Calcular datas
    const periodDays = {
      "7d": 7,
      "30d": 30,
      "3m": 90,
      "1y": 365,
    };

    const days = periodDays[period as keyof typeof periodDays] || 30;
    const startDate = subDays(new Date(), days);
    const endDate = new Date();

    let csvContent = "";
    let filename = "";

    // Gerar CSV baseado no tipo
    switch (type) {
      case "bookings":
        csvContent = await generateBookingsCSV(startDate, endDate);
        filename = `agendamentos_${period}_${format(new Date(), "yyyyMMdd")}.csv`;
        break;

      case "revenue":
        csvContent = await generateRevenueCSV(startDate, endDate);
        filename = `receita_${period}_${format(new Date(), "yyyyMMdd")}.csv`;
        break;

      case "services":
        csvContent = await generateServicesCSV(startDate, endDate);
        filename = `servicos_${period}_${format(new Date(), "yyyyMMdd")}.csv`;
        break;

      case "complete":
        csvContent = await generateCompleteReportCSV(startDate, endDate);
        filename = `relatorio_completo_${period}_${format(new Date(), "yyyyMMdd")}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: "Tipo de relatório inválido" },
          { status: 400 }
        );
    }

    // Retornar CSV
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}

/**
 * Gera CSV de agendamentos
 */
async function generateBookingsCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      client: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      service: {
        select: {
          name: true,
          category: true,
          price: true,
        },
      },
      staff: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Cabeçalho
  const headers = [
    "ID",
    "Data do Agendamento",
    "Hora",
    "Cliente",
    "Email",
    "Telefone",
    "Serviço",
    "Categoria",
    "Profissional",
    "Status",
    "Valor (R$)",
    "Observações",
    "Data de Criação",
  ];

  // Linhas
  const rows = bookings.map((booking) => {
    const bookingDate = new Date(booking.date);
    return [
      booking.id,
      format(bookingDate, "dd/MM/yyyy", { locale: ptBR }),
      format(bookingDate, "HH:mm", { locale: ptBR }),
      booking.client.name,
      booking.client.email || "",
      booking.client.phone || "",
      booking.service.name,
      booking.service.category || "",
      booking.staff.name,
      translateStatus(booking.status),
      booking.totalPrice.toFixed(2),
      booking.notes || "",
      format(new Date(booking.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }),
    ];
  });

  // Construir CSV
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  // Adicionar BOM para UTF-8
  return "\uFEFF" + csv;
}

/**
 * Gera CSV de receita
 */
async function generateRevenueCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      service: {
        select: {
          name: true,
          category: true,
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Cabeçalho
  const headers = [
    "Data",
    "Serviço",
    "Categoria",
    "Status",
    "Valor (R$)",
    "Receita Confirmada",
  ];

  // Linhas
  const rows = bookings.map((booking) => {
    const isConfirmed = booking.status === "COMPLETED";
    return [
      format(new Date(booking.date), "dd/MM/yyyy", { locale: ptBR }),
      booking.service.name,
      booking.service.category || "",
      translateStatus(booking.status),
      booking.totalPrice.toFixed(2),
      isConfirmed ? booking.totalPrice.toFixed(2) : "0.00",
    ];
  });

  // Totais
  const totalRevenue = bookings.reduce(
    (sum, b) => sum + b.totalPrice,
    0
  );
  const confirmedRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  rows.push([]);
  rows.push(["TOTAIS", "", "", "", "", ""]);
  rows.push([
    "Receita Total",
    "",
    "",
    "",
    totalRevenue.toFixed(2),
    "",
  ]);
  rows.push([
    "Receita Confirmada",
    "",
    "",
    "",
    confirmedRevenue.toFixed(2),
    "",
  ]);

  // Construir CSV
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return "\uFEFF" + csv;
}

/**
 * Gera CSV de serviços populares
 */
async function generateServicesCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  // Buscar agendamentos agrupados por serviço
  const bookingsByService = await prisma.booking.groupBy({
    by: ["serviceId"],
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      totalPrice: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
  });

  // Buscar detalhes dos serviços
  const serviceIds = bookingsByService.map((b) => b.serviceId);
  const services = await prisma.service.findMany({
    where: {
      id: {
        in: serviceIds,
      },
    },
  });

  // Totais
  const totalBookings = bookingsByService.reduce(
    (sum, s) => sum + s._count.id,
    0
  );
  const totalRevenue = bookingsByService.reduce(
    (sum, s) => sum + (s._sum.totalPrice || 0),
    0
  );

  // Cabeçalho
  const headers = [
    "Ranking",
    "Serviço",
    "Categoria",
    "Preço Base (R$)",
    "Duração (min)",
    "Agendamentos",
    "% Agendamentos",
    "Receita (R$)",
    "% Receita",
  ];

  // Linhas
  const rows = bookingsByService.map((booking, index) => {
    const service = services.find((s) => s.id === booking.serviceId);
    const bookingsCount = booking._count.id;
    const revenue = booking._sum.totalPrice || 0;

    return [
      (index + 1).toString(),
      service?.name || "Desconhecido",
      service?.category || "",
      service?.price.toFixed(2) || "0.00",
      service?.duration.toString() || "0",
      bookingsCount.toString(),
      ((bookingsCount / totalBookings) * 100).toFixed(1) + "%",
      revenue.toFixed(2),
      ((revenue / totalRevenue) * 100).toFixed(1) + "%",
    ];
  });

  // Totais
  rows.push([]);
  rows.push(["TOTAIS", "", "", "", "", "", "", "", ""]);
  rows.push([
    "Total",
    "",
    "",
    "",
    "",
    totalBookings.toString(),
    "100%",
    totalRevenue.toFixed(2),
    "100%",
  ]);

  // Construir CSV
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  return "\uFEFF" + csv;
}

/**
 * Gera CSV com relatório completo
 */
async function generateCompleteReportCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      client: true,
      service: true,
      staff: true,
    },
  });

  // Estatísticas gerais
  const total = bookings.length;
  const completed = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelled = bookings.filter((b) => b.status === "CANCELLED").length;
  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED").length;
  const noShow = bookings.filter((b) => b.status === "NO_SHOW").length;

  const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const confirmedRevenue = bookings
    .filter((b) => b.status === "COMPLETED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  // Construir relatório
  let csv = "RELATÓRIO COMPLETO - AGENDASALÃO\n";
  csv += `Período: ${format(startDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}\n`;
  csv += `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n`;
  csv += "\n";

  // Resumo Executivo
  csv += "RESUMO EXECUTIVO\n";
  csv += "Métrica,Valor\n";
  csv += `"Total de Agendamentos","${total}"\n`;
  csv += `"Concluídos","${completed}"\n`;
  csv += `"Confirmados","${confirmed}"\n`;
  csv += `"Pendentes","${pending}"\n`;
  csv += `"Cancelados","${cancelled}"\n`;
  csv += `"Não Compareceram","${noShow}"\n`;
  csv += `"Taxa de Conclusão","${((completed / total) * 100).toFixed(1)}%"\n`;
  csv += `"Taxa de Cancelamento","${((cancelled / total) * 100).toFixed(1)}%"\n`;
  csv += `"Receita Total","R$ ${totalRevenue.toFixed(2)}"\n`;
  csv += `"Receita Confirmada","R$ ${confirmedRevenue.toFixed(2)}"\n`;
  csv += `"Ticket Médio","R$ ${completed > 0 ? (confirmedRevenue / completed).toFixed(2) : "0.00"}"\n`;
  csv += "\n\n";

  // Adicionar CSV de agendamentos
  csv += "DETALHAMENTO DE AGENDAMENTOS\n";
  csv += await generateBookingsCSV(startDate, endDate);
  csv += "\n\n";

  // Adicionar CSV de serviços
  csv += "ANÁLISE DE SERVIÇOS\n";
  csv += await generateServicesCSV(startDate, endDate);

  return csv;
}

/**
 * Traduz status para português
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    PENDING: "Pendente",
    CONFIRMED: "Confirmado",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
    NO_SHOW: "Não Compareceu",
  };

  return translations[status] || status;
}
