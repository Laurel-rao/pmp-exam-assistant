const { PrismaClient } = require('../src/generated/prisma')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('开始初始化数据...')

  // 创建管理员用户
  const adminPassword = await hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      phone: '13800138000',
      email: 'admin@example.com',
      password: adminPassword,
      status: 1
    },
  })
  console.log(`创建管理员用户成功: ${admin.id}`)

  // 创建普通用户
  const userPassword = await hash('123456', 10)
  const user = await prisma.user.create({
    data: {
      name: '测试用户',
      phone: '13800138001',
      email: 'user@example.com',
      password: userPassword,
      status: 1
    },
  })
  console.log(`创建普通用户成功: ${user.id}`)

  // 创建角色
  const adminRole = await prisma.role.create({
    data: {
      name: '管理员',
      code: 'ADMIN',
      description: '系统管理员',
      status: 1
    },
  })
  console.log(`创建管理员角色成功: ${adminRole.id}`)

  const userRole = await prisma.role.create({
    data: {
      name: '普通用户',
      code: 'USER',
      description: '普通用户',
      status: 1
    },
  })
  console.log(`创建普通用户角色成功: ${userRole.id}`)

  // 分配角色
  await prisma.userRole.create({
    data: {
      userId: admin.id,
      roleId: adminRole.id
    },
  })
  console.log('管理员角色分配成功')

  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId: userRole.id
    },
  })
  console.log('普通用户角色分配成功')

  // 创建示例题目
  const question1 = await prisma.question.create({
    data: {
      type: 'single',
      content: '项目经理在项目执行阶段发现项目已经超出进度计划，应采取什么措施？',
      options: JSON.stringify(['A. 申请延长项目工期', 'B. 增加资源投入', 'C. 分析进度偏差原因并采取纠正措施', 'D. 修改项目计划']),
      answer: 'C',
      explanation: '当项目进度出现偏差时，项目经理应首先分析偏差原因，然后采取适当的纠正措施。',
      category: 'executing',
      difficulty: 2,
      status: 1
    }
  })
  console.log(`创建示例题目1成功: ${question1.id}`)

  const question2 = await prisma.question.create({
    data: {
      type: 'single',
      content: '项目范围说明书主要由谁负责审批？',
      options: JSON.stringify(['A. 项目经理', 'B. 发起人', 'C. 客户', 'D. 项目团队']),
      answer: 'B',
      explanation: '项目范围说明书通常由项目发起人或项目指导委员会审批。',
      category: 'initiating',
      difficulty: 1,
      status: 1
    }
  })
  console.log(`创建示例题目2成功: ${question2.id}`)

  console.log('数据初始化完成')
}

main()
  .catch((e) => {
    console.error('数据初始化失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 