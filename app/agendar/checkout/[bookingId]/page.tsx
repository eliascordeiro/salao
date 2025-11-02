import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import CheckoutButton from "@/components/payments/CheckoutButton";
import PaymentStatus from "@/components/payments/PaymentStatus";
import { Calendar, Clock, User, Scissors, DollarSign, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";

interface CheckoutPageProps {
  params: {
    bookingId: string;
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  // Buscar agendamento
  const booking = await prisma.booking.findUnique({
    where: {
      id: params.bookingId,
    },
    include: {
      service: true,
      staff: true,
      client: true,
      salon: true,
      payment: true,
    },
  });

  if (!booking) {
    redirect("/meus-agendamentos");
  }

  // Verificar se o usuário tem permissão
  if (
    booking.clientId !== session.user.id &&
    session.user.role !== "ADMIN"
  ) {
    redirect("/meus-agendamentos");
  }

  // Se já foi pago, redirecionar
  if (booking.payment && booking.payment.status === "COMPLETED") {
    redirect("/meus-agendamentos");
  }

  // Se foi cancelado, redirecionar
  if (booking.status === "CANCELLED") {
    redirect("/meus-agendamentos");
  }

  const bookingDate = new Date(booking.date);
  const formattedDate = format(bookingDate, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const formattedTime = format(bookingDate, "HH:mm", { locale: ptBR });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/meus-agendamentos"
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
          >
            ← Voltar para agendamentos
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Finalizar Pagamento
          </h1>
          <p className="text-gray-600 mt-1">
            Confirme os detalhes e realize o pagamento
          </p>
        </div>

        {/* Status do Pagamento Existente */}
        {booking.payment && (
          <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Status do Pagamento:
                </p>
                <PaymentStatus status={booking.payment.status} />
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6">
          {/* Resumo do Agendamento */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Resumo do Agendamento
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Scissors className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Serviço</p>
                  <p className="font-semibold">{booking.service.name}</p>
                  {booking.service.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {booking.service.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Profissional</p>
                  <p className="font-semibold">{booking.staff.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-semibold capitalize">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Horário</p>
                  <p className="font-semibold">
                    {formattedTime} ({booking.service.duration} minutos)
                  </p>
                </div>
              </div>

              {booking.notes && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">Observações</p>
                  <p className="text-sm mt-1">{booking.notes}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Resumo do Pagamento */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes do Pagamento
            </h2>

            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Valor do serviço</span>
                <span>R$ {booking.service.price.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {booking.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <CheckoutButton
                bookingId={booking.id}
                amount={booking.totalPrice}
                disabled={
                  booking.payment?.status === "PROCESSING" ||
                  booking.payment?.status === "COMPLETED"
                }
              />
            </div>
          </Card>

          {/* Informações de Segurança */}
          <Card className="p-6 bg-gray-50">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Pagamento Seguro
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Processamento seguro via Stripe</li>
                  <li>✓ Seus dados são criptografados</li>
                  <li>✓ Não armazenamos dados do cartão</li>
                  <li>✓ Confirmação por email</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
