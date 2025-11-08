import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PaymentStatus from "@/components/payments/PaymentStatus";
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  Users,
  Search,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Buscar todos os pagamentos
  const payments = await prisma.payment.findMany({
    include: {
      booking: {
        include: {
          service: true,
          client: true,
          staff: true,
        },
      },
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Calcular estatísticas
  const totalRevenue = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = payments.filter((p) => p.status === "COMPLETED").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;

  const statusBreakdown = payments.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Pagamentos</h1>
        <p className="text-gray-600 mt-2">
          Gerencie e acompanhe todos os pagamentos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completedCount} pagamentos confirmados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pendentes
            </CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              R$ {pendingAmount.toFixed(2)}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {statusBreakdown["PENDING"] || 0} aguardando pagamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Sucesso
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {payments.length > 0
                ? ((completedCount / payments.length) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {failedCount} falhas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Pagamentos
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {payments.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Todos os status</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Pagamentos</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Serviço
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Data
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Valor
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Método
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                ) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">
                            {payment.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.user.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm">{payment.booking.service.name}</p>
                          <p className="text-xs text-gray-500">
                            com {payment.booking.staff.name}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {format(
                          new Date(payment.createdAt),
                          "dd/MM/yyyy HH:mm",
                          { locale: ptBR }
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">
                          R$ {payment.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.method || "Cartão"}
                      </td>
                      <td className="py-3 px-4">
                        <PaymentStatus status={payment.status} />
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/dashboard/pagamentos/${payment.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
