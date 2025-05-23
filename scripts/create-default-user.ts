import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const defaultUser = await prisma.user.upsert({
      where: {
        phone: '13800138000',
      },
      update: {},
      create: {
        phone: '13800138000',
        password: 'A123456',
        name: '默认用户',
      },
    })

    console.log('默认用户创建成功:', defaultUser)
  } catch (error) {
    console.error('创建默认用户失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 