import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取题目列表
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/admin/questions 被访问')
    
    // 验证管理员权限
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }
    
    // 使用不区分大小写的方式检查管理员角色
    const hasAdminRole = user.roles.some(role => role.toLowerCase() === 'admin');
    if (!hasAdminRole) {
      console.log('API权限验证: 用户无管理员权限, 角色:', user.roles)
      return NextResponse.json(
        { success: false, message: '无权访问，需要管理员权限' },
        { status: 403 }
      )
    }

    console.log('API权限验证通过，用户ID:', user.id, '角色:', user.roles)

    // 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const status = url.searchParams.get('status') || ''

    // 构建查询条件
    const where: any = {}

    // 添加搜索条件
    if (search) {
      where.content = {
        contains: search,
        mode: 'insensitive'
      }
    }

    // 添加分类筛选
    if (category) {
      where.category = category
    }

    // 添加状态筛选
    if (status !== '') {
      where.status = parseInt(status)
    }

    // 查询总数
    const total = await prisma.question.count({ where })

    // 计算分页
    const skip = (page - 1) * limit

    // 查询题目列表
    const questions = await prisma.question.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        questions,
        total,
        page,
        limit
      }
    })
  } catch (error) {
    console.error('获取题目列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取题目列表失败' },
      { status: 500 }
    )
  }
}

// 创建新题目
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: '未登录或令牌已过期' },
        { status: 401 }
      )
    }
    
    // 检查管理员权限
    const hasAdminRole = user.roles.some(role => role.toLowerCase() === 'admin');
    if (!hasAdminRole) {
      return NextResponse.json(
        { success: false, message: '无权访问，需要管理员权限' },
        { status: 403 }
      )
    }

    // 获取请求数据
    const data = await request.json()
    const { 
      type, 
      content, 
      options, 
      answer, 
      explanation, 
      category, 
      difficulty, 
      status = 1 
    } = data

    // 基本验证
    if (!type || !content || !options || !answer || !explanation || !category || !difficulty) {
      return NextResponse.json(
        { success: false, message: '缺少必要字段' },
        { status: 400 }
      )
    }

    // 创建题目
    const question = await prisma.question.create({
      data: {
        type,
        content,
        options,
        answer,
        explanation,
        category,
        difficulty,
        status
      }
    })

    return NextResponse.json({
      success: true,
      message: '题目创建成功',
      data: { question }
    })
  } catch (error) {
    console.error('创建题目失败:', error)
    return NextResponse.json(
      { success: false, message: '创建题目失败' },
      { status: 500 }
    )
  }
} 