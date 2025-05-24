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

    // 获取用户已做过的题目id
    const doneRecords = await prisma.questionRecord.findMany({
      where: {
        userId: user.id,
        mode: 'practice', // 只排除练习模式已做过的题
      },
      select: { questionId: true }
    })
    const doneIds = doneRecords.map(r => r.questionId)

    // 获取未做过的题目总数
    const total = await prisma.question.count({
      where: {
        status: 1,
        NOT: { id: { in: doneIds } }
      }
    })
    if (total === 0) {
      return NextResponse.json({ success: false, message: '题库已刷完！' }, { status: 404 })
    }

    // 随机获取一道未做过的题目
    const skip = Math.floor(Math.random() * total)
    const question = await prisma.question.findFirst({
      where: {
        status: 1,
        NOT: { id: { in: doneIds } }
      },
      skip,
      orderBy: { id: 'asc' }
    })

    if (!question) {
      return NextResponse.json({ success: false, message: '暂无可用题目' }, { status: 404 })
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