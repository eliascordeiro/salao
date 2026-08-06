-- CreateTable
CREATE TABLE "WhatsAppSession" (
    "id" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "creds" TEXT NOT NULL,
    "keys" TEXT NOT NULL,
    "connected" BOOLEAN NOT NULL DEFAULT false,
    "qrCode" TEXT,
    "phone" TEXT,
    "lastConnected" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppSession_salonId_key" ON "WhatsAppSession"("salonId");

-- CreateIndex
CREATE INDEX "WhatsAppSession_salonId_idx" ON "WhatsAppSession"("salonId");

-- CreateIndex
CREATE INDEX "WhatsAppSession_connected_idx" ON "WhatsAppSession"("connected");

-- AddForeignKey
ALTER TABLE "WhatsAppSession" ADD CONSTRAINT "WhatsAppSession_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
