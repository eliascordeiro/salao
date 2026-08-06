-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "lastGenerated" TIMESTAMP(3),
ADD COLUMN     "parentExpenseId" TEXT,
ADD COLUMN     "recurringDay" INTEGER;
