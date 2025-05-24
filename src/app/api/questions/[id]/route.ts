import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    const questionId = params.id

    // 查询题目详情
    const question = await prisma.question.findUnique({
      where: { 
        id: questionId,
        status: 1
      },
      include: {
        favorites: {
          where: { userId: user.id },
          select: { id: true }
        }
      }
    })

    if (!question) {
      return NextResponse.json(
        { success: false, message: '题目不存在或已被禁用' },
        { status: 404 }
      )
    }

    // 处理返回数据，包含答案和解析
    const questionWithMeta = {
      id: question.id,
      type: question.type,
      content: question.content,
      options: question.options,
      answer: question.answer,
      explanation: question.explanation,
      category: question.category,
      difficulty: question.difficulty,
      isFavorited: question.favorites.length > 0
    }

    return NextResponse.json({
      success: true,
      data: {
        question: questionWithMeta
      }
    })

  } catch (error) {
    console.error('获取题目详情失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 