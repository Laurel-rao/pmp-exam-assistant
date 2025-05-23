import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, hasPermission } from '@/lib/auth'

// 创建菜单验证模式
const createMenuSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空'),
  path: z.string().optional(),
  icon: z.string().optional(),
  component: z.string().optional(),
  parentId: z.string().optional(),
  sort: z.number().default(0),
  type: z.number().default(1),
  permission: z.string().optional(),
  status: z.number().default(1),
})

// 获取菜单列表
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: '未登录或令牌已过期' 
        },
        { status: 401 }
      )
    }

    // 检查权限
    const canManageMenu = await hasPermission(user.id, 'system:menu:list')
    if (!canManageMenu && !user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '权限不足' 
        },
        { status: 403 }
      )
    }

    // 获取所有菜单
    const menus = await prisma.menu.findMany({
      orderBy: [
        { sort: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // 构建树形结构
    const buildMenuTree = (items: any[], parentId: string | null = null): any[] => {
      return items
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item,
          children: buildMenuTree(items, item.id)
        }))
    }

    const menuTree = buildMenuTree(menus)

    return NextResponse.json({
      success: true,
      data: menuTree
    })

  } catch (error) {
    console.error('Get menus error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
}

// 创建菜单
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          message: '未登录或令牌已过期' 
        },
        { status: 401 }
      )
    }

    // 检查权限
    const canCreateMenu = await hasPermission(user.id, 'system:menu:create')
    if (!canCreateMenu && !user.roles.includes('ADMIN')) {
      return NextResponse.json(
        { 
          success: false, 
          message: '权限不足' 
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // 验证请求数据
    const result = createMenuSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.error.errors[0].message 
        },
        { status: 400 }
      )
    }

    const menuData = result.data

    // 如果有父菜单ID，验证父菜单是否存在
    if (menuData.parentId) {
      const parentMenu = await prisma.menu.findUnique({
        where: { id: menuData.parentId }
      })

      if (!parentMenu) {
        return NextResponse.json(
          { 
            success: false, 
            message: '父菜单不存在' 
          },
          { status: 400 }
        )
      }
    }

    // 创建菜单
    const menu = await prisma.menu.create({
      data: menuData
    })

    return NextResponse.json({
      success: true,
      message: '菜单创建成功',
      data: menu
    })

  } catch (error) {
    console.error('Create menu error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 