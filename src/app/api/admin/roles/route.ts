import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取角色列表
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/admin/roles 被访问')
    console.log('Request Headers:', Object.fromEntries(request.headers.entries()))
    
    // 验证管理员权限
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user ? JSON.stringify(user) : '未获取到用户')
    
    if (!user) {
      console.log('API权限验证: 未获取到用户信息')
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
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const keyword = searchParams.get('keyword') || ''

    // 构建查询条件
    const where = keyword
      ? {
          OR: [
            { name: { contains: keyword } },
            { code: { contains: keyword } },
            { description: { contains: keyword } },
          ],
        }
      : {}

    // 查询角色总数
    const total = await prisma.role.count({ where })

    // 查询角色列表
    const roles = await prisma.role.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        roleMenus: {
          include: {
            menu: {
              select: {
                id: true,
                name: true,
                path: true,
                permission: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        roles,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('获取角色列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取角色列表失败' },
      { status: 500 }
    )
  }
}

// 创建角色
export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/admin/roles POST请求被访问')
    console.log('Request Headers:', Object.fromEntries(request.headers.entries()))
    
    // 验证管理员权限
    const user = await getCurrentUser(request)
    console.log('获取到的用户信息:', user ? JSON.stringify(user) : '未获取到用户')
    
    if (!user) {
      console.log('API权限验证: 未获取到用户信息')
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

    const data = await request.json()
    const { name, code, description, status } = data

    // 验证必填字段
    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: '角色名称和角色代码不能为空' },
        { status: 400 }
      )
    }

    // 验证角色代码格式（只允许字母、数字和下划线）
    if (!/^[a-zA-Z0-9_]+$/.test(code)) {
      return NextResponse.json(
        { success: false, message: '角色代码只能包含字母、数字和下划线' },
        { status: 400 }
      )
    }

    // 检查角色名称是否已存在
    const existingName = await prisma.role.findUnique({
      where: { name },
    })

    if (existingName) {
      return NextResponse.json(
        { success: false, message: '角色名称已存在' },
        { status: 400 }
      )
    }

    // 检查角色代码是否已存在
    const existingCode = await prisma.role.findUnique({
      where: { code },
    })

    if (existingCode) {
      return NextResponse.json(
        { success: false, message: '角色代码已存在' },
        { status: 400 }
      )
    }

    // 创建角色
    const newRole = await prisma.role.create({
      data: {
        name,
        code,
        description: description || null,
        status: status ?? 1,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newRole.id,
        name: newRole.name,
        code: newRole.code,
        description: newRole.description,
        status: newRole.status,
        createdAt: newRole.createdAt,
      },
    })
  } catch (error) {
    console.error('创建角色失败:', error)
    return NextResponse.json(
      { success: false, message: '创建角色失败' },
      { status: 500 }
    )
  }
} 