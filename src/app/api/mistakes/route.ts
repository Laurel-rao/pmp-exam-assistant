import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取用户错题列表
export async function GET(request: NextRequest) {
  try {
    // 验证用户登录
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''

    // 验证分页参数
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { success: false, message: '无效的分页参数' },
        { status: 400 }
      )
    }

    // 构建查询条件
    const where: any = {
      userId: user.id,
      isCorrect: false, // 只获取回答错误的记录
    }

    // 添加搜索条件
    if (search) {
      where.question = {
        content: {
          contains: search,
          mode: 'insensitive'
        }
      }
    }

    // 添加分类筛选
    if (category) {
      if (!where.question) {
        where.question = {}
      }
      where.question.category = category
    }

    // 查询总数
    const total = await prisma.questionRecord.count({
      where
    })

    // 计算分页
    const skip = (page - 1) * limit

    // 查询错题记录
    const mistakes = await prisma.questionRecord.findMany({
      where,
      include: {
        question: {
          select: {
            id: true,
            type: true,
            content: true,
            options: true,
            answer: true,
            explanation: true,
            category: true,
            difficulty: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        mistakes,
        total,
        page,
        limit
      }
    })
  } catch (error) {
    console.error('获取错题列表失败:', error)
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    )
  }
} 