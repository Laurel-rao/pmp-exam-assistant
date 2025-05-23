import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const sampleQuestions = [
  {
    type: 'single',
    content: 'PMP认证考试中，项目管理知识体系指南（PMBOK）定义了多少个知识领域？',
    options: ['8个', '9个', '10个', '12个'],
    answer: 'C',
    explanation: 'PMBOK第六版定义了10个知识领域：项目整合管理、项目范围管理、项目进度管理、项目成本管理、项目质量管理、项目资源管理、项目沟通管理、项目风险管理、项目采购管理、项目相关方管理。',
    category: 'initiation',
    difficulty: 2
  },
  {
    type: 'single',
    content: '在项目生命周期中，哪个阶段的成本变更通常最高？',
    options: ['启动阶段', '规划阶段', '执行阶段', '收尾阶段'],
    answer: 'C',
    explanation: '在项目执行阶段，大部分项目工作正在进行，此时进行变更的成本通常是最高的。而在项目早期阶段，变更成本相对较低。',
    category: 'executing',
    difficulty: 3
  },
  {
    type: 'single',
    content: '敏捷项目管理中，每个迭代周期通常被称为什么？',
    options: ['阶段', '冲刺(Sprint)', '里程碑', '交付物'],
    answer: 'B',
    explanation: '在敏捷项目管理，特别是Scrum框架中，每个迭代周期被称为Sprint（冲刺），通常持续1-4周。',
    category: 'planning',
    difficulty: 1
  },
  {
    type: 'single',
    content: '项目风险管理过程中，识别风险的最佳时机是？',
    options: ['项目开始时', '项目规划阶段', '整个项目期间', '项目执行阶段'],
    answer: 'C',
    explanation: '风险识别应该在整个项目期间持续进行，因为新的风险可能在项目的任何阶段出现。',
    category: 'monitoring',
    difficulty: 3
  },
  {
    type: 'single',
    content: '项目管理办公室（PMO）的主要职能是什么？',
    options: ['执行项目任务', '提供项目管理支持和指导', '管理项目预算', '开发项目产品'],
    answer: 'B',
    explanation: 'PMO的主要职能是为组织内的项目提供管理支持、指导、培训和标准化等服务。',
    category: 'initiation',
    difficulty: 2
  },
  {
    type: 'multiple',
    content: '项目沟通管理包括哪些主要过程？',
    options: ['规划沟通管理', '管理沟通', '监督沟通', '识别相关方'],
    answer: 'A,B,C',
    explanation: '项目沟通管理包括三个主要过程：规划沟通管理、管理沟通和监督沟通。识别相关方属于项目相关方管理。',
    category: 'planning',
    difficulty: 4
  },
  {
    type: 'single',
    content: '在项目收尾阶段，项目经理应该完成哪项关键活动？',
    options: ['制定项目章程', '创建工作分解结构', '进行项目绩效评审', '识别项目风险'],
    answer: 'C',
    explanation: '在项目收尾阶段，项目经理需要进行项目绩效评审，总结经验教训，并正式关闭项目。',
    category: 'closing',
    difficulty: 2
  },
  {
    type: 'single',
    content: '关键路径法（CPM）主要用于什么目的？',
    options: ['成本控制', '质量管理', '进度管理', '风险管理'],
    answer: 'C',
    explanation: '关键路径法（CPM）是一种进度管理技术，用于识别项目中最长的活动序列，确定项目最短完成时间。',
    category: 'planning',
    difficulty: 3
  },
  {
    type: 'single',
    content: '项目中的"金三角"指的是什么？',
    options: ['时间、成本、质量', '范围、进度、成本', '质量、风险、沟通', '相关方、团队、资源'],
    answer: 'B',
    explanation: '项目管理的"金三角"（或称为三重约束）指的是范围、进度（时间）和成本，这三个要素相互影响和制约。',
    category: 'initiation',
    difficulty: 1
  },
  {
    type: 'single',
    content: '在敏捷开发中，产品负责人（Product Owner）的主要职责是什么？',
    options: ['编写代码', '测试产品', '定义产品需求和优先级', '管理开发团队'],
    answer: 'C',
    explanation: '产品负责人的主要职责是定义产品需求、维护产品待办事项列表，并确定功能的优先级。',
    category: 'planning',
    difficulty: 2
  },
  {
    type: 'single',
    content: '什么是项目章程（Project Charter）？',
    options: ['详细的项目计划', '项目正式授权文件', '项目预算报告', '项目风险登记册'],
    answer: 'B',
    explanation: '项目章程是正式授权项目存在并为项目经理使用组织资源进行项目活动提供授权的文件。',
    category: 'initiation',
    difficulty: 2
  },
  {
    type: 'single',
    content: 'RACI矩阵中的字母I代表什么？',
    options: ['负责(Responsible)', '问责(Accountable)', '咨询(Consulted)', '知情(Informed)'],
    answer: 'D',
    explanation: 'RACI矩阵中，I代表Informed（知情），即需要被告知决策或行动结果的相关方。',
    category: 'planning',
    difficulty: 2
  },
  {
    type: 'single',
    content: '在项目管理中，WBS是什么的缩写？',
    options: ['Work Breakdown Structure', 'Work Based System', 'Weekly Business Summary', 'Work Bench Standard'],
    answer: 'A',
    explanation: 'WBS是Work Breakdown Structure（工作分解结构）的缩写，是将项目可交付成果和项目工作分解成较小、更易管理组件的层次分解。',
    category: 'planning',
    difficulty: 1
  },
  {
    type: 'single',
    content: '项目质量管理的三个过程是什么？',
    options: ['质量规划、质量保证、质量控制', '质量计划、质量执行、质量检查', '质量设计、质量生产、质量交付', '质量标准、质量测试、质量改进'],
    answer: 'A',
    explanation: '项目质量管理包括三个过程：规划质量管理、管理质量（质量保证）和控制质量（质量控制）。',
    category: 'executing',
    difficulty: 3
  },
  {
    type: 'single',
    content: '敏捷项目中的"每日站立会议"通常多长时间？',
    options: ['5分钟', '15分钟', '30分钟', '1小时'],
    answer: 'B',
    explanation: '敏捷项目中的每日站立会议（Daily Standup）通常限制在15分钟以内，确保简短高效。',
    category: 'monitoring',
    difficulty: 2
  }
]

async function importSampleQuestions() {
  console.log('开始导入示例题目...')

  try {
    for (const questionData of sampleQuestions) {
      // 检查题目是否已存在
      const existingQuestion = await prisma.question.findFirst({
        where: { content: questionData.content }
      })

      if (!existingQuestion) {
        await prisma.question.create({
          data: questionData
        })
        console.log(`✅ 已导入题目: ${questionData.content.substring(0, 50)}...`)
      } else {
        console.log(`⏭️  题目已存在: ${questionData.content.substring(0, 50)}...`)
      }
    }

    console.log('🎉 示例题目导入完成!')
    console.log(`📊 总共处理 ${sampleQuestions.length} 道题目`)

  } catch (error) {
    console.error('❌ 导入题目失败:', error)
    throw error
  }
}

importSampleQuestions()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 