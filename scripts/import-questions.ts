import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  try {
    // 读取JSON文件
    const questionsData = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), '../pmp_questions.json'),
        'utf-8'
      )
    )

    console.log('开始导入题目...')

    // 批量创建题目
    const questions = questionsData.questions.map((q: any) => ({
      type: q.type,
      content: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
      category: '项目管理', // 可以根据实际情况设置分类
      difficulty: 3, // 默认难度
    }))

    const result = await prisma.question.createMany({
      data: questions,
      skipDuplicates: true,
    })

    console.log(`成功导入 ${result.count} 道题目`)
  } catch (error) {
    console.error('导入失败:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 