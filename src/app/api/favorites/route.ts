import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 收藏请求验证模式
const favoriteSchema = z.object({
  questionId: z.string().min(1, '题目ID不能为空'),
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
    const result = favoriteSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error.errors[0].message },
        { status: 400 }
      )
    }

    const { questionId } = result.data

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

    // 检查是否已收藏
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_questionId: {
          userId: user.id,
          questionId: questionId
        }
      }
    })

    if (existingFavorite) {
      // 已收藏，则取消收藏
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      })

      return NextResponse.json({
        success: true,
        message: '已取消收藏',
        data: { isFavorited: false }
      })
    } else {
      // 未收藏，则添加收藏
      await prisma.favorite.create({
        data: {
          userId: user.id,
          questionId: questionId
        }
      })

      return NextResponse.json({
        success: true,
        message: '收藏成功',
        data: { isFavorited: true }
      })
    }

  } catch (error) {
    console.error('收藏操作失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // 查询用户收藏的题目
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      include: {
        question: {
          where: { status: 1 }
        }
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    })

    // 查询总数
    const totalCount = await prisma.favorite.count({
      where: { 
        userId: user.id,
        question: { status: 1 }
      }
    })

    const questions = favorites
      .filter(fav => fav.question) // 过滤掉已删除的题目
      .map(fav => ({
        id: fav.question.id,
        type: fav.question.type,
        content: fav.question.content,
        options: fav.question.options,
        category: fav.question.category,
        difficulty: fav.question.difficulty,
        isFavorited: true,
        favoritedAt: fav.createdAt
      }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        questions,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    })

  } catch (error) {
    console.error('获取收藏列表失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 