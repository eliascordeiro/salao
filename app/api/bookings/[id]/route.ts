import { format } from "date-fns";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  formatBookingDataForEmail,
} from "@/lib/email";
import { sendBookingNotification } from "@/lib/whatsapp/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
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
            description: true,
            duration: true,
            price: true,
            category: true,
          },
        },
        staff: {
          select: {
            name: true,
            specialty: true,
            phone: true,
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamento" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes, date, serviceId, staffId } = body;

    // Validar status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Verificar permissões
    let hasPermission = false;

    if (session.user.role === "ADMIN") {
      // Admin tem permissão total
      hasPermission = true;
    } else if ((session.user as any).roleType === "STAFF") {
      // Profissionais precisam de permissões específicas
      const staffProfile = await prisma.staff.findFirst({
        where: { userId: session.user.id },
        select: { 
          id: true,
          canConfirmBooking: true, 
          canCancelBooking: true 
        },
      });

      if (!staffProfile) {
        return NextResponse.json({ error: "Perfil de profissional não encontrado" }, { status: 404 });
      }

      // Verificar se o agendamento pertence a este profissional
      const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        select: { staffId: true },
      });

      if (!booking) {
        return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });
      }

      if (booking.staffId !== staffProfile.id) {
        return NextResponse.json({ error: "Você só pode gerenciar seus próprios agendamentos" }, { status: 403 });
      }

      // Verificar permissão específica
      if (status === "CONFIRMED" && !staffProfile.canConfirmBooking) {
        return NextResponse.json({ error: "Você não tem permissão para confirmar agendamentos" }, { status: 403 });
      }

      if (status === "CANCELLED" && !staffProfile.canCancelBooking) {
        return NextResponse.json({ error: "Você não tem permissão para cancelar agendamentos" }, { status: 403 });
      }

      // Profissionais só podem alterar status (não data, serviço, profissional)
      if (date || serviceId || staffId) {
        return NextResponse.json({ error: "Profissionais só podem alterar o status do agendamento" }, { status: 403 });
      }

      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Validar data se fornecida
    if (date) {
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        return NextResponse.json({ error: "Data inválida" }, { status: 400 });
      }
    }

    // Validar se serviceId existe (se fornecido)
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (!service) {
        return NextResponse.json({ error: "Serviço não encontrado" }, { status: 404 });
      }
    }

    // Validar se staffId existe (se fornecido)
    if (staffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: staffId },
      });
      if (!staff) {
        return NextResponse.json({ error: "Profissional não encontrado" }, { status: 404 });
      }
    }

    // Verificar conflito de horário se data/hora, serviço ou profissional foram alterados
    if (date && serviceId && staffId) {
      const bookingDate = new Date(date);
      
      // Buscar duração do serviço
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
        select: { duration: true },
      });

      if (service) {
        const endDate = new Date(bookingDate.getTime() + service.duration * 60000);

        // Verificar conflitos (excluindo o próprio agendamento)
        const conflict = await prisma.booking.findFirst({
          where: {
            id: { not: params.id }, // Excluir o agendamento atual
            staffId,
            status: { notIn: ["CANCELLED", "NO_SHOW"] },
            OR: [
              {
                date: {
                  gte: bookingDate,
                  lt: endDate,
                },
              },
              {
                AND: [
                  { date: { lt: bookingDate } },
                  {
                    service: {
                      duration: {
                        gt: Math.floor((bookingDate.getTime() - new Date().getTime()) / 60000),
                      },
                    },
                  },
                ],
              },
            ],
          },
          include: {
            service: { select: { name: true } },
          },
        });

        if (conflict) {
          return NextResponse.json(
            {
              error: "Conflito de horário",
              message: `O profissional já tem um agendamento (${conflict.service.name}) neste horário.`,
            },
            { status: 409 }
          );
        }
      }
    }

    // Buscar status anterior para saber se houve mudança
    const previousBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { status: true, salonId: true },
    });

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(date && { date: new Date(date) }),
        ...(serviceId && { serviceId }),
        ...(staffId && { staffId }),
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
            duration: true,
            price: true,
          },
        },
        staff: {
          select: {
            name: true,
          },
        },
        salon: {
          select: {
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    // Se o status mudou para COMPLETED, criar entrada no caixa automaticamente
    if (
      status === "COMPLETED" &&
      previousBooking &&
      previousBooking.status !== "COMPLETED"
    ) {
      try {
        // Verificar se já existe uma sessão de caixa para este agendamento
        const existingSession = await prisma.cashierSessionItem.findFirst({
          where: { bookingId: params.id },
        });

        if (!existingSession) {
          // Buscar sessão OPEN existente do cliente ou criar uma nova
          let cashierSession = await prisma.cashierSession.findFirst({
            where: {
              salonId: booking.salonId,
              clientId: booking.clientId,
              status: "OPEN",
            },
          });

          if (cashierSession) {
            // Adiciona item à sessão existente
            await prisma.cashierSessionItem.create({
              data: {
                sessionId: cashierSession.id,
                bookingId: booking.id,
                serviceName: booking.service.name,
                staffName: booking.staff.name,
                price: booking.service.price,
                discount: 0,
              },
            });

            // Atualiza totais da sessão
            await prisma.cashierSession.update({
              where: { id: cashierSession.id },
              data: {
                subtotal: { increment: booking.service.price },
                total: { increment: booking.service.price },
              },
            });

            console.log(`✅ Item adicionado à sessão existente ${cashierSession.id}`);
          } else {
            // Criar nova sessão de caixa
            await prisma.cashierSession.create({
              data: {
                salonId: booking.salonId,
                clientId: booking.clientId,
                subtotal: booking.service.price,
                discount: 0,
                total: booking.service.price,
                status: "OPEN",
                items: {
                  create: {
                    bookingId: booking.id,
                    serviceName: booking.service.name,
                    staffName: booking.staff.name,
                    price: booking.service.price,
                    discount: 0,
                  },
                },
              },
            });
            console.log(`✅ Nova sessão de caixa criada para agendamento ${booking.id}`);
          }
        }
      } catch (error) {
        console.error("Erro ao criar sessão de caixa:", error);
        // Não retorna erro para não bloquear a atualização do agendamento
      }
    }

    // Enviar notificações híbridas (WhatsApp + Email) baseadas no plano
    if (status && previousBooking && status !== previousBooking.status) {
      const notificationData = {
        salonId: booking.salonId,
        clientName: booking.client.name,
        clientEmail: booking.client.email,
        clientPhone: booking.client.phone || null,
        serviceName: booking.service.name,
        staffName: booking.staff.name,
        date: booking.date,
        time: `${booking.date.getUTCHours().toString().padStart(2, '0')}:${booking.date.getUTCMinutes().toString().padStart(2, '0')}`,
        salonName: booking.salon.name,
        salonAddress: booking.salon.address,
        salonPhone: booking.salon.phone,
        price: booking.service.price,
        bookingId: booking.id,
      };

      if (status === "CONFIRMED") {
        sendBookingNotification(notificationData, 'confirmed').catch((error) =>
          console.error("Erro ao enviar notificação de confirmação:", error)
        );
      } else if (status === "CANCELLED") {
        sendBookingNotification(notificationData, 'cancelled').catch(
          (error) => console.error("Erro ao enviar notificação de cancelamento:", error)
        );
      } else if (status === "COMPLETED") {
        sendBookingNotification(notificationData, 'completed').catch(
          (error) => console.error("Erro ao enviar notificação de conclusão:", error)
        );
      }
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Apenas ADMIN pode deletar agendamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    await prisma.booking.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Agendamento deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao deletar agendamento" },
      { status: 500 }
    );
  }
}
