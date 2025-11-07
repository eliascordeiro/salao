import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixAdminSalon() {
  console.log('🔧 Verificando e corrigindo associação admin-salão...')

  // Buscar admin
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@agendasalao.com.br' },
    include: { ownedSalons: true }
  })

  if (!admin) {
    console.log('❌ Admin não encontrado!')
    return
  }

  console.log(`✅ Admin encontrado: ${admin.email}`)
  console.log(`   Salões: ${admin.ownedSalons.length}`)

  if (admin.ownedSalons.length === 0) {
    console.log('⚠️  Admin não tem salão associado. Buscando salão...')

    // Buscar primeiro salão
    const salon = await prisma.salon.findFirst()

    if (salon) {
      console.log(`   Salão encontrado: ${salon.name}`)
      
      // Associar salão ao admin
      await prisma.salon.update({
        where: { id: salon.id },
        data: { ownerId: admin.id }
      })

      console.log('✅ Salão associado ao admin com sucesso!')
    } else {
      console.log('❌ Nenhum salão encontrado no banco!')
    }
  } else {
    console.log('✅ Admin já possui salão associado!')
    admin.ownedSalons.forEach(s => {
      console.log(`   - ${s.name}`)
    })
  }
}

fixAdminSalon()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
