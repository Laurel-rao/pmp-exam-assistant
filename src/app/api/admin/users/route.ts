import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hashPassword } from '@/lib/auth'

// 获取用户列表
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/admin/users 被访问')
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
            { phone: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        }
      : {}

    // 查询用户总数
    const total = await prisma.user.count({ where })

    // 查询用户列表
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取用户列表失败' },
      { status: 500 }
    )
  }
}

// 创建用户
export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/admin/users POST请求被访问')
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
    const { name, phone, email, password, status } = data

    // 验证必填字段
    if (!phone || !password) {
      return NextResponse.json(
        { success: false, message: '手机号和密码不能为空' },
        { status: 400 }
      )
    }

    // 检查手机号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: '手机号已存在' },
        { status: 400 }
      )
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: '邮箱已存在' },
          { status: 400 }
        )
      }
    }

    // 创建用户
    const hashedPassword = await hashPassword(password)
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        phone,
        email: email || null,
        password: hashedPassword,
        status: status ?? 1,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        status: newUser.status,
        createdAt: newUser.createdAt,
      },
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    return NextResponse.json(
      { success: false, message: '创建用户失败' },
      { status: 500 }
    )
  }
} 