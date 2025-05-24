import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取角色详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    if (!user || !user.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: '无权访问' },
        { status: 403 }
      )
    }

    const roleId = params.id

    // 查询角色详情
    const role = await prisma.role.findUnique({
      where: { id: roleId },
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

    if (!role) {
      return NextResponse.json(
        { success: false, message: '角色不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { role },
    })
  } catch (error) {
    console.error('获取角色详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取角色详情失败' },
      { status: 500 }
    )
  }
}

// 更新角色
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    if (!user || !user.roles.includes('admin')) {
      return NextResponse.json(
        { success: false, message: '无权访问' },
        { status: 403 }
      )
    }

    const roleId = params.id
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

    // 检查角色名称唯一性（排除当前角色）
    if (name !== existingRole.name) {
      const nameExists = await prisma.role.findFirst({
        where: {
          name,
          id: { not: roleId },
        },
      })

      if (nameExists) {
        return NextResponse.json(
          { success: false, message: '角色名称已存在' },
          { status: 400 }
        )
      }
    }

    // 检查角色代码唯一性（排除当前角色）
    if (code !== existingRole.code) {
      const codeExists = await prisma.role.findFirst({
        where: {
          code,
          id: { not: roleId },
        },
      })

      if (codeExists) {
        return NextResponse.json(
          { success: false, message: '角色代码已存在' },
          { status: 400 }
        )
      }
    }

    // 更新角色
    const updatedRole = await prisma.role.update({
      where: { id: roleId },
      data: {
        name,
        code,
        description: description || null,
        status: status ?? existingRole.status,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRole.id,
        name: updatedRole.name,
        code: updatedRole.code,
        description: updatedRole.description,
        status: updatedRole.status,
        updatedAt: updatedRole.updatedAt,
      },
    })
  } catch (error) {
    console.error('更新角色失败:', error)
    return NextResponse.json(
      { success: false, message: '更新角色失败' },
      { status: 500 }
    )
  }
}

// 删除角色
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const user = await getCurrentUser(request)
    if (!user || !user.roles.includes('admin')) {
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

    // 检查是否为内置角色（admin角色不允许删除）
    if (existingRole.code === 'admin') {
      return NextResponse.json(
        { success: false, message: '不能删除系统管理员角色' },
        { status: 400 }
      )
    }

    // 检查是否有用户使用此角色
    const userRoleCount = await prisma.userRole.count({
      where: { roleId },
    })

    if (userRoleCount > 0) {
      return NextResponse.json(
        { success: false, message: '该角色正在被用户使用，无法删除' },
        { status: 400 }
      )
    }

    // 使用事务删除角色及相关数据
    await prisma.$transaction(async (tx) => {
      // 删除角色菜单关联
      await tx.roleMenu.deleteMany({
        where: { roleId },
      })

      // 删除角色
      await tx.role.delete({
        where: { id: roleId },
      })
    })

    return NextResponse.json({
      success: true,
      message: '角色删除成功',
    })
  } catch (error) {
    console.error('删除角色失败:', error)
    return NextResponse.json(
      { success: false, message: '删除角色失败' },
      { status: 500 }
    )
  }
} 