/**
 * Script para criar usuário PLATFORM_ADMIN no Railway
 * 
 * Execute no Railway Shell:
 * railway run node create-platform-admin-railway.js
 * 
 * Ou localmente apontando para Railway DB:
 * DATABASE_URL="postgresql://..." node create-platform-admin-railway.js
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createPlatformAdminRailway() {
  console.log('🔧 Criando usuário PLATFORM_ADMIN no Railway...')
  console.log('📊 Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  console.log('')

  const email = process.env.PLATFORM_ADMIN_EMAIL || 'platform@salaoblza.com.br'
  const password = process.env.PLATFORM_ADMIN_PASSWORD || 'SuperAdmin2026!'

  try {
    // Verificar se já existe
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.log('⚠️  Usuário já existe:', email)
      console.log('   Role atual:', existing.role)
      
      if (existing.role !== 'PLATFORM_ADMIN') {
        console.log('   ⚙️  Atualizando para role PLATFORM_ADMIN...')
        
        const hashedPassword = await bcrypt.hash(password, 10)
        
        const updated = await prisma.user.update({
          where: { email },
          data: {
            role: 'PLATFORM_ADMIN',
            password: hashedPassword,
            name: 'Platform Administrator'
          }
        })
        
        console.log('   ✅ Usuário atualizado com sucesso!')
        console.log('   📧 Email:', updated.email)
        console.log('   👤 Nome:', updated.name)
        console.log('   🎭 Role:', updated.role)
      } else {
        console.log('   ✅ Usuário já é PLATFORM_ADMIN!')
        
        // Atualizar apenas a senha
        const hashedPassword = await bcrypt.hash(password, 10)
        await prisma.user.update({
          where: { email },
          data: { password: hashedPassword }
        })
        console.log('   🔑 Senha atualizada!')
      }
    } else {
      console.log('➕ Criando novo usuário PLATFORM_ADMIN...')
      
      const hashedPassword = await bcrypt.hash(password, 10)
      
      const admin = await prisma.user.create({
        data: {
          email,
          name: 'Platform Administrator',
          password: hashedPassword,
          role: 'PLATFORM_ADMIN',
          phone: '(11) 00000-0000',
          active: true
        }
      })
      
      console.log('✅ Platform Admin criado com sucesso!')
      console.log('   📧 Email:', admin.email)
      console.log('   👤 Nome:', admin.name)
      console.log('   🎭 Role:', admin.role)
      console.log('   🆔 ID:', admin.id)
    }

    console.log('')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 CREDENCIAIS DE ACESSO:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log('')
    console.log('🔗 ACESSE EM PRODUÇÃO:')
    console.log('   https://seu-app.up.railway.app/platform-admin')
    console.log('')
    console.log('⚠️  IMPORTANTE: Altere a senha após primeiro login!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('')

    // Verificar total de usuários
    const totalUsers = await prisma.user.count()
    const platformAdmins = await prisma.user.count({ where: { role: 'PLATFORM_ADMIN' } })
    const admins = await prisma.user.count({ where: { role: 'ADMIN' } })
    const clients = await prisma.user.count({ where: { role: 'CLIENT' } })

    console.log('📊 ESTATÍSTICAS DO BANCO:')
    console.log(`   Total de usuários: ${totalUsers}`)
    console.log(`   Platform Admins: ${platformAdmins}`)
    console.log(`   Admins (donos de salão): ${admins}`)
    console.log(`   Clientes: ${clients}`)
    console.log('')

  } catch (error) {
    console.error('❌ ERRO ao criar/atualizar usuário:')
    console.error(error)
    
    if (error.code === 'P2002') {
      console.log('')
      console.log('💡 DICA: Email já existe. Tente atualizar o usuário existente.')
    }
    
    process.exit(1)
  }
}

createPlatformAdminRailway()
  .then(async () => {
    await prisma.$disconnect()
    console.log('✅ Conexão com banco encerrada')
    console.log('🎉 Script finalizado com sucesso!')
  })
  .catch(async (e) => {
    console.error('❌ Erro fatal:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
