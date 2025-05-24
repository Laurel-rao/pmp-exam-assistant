import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取菜单列表
export async function GET(request: NextRequest) {
  try {
    console.log('API: /api/admin/menus 被访问')
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

    // 查询所有菜单
    const menus = await prisma.menu.findMany({
      orderBy: [
        { parentId: 'asc' },
        { sort: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: { menus },
    })
  } catch (error) {
    console.error('获取菜单列表失败:', error)
    return NextResponse.json(
      { success: false, message: '获取菜单列表失败' },
      { status: 500 }
    )
  }
}

// 创建菜单
export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/admin/menus POST请求被访问')
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
    const { 
      name, 
      path, 
      icon, 
      component, 
      parentId, 
      sort, 
      type, 
      permission, 
      status 
    } = data

    // 验证必填字段
    if (!name) {
      return NextResponse.json(
        { success: false, message: '菜单名称不能为空' },
        { status: 400 }
      )
    }

    // 检查父菜单是否存在
    if (parentId) {
      const parentMenu = await prisma.menu.findUnique({
        where: { id: parentId },
      })

      if (!parentMenu) {
        return NextResponse.json(
          { success: false, message: '父菜单不存在' },
          { status: 400 }
        )
      }
    }

    // 权限标识唯一性检查
    if (permission) {
      const existingPermission = await prisma.menu.findFirst({
        where: { permission },
      })

      if (existingPermission) {
        return NextResponse.json(
          { success: false, message: '权限标识已存在' },
          { status: 400 }
        )
      }
    }

    // 创建菜单
    const newMenu = await prisma.menu.create({
      data: {
        name,
        path: path || null,
        icon: icon || null,
        component: component || null,
        parentId: parentId || null,
        sort: sort ?? 0,
        type: type ?? 1,
        permission: permission || null,
        status: status ?? 1,
      },
    })

    return NextResponse.json({
      success: true,
      data: { menu: newMenu },
    })
  } catch (error) {
    console.error('创建菜单失败:', error)
    return NextResponse.json(
      { success: false, message: '创建菜单失败' },
      { status: 500 }
    )
  }
} 