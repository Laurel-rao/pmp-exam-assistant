import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, checkAdminPermission } from '@/lib/auth'

// 获取角色的菜单权限列表
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    if (!user || !checkAdminPermission(user)) {
      return NextResponse.json(
        { success: false, message: '无权访问' },
        { status: 403 }
      )
    }

    const roleId = params.id

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      )
    }

    // 获取角色的菜单权限
    const roleMenus = await prisma.roleMenu.findMany({
      where: { roleId },
      include: {
        menu: {
          select: {
            id: true,
            name: true,
            path: true,
            permission: true,
            type: true,
            parentId: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        menus: roleMenus.map(rm => rm.menu),
      },
    })
  } catch (error) {
    console.error('获取角色菜单权限失败:', error)
    return NextResponse.json(
      { success: false, message: '获取角色菜单权限失败' },
      { status: 500 }
    )
  }
}

// 更新角色菜单权限
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    if (!user || !checkAdminPermission(user)) {
      return NextResponse.json(
        { success: false, message: '无权访问' },
        { status: 403 }
      )
    }

    const roleId = params.id
    const data = await request.json()
    const { menuIds } = data

    if (!Array.isArray(menuIds)) {
      return NextResponse.json(
        { success: false, message: '菜单ID列表格式不正确' },
        { status: 400 }
      )
    }

    // 检查角色是否存在
    const existingRole = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (!existingRole) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      )
    }

    // 检查所有菜单ID是否有效
    const menus = await prisma.menu.findMany({
      where: { id: { in: menuIds } },
    })

    if (menus.length !== menuIds.length) {
      return NextResponse.json(
        { success: false, message: '存在无效的菜单ID' },
        { status: 400 }
      )
    }

    // 使用事务确保操作的原子性
    await prisma.$transaction(async (tx) => {
      // 先删除角色所有现有菜单权限
      await tx.roleMenu.deleteMany({
        where: { roleId },
      })

      // 创建新的角色菜单关联
      if (menuIds.length > 0) {
        await tx.roleMenu.createMany({
          data: menuIds.map(menuId => ({
            roleId,
            menuId,
          })),
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: '角色菜单权限更新成功',
    })
  } catch (error) {
    console.error('更新角色菜单权限失败:', error)
    return NextResponse.json(
      { success: false, message: '更新角色菜单权限失败' },
      { status: 500 }
    )
  }
} 