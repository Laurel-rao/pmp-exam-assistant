import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser, checkAdminPermission, hashPassword } from '@/lib/auth'

// 获取用户详情
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

    const userId = params.id

    // 查询用户详情
    const userData = await prisma.user.findUnique({
      where: { id: userId },
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

    if (!userData) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user: userData },
    })
  } catch (error) {
    console.error('获取用户详情失败:', error)
    return NextResponse.json(
      { success: false, message: '获取用户详情失败' },
      { status: 500 }
    )
  }
}

// 更新用户
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

    const userId = params.id
    const data = await request.json()
    const { name, phone, email, password, status } = data

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

    // 手机号唯一性检查（如果修改了手机号）
    if (phone !== existingUser.phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone, id: { not: userId } },
      })

      if (phoneExists) {
        return NextResponse.json(
          { success: false, message: '手机号已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 邮箱唯一性检查（如果修改了邮箱）
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
      })

      if (emailExists) {
        return NextResponse.json(
          { success: false, message: '邮箱已被其他用户使用' },
          { status: 400 }
        )
      }
    }

    // 准备更新数据
    const updateData: any = {
      name: name || null,
      phone,
      email: email || null,
      status: status ?? existingUser.status,
    }

    // 如果提供了新密码，则更新密码
    if (password) {
      updateData.password = await hashPassword(password)
    }

    // 更新用户
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
        status: updatedUser.status,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error('更新用户失败:', error)
    return NextResponse.json(
      { success: false, message: '更新用户失败' },
      { status: 500 }
    )
  }
}

// 删除用户
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

    // 不允许删除自己的账号
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, message: '不能删除自己的账号' },
        { status: 400 }
      )
    }

    // 删除用户（这会级联删除与用户相关的所有记录）
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({
      success: true,
      message: '用户删除成功',
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    return NextResponse.json(
      { success: false, message: '删除用户失败' },
      { status: 500 }
    )
  }
} 