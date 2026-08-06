-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED', 'MIXED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "StaffCommissionConfig" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL DEFAULT 'PERCENTAGE',
    "percentageValue" DOUBLE PRECISION,
    "fixedValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffCommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCommissionConfig" (
    "id" TEXT NOT NULL,
    "staffConfigId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "percentageValue" DOUBLE PRECISION,
    "fixedValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "salonId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "servicePrice" DOUBLE PRECISION NOT NULL,
    "commissionType" "CommissionType" NOT NULL,
    "percentageValue" DOUBLE PRECISION,
    "fixedValue" DOUBLE PRECISION,
    "calculatedValue" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffCommissionConfig_staffId_key" ON "StaffCommissionConfig"("staffId");

-- CreateIndex
CREATE INDEX "StaffCommissionConfig_staffId_idx" ON "StaffCommissionConfig"("staffId");

-- CreateIndex
CREATE INDEX "ServiceCommissionConfig_staffConfigId_idx" ON "ServiceCommissionConfig"("staffConfigId");

-- CreateIndex
CREATE INDEX "ServiceCommissionConfig_serviceId_idx" ON "ServiceCommissionConfig"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCommissionConfig_staffConfigId_serviceId_key" ON "ServiceCommissionConfig"("staffConfigId", "serviceId");

-- CreateIndex
CREATE INDEX "Commission_bookingId_idx" ON "Commission"("bookingId");

-- CreateIndex
CREATE INDEX "Commission_staffId_idx" ON "Commission"("staffId");

-- CreateIndex
CREATE INDEX "Commission_salonId_idx" ON "Commission"("salonId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Commission_createdAt_idx" ON "Commission"("createdAt");

-- CreateIndex
CREATE INDEX "Commission_paidAt_idx" ON "Commission"("paidAt");

-- AddForeignKey
ALTER TABLE "StaffCommissionConfig" ADD CONSTRAINT "StaffCommissionConfig_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCommissionConfig" ADD CONSTRAINT "ServiceCommissionConfig_staffConfigId_fkey" FOREIGN KEY ("staffConfigId") REFERENCES "StaffCommissionConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCommissionConfig" ADD CONSTRAINT "ServiceCommissionConfig_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "Salon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
