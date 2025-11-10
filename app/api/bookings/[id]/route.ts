import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmedEmail,
  sendBookingCancelledEmail,
  formatBookingDataForEmail,
} from "@/lib/email";

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

    // Apenas ADMIN pode atualizar agendamentos
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    // Validar status
    const validStatuses = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    // Buscar status anterior para saber se houve mudança
    const previousBooking = await prisma.booking.findUnique({
      where: { id: params.id },
      select: { status: true },
    });

    const booking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
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
          },
        },
      },
    });

    // Enviar emails baseado na mudança de status (sem aguardar)
    if (status && previousBooking && status !== previousBooking.status) {
      const emailData = formatBookingDataForEmail(booking);

      if (status === "CONFIRMED") {
        sendBookingConfirmedEmail(emailData, booking.id).catch((error) =>
          console.error("Erro ao enviar email de confirmação:", error)
        );
      } else if (status === "CANCELLED") {
        sendBookingCancelledEmail(emailData, "admin", booking.id).catch(
          (error) => console.error("Erro ao enviar email de cancelamento:", error)
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
