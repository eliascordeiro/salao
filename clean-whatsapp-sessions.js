const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanSessions() {
  try {
    const result = await prisma.whatsAppSession.deleteMany({})
    console.log(`✅ ${result.count} sessões WhatsApp deletadas com sucesso!`)
    console.log('🔄 Agora tente conectar novamente com QR Code fresco')
  } catch (error) {
    console.error('❌ Erro ao limpar sessões:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanSessions()
