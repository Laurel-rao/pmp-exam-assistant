import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 考试题目数量
const EXAM_QUESTIONS_COUNT = 50

export async function GET(request: NextRequest) {
  try {
    // 验证用户是否登录
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    // 从不同类别中抽取题目，模拟真实考试的分布
    // 实际项目中可以根据PMP考试真实的题目分布进行调整
    const categoryDistribution = [
      { category: 'initiation', count: 5 },     // 启动过程组
      { category: 'planning', count: 15 },      // 规划过程组
      { category: 'executing', count: 15 },     // 执行过程组
      { category: 'monitoring', count: 10 },    // 监控过程组
      { category: 'closing', count: 5 }         // 收尾过程组
    ]

    // 按分类抽取题目
    const questionPromises = categoryDistribution.map(async ({ category, count }) => {
      return prisma.question.findMany({
        where: { 
          category,
          status: 1 // 只抽取启用状态的题目
        },
        take: count,
        orderBy: {
          // 随机排序
          id: 'asc'
        },
        select: {
          id: true,
          type: true,
          content: true,
          options: true,
          answer: true,
          explanation: true,
          category: true,
          difficulty: true
        }
      })
    })

    const questionsByCategory = await Promise.all(questionPromises)
    
    // 合并所有分类的题目
    let questions = questionsByCategory.flat()
    
    // 如果题目数量不足，从所有题库中随机补充
    if (questions.length < EXAM_QUESTIONS_COUNT) {
      const remainingCount = EXAM_QUESTIONS_COUNT - questions.length
      const existingIds = questions.map(q => q.id)
      
      const additionalQuestions = await prisma.question.findMany({
        where: { 
          id: { notIn: existingIds },
          status: 1
        },
        take: remainingCount,
        orderBy: {
          id: 'asc'
        },
        select: {
          id: true,
          type: true,
          content: true,
          options: true,
          answer: true,
          explanation: true,
          category: true,
          difficulty: true
        }
      })
      
      questions = [...questions, ...additionalQuestions]
    }
    
    // 随机打乱题目顺序
    questions = questions.sort(() => Math.random() - 0.5)
    
    // 限制题目数量
    questions = questions.slice(0, EXAM_QUESTIONS_COUNT)
    
    return NextResponse.json({
      success: true,
      data: { questions }
    })
  } catch (error) {
    console.error('获取考试题目失败:', error)
    return NextResponse.json(
      { success: false, message: '获取考试题目失败' },
      { status: 500 }
    )
  }
} 