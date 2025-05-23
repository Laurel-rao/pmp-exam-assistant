import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'

// 注册请求验证模式
const registerSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  password: z.string().min(6, '密码长度不能少于6位'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 验证请求数据
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.error.errors[0].message 
        },
        { status: 400 }
      )
    }

    const { phone, password, name } = result.data

    // 检查手机号是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { phone }
    })

    if (existingUser) {
      return NextResponse.json(
        { 
          success: false, 
          message: '该手机号已被注册' 
        },
        { status: 409 }
      )
    }

    // 加密密码
    const hashedPassword = await hashPassword(password)

    // 获取普通用户角色
    let userRole = await prisma.role.findUnique({
      where: { code: 'USER' }
    })

    // 如果角色不存在，创建默认角色
    if (!userRole) {
      userRole = await prisma.role.create({
        data: {
          name: '普通用户',
          code: 'USER',
          description: '系统普通用户',
        }
      })
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        name,
        userRoles: {
          create: {
            roleId: userRole.id
          }
        }
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      name: user.name || undefined,
      roles: user.userRoles.map(ur => ur.role.code)
    })

    // 设置Cookie
    const response = NextResponse.json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          roles: user.userRoles.map(ur => ur.role.code)
        }
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24小时
    })

    return response

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 