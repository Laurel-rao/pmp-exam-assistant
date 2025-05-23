import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 查询参数验证模式
const querySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.string().optional(),
})

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
    const result = querySchema.safeParse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: '参数验证失败' },
        { status: 400 }
      )
    }

    const { page, limit, search, category, difficulty } = result.data
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // 构建查询条件
    const where: any = {
      status: 1, // 只查询启用的题目
    }

    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (category && category !== 'all') {
      where.category = category
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = parseInt(difficulty)
    }

    // 查询题目总数
    const totalCount = await prisma.question.count({ where })

    // 查询题目列表
    const questions = await prisma.question.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        favorites: {
          where: { userId: user.id },
          select: { id: true }
        }
      }
    })

    // 处理返回数据
    const questionsWithFavorite = questions.map(question => ({
      id: question.id,
      type: question.type,
      content: question.content,
      options: question.options,
      category: question.category,
      difficulty: question.difficulty,
      isFavorited: question.favorites.length > 0
    }))

    const totalPages = Math.ceil(totalCount / limitNum)

    return NextResponse.json({
      success: true,
      data: {
        questions: questionsWithFavorite,
        totalCount,
        totalPages,
        currentPage: pageNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    })

  } catch (error) {
    console.error('获取题目列表失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 