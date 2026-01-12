const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createPlatformAdmin() {
  console.log('🔧 Criando usuário PLATFORM_ADMIN...')

  const email = process.env.PLATFORM_ADMIN_EMAIL || 'platform@salaoblza.com.br'
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'SuperAdmin2026!'

  // Verificar se já existe
  const existing = await prisma.user.findUnique({
    where: { email }
  })

  if (existing) {
    console.log('⚠️  Usuário já existe:', email)
    console.log('   Atualizando para role PLATFORM_ADMIN...')
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'PLATFORM_ADMIN',
        password: hashedPassword,
        name: 'Platform Administrator'
      }
    })
    
    console.log('✅ Usuário atualizado:', updated.email)
  } else {
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const admin = await prisma.user.create({
      data: {
        email,
        name: 'Platform Administrator',
        password: hashedPassword,
        role: 'PLATFORM_ADMIN',
        phone: '(11) 00000-0000'
      }
    })
    
    console.log('✅ Platform Admin criado:', admin.email)
  }

  console.log('')
  console.log('📝 Credenciais de acesso:')
  console.log(`   Email: ${email}`)
  console.log(`   Senha: ${password}`)
  console.log('')
  console.log('🔗 Acesse em: http://localhost:3000/platform-admin')
  console.log('')
}

createPlatformAdmin()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Erro:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
