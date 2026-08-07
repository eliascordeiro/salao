-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN     "clientTypingAt" TIMESTAMP(3),
ADD COLUMN     "ownerTypingAt" TIMESTAMP(3);
