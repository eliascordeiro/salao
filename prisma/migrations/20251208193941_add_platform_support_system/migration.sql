-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "slug" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ALTER COLUMN "paymentMethod" SET DEFAULT 'pix';

-- CreateTable
CREATE TABLE "PlatformTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isSupport" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformTicket_ticketNumber_key" ON "PlatformTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "PlatformTicket_userId_idx" ON "PlatformTicket"("userId");

-- CreateIndex
CREATE INDEX "PlatformTicket_salonId_idx" ON "PlatformTicket"("salonId");

-- CreateIndex
CREATE INDEX "PlatformTicket_status_idx" ON "PlatformTicket"("status");

-- CreateIndex
CREATE INDEX "PlatformTicket_category_idx" ON "PlatformTicket"("category");

-- CreateIndex
CREATE INDEX "PlatformTicket_createdAt_idx" ON "PlatformTicket"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformTicketMessage_ticketId_idx" ON "PlatformTicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "PlatformTicketMessage_createdAt_idx" ON "PlatformTicketMessage"("createdAt");

-- AddForeignKey
ALTER TABLE "PlatformTicket" ADD CONSTRAINT "PlatformTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformTicket" ADD CONSTRAINT "PlatformTicket_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformTicketMessage" ADD CONSTRAINT "PlatformTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "PlatformTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformTicketMessage" ADD CONSTRAINT "PlatformTicketMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
