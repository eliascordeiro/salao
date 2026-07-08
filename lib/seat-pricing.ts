import { prisma } from "@/lib/prisma";

/**
 * Modelo de cobrança "por cadeira":
 * valor mensal = número de cadeiras (profissionais) × preço por cadeira do plano.
 *
 * O preço por cadeira é armazenado em `Plan.price`.
 */

// Número mínimo de cadeiras cobradas (salão autônomo = 1 cadeira)
export const MIN_SEATS = 1;

/**
 * Conta os profissionais ativos de um salão (base para nº de cadeiras).
 */
export async function countActiveSeats(salonId: string): Promise<number> {
  const count = await prisma.staff.count({
    where: { salonId, active: true },
  });
  return Math.max(count, MIN_SEATS);
}

/**
 * Resolve o número de cadeiras a cobrar.
 * Se `requestedSeats` for informado, respeita o valor (com mínimo);
 * caso contrário, deriva da quantidade de profissionais ativos.
 */
export async function resolveSeats(
  salonId: string,
  requestedSeats?: number | null
): Promise<number> {
  if (requestedSeats && Number.isFinite(requestedSeats)) {
    return Math.max(Math.floor(requestedSeats), MIN_SEATS);
  }
  return countActiveSeats(salonId);
}

/**
 * Calcula o valor mensal total dado o preço por cadeira e o nº de cadeiras.
 */
export function calculateAmount(pricePerSeat: number, seats: number): number {
  const safeSeats = Math.max(Math.floor(seats), MIN_SEATS);
  return Math.round(pricePerSeat * safeSeats * 100) / 100;
}

/**
 * Verifica se o salão pode adicionar mais um profissional dentro do nº
 * de cadeiras contratadas na assinatura ativa.
 *
 * Só bloqueia quando existe assinatura ATIVA com nº de cadeiras definido.
 * Sem assinatura ativa (trial/sem plano) não bloqueia aqui.
 */
export async function canAddStaff(
  salonId: string
): Promise<{ allowed: boolean; seats: number; activeStaff: number }> {
  const subscription = await prisma.subscription.findUnique({
    where: { salonId },
    select: { status: true, seats: true },
  });

  const activeStaff = await prisma.staff.count({
    where: { salonId, active: true },
  });

  // Sem assinatura ativa: não aplica limite de cadeiras aqui
  if (!subscription || subscription.status !== "ACTIVE") {
    return { allowed: true, seats: subscription?.seats ?? 0, activeStaff };
  }

  const seats = subscription.seats ?? MIN_SEATS;
  return { allowed: activeStaff < seats, seats, activeStaff };
}

