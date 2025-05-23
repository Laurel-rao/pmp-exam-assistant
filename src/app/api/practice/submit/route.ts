import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 答题记录验证模式
const submitSchema = z.object({
  questionId: z.string().min(1, '题目ID不能为空'),
  userAnswer: z.string().min(1, '用户答案不能为空'),
  isCorrect: z.boolean(),
  timeSpent: z.number().min(0, '答题时间不能为负数'),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const result = submitSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { questionId, userAnswer, isCorrect, timeSpent } = result.data

    // 检查题目是否存在
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    })

    if (!question) {
      return NextResponse.json(
        { success: false, message: '题目不存在' },
        { status: 404 }
      )
    }

    // 创建答题记录
    const questionRecord = await prisma.questionRecord.create({
      data: {
        userId: user.id,
        questionId: questionId,
        userAnswer: userAnswer,
        isCorrect: isCorrect,
        timeSpent: timeSpent,
        mode: 'practice' // 练习模式
      }
    })

    return NextResponse.json({
      success: true,
      message: '答题记录保存成功',
      data: {
        recordId: questionRecord.id,
        isCorrect: isCorrect
      }
    })

  } catch (error) {
    console.error('保存答题记录失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 