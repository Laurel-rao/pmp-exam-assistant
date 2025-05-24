import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, checkAdminPermission } from '@/lib/auth'

// 获取菜单详情
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

    const menuId = params.id

    // 查询菜单详情
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    })

    if (!menu) {
      return NextResponse.json(
        { success: false, message: '菜单不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { menu },
    })
  } catch (error) {
    console.error('获取菜单详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取菜单详情失败' },
      { status: 500 }
    )
  }
}

// 更新菜单
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

    const menuId = params.id
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

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
    })

    if (!existingMenu) {
      return NextResponse.json(
        { success: false, message: '菜单不存在' },
        { status: 404 }
      )
    }

    // 检查父菜单是否存在
    if (parentId) {
      // 不能将自己设为自己的父菜单
      if (parentId === menuId) {
        return NextResponse.json(
          { success: false, message: '不能将菜单自身设为父菜单' },
          { status: 400 }
        )
      }

      const parentMenu = await prisma.menu.findUnique({
        where: { id: parentId },
      })

      if (!parentMenu) {
        return NextResponse.json(
          { success: false, message: '父菜单不存在' },
          { status: 400 }
        )
      }

      // 检查是否会形成循环引用
      let currentParentId = parentId
      const visitedIds = new Set([menuId])

      while (currentParentId) {
        if (visitedIds.has(currentParentId)) {
          return NextResponse.json(
            { success: false, message: '父菜单设置会导致循环引用' },
            { status: 400 }
          )
        }

        visitedIds.add(currentParentId)

        const parent = await prisma.menu.findUnique({
          where: { id: currentParentId },
          select: { parentId: true },
        })

        if (!parent) break
        currentParentId = parent.parentId
      }
    }

    // 权限标识唯一性检查
    if (permission && permission !== existingMenu.permission) {
      const existingPermission = await prisma.menu.findFirst({
        where: {
          permission,
          id: { not: menuId },
        },
      })

      if (existingPermission) {
        return NextResponse.json(
          { success: false, message: '权限标识已存在' },
          { status: 400 }
        )
      }
    }

    // 更新菜单
    const updatedMenu = await prisma.menu.update({
      where: { id: menuId },
      data: {
        name,
        path: path || null,
        icon: icon || null,
        component: component || null,
        parentId: parentId || null,
        sort: sort ?? existingMenu.sort,
        type: type ?? existingMenu.type,
        permission: permission || null,
        status: status ?? existingMenu.status,
      },
    })

    return NextResponse.json({
      success: true,
      data: { menu: updatedMenu },
    })
  } catch (error) {
    console.error('更新菜单失败:', error)
    return NextResponse.json(
      { success: false, message: '更新菜单失败' },
      { status: 500 }
    )
  }
}

// 删除菜单
export async function DELETE(
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

    const menuId = params.id

    // 检查菜单是否存在
    const existingMenu = await prisma.menu.findUnique({
      where: { id: menuId },
    })

    if (!existingMenu) {
      return NextResponse.json(
        { success: false, message: '菜单不存在' },
        { status: 404 }
      )
    }

    // 检查是否有子菜单
    const childrenCount = await prisma.menu.count({
      where: { parentId: menuId },
    })

    if (childrenCount > 0) {
      return NextResponse.json(
        { success: false, message: '该菜单下有子菜单，请先删除子菜单' },
        { status: 400 }
      )
    }

    // 检查是否有角色使用此菜单
    const roleMenuCount = await prisma.roleMenu.count({
      where: { menuId },
    })

    if (roleMenuCount > 0) {
      // 使用事务删除菜单及相关数据
      await prisma.$transaction(async (tx) => {
        // 删除角色菜单关联
        await tx.roleMenu.deleteMany({
          where: { menuId },
        })

        // 删除菜单
        await tx.menu.delete({
          where: { id: menuId },
        })
      })
    } else {
      // 直接删除菜单
      await prisma.menu.delete({
        where: { id: menuId },
      })
    }

    return NextResponse.json({
      success: true,
      message: '菜单删除成功',
    })
  } catch (error) {
    console.error('删除菜单失败:', error)
    return NextResponse.json(
      { success: false, message: '删除菜单失败' },
      { status: 500 }
    )
  }
} 