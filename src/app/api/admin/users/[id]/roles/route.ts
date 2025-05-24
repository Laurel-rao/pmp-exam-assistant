import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

// 获取用户的角色列表
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

    const userId = params.id

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 获取用户的角色
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        roles: userRoles.map(ur => ur.role),
      },
    })
  } catch (error) {
    console.error('获取用户角色失败:', error)
    return NextResponse.json(
      { success: false, message: '获取用户角色失败' },
      { status: 500 }
    )
  }
}

// 更新用户角色
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

    const userId = params.id
    const data = await request.json()
    const { roleIds } = data

    if (!Array.isArray(roleIds)) {
      return NextResponse.json(
        { success: false, message: '角色ID列表格式不正确' },
        { status: 400 }
      )
    }

    // 检查用户是否存在
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 检查所有角色ID是否有效
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
    })

    if (roles.length !== roleIds.length) {
      return NextResponse.json(
        { success: false, message: '存在无效的角色ID' },
        { status: 400 }
      )
    }

    // 使用事务确保操作的原子性
    await prisma.$transaction(async (tx) => {
      // 先删除用户所有现有角色
      await tx.userRole.deleteMany({
        where: { userId },
      })

      // 创建新的用户角色关联
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map(roleId => ({
            userId,
            roleId,
          })),
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: '用户角色更新成功',
    })
  } catch (error) {
    console.error('更新用户角色失败:', error)
    return NextResponse.json(
      { success: false, message: '更新用户角色失败' },
      { status: 500 }
    )
  }
} 