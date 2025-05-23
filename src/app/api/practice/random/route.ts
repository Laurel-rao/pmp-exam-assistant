import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    // 获取一道随机题目
    const question = await prisma.question.findFirst({
      where: {
        status: 1 // 只获取启用的题目
      },
      orderBy: {
        // 使用随机排序
        id: 'asc'
      },
      skip: Math.floor(Math.random() * 1000) // 简单的随机跳过
    })

    if (!question) {
      // 如果没有找到题目，尝试获取第一道题目
      const firstQuestion = await prisma.question.findFirst({
        where: { status: 1 },
        orderBy: { createdAt: 'asc' }
      })

      if (!firstQuestion) {
        return NextResponse.json(
          { success: false, message: '暂无可用题目' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: {
          question: {
            id: firstQuestion.id,
            type: firstQuestion.type,
            content: firstQuestion.content,
            options: firstQuestion.options,
            answer: firstQuestion.answer,
            explanation: firstQuestion.explanation,
            category: firstQuestion.category,
            difficulty: firstQuestion.difficulty
          }
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        question: {
          id: question.id,
          type: question.type,
          content: question.content,
          options: question.options,
          answer: question.answer,
          explanation: question.explanation,
          category: question.category,
          difficulty: question.difficulty
        }
      }
    })

  } catch (error) {
    console.error('获取随机题目失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 