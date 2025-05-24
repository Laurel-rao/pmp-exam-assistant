import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { comparePassword, generateToken } from '@/lib/auth'

// 登录请求验证模式
const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
  password: z.string().min(6, '密码长度不能少于6位'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('API: /api/auth/login POST 被访问')
    
    const body = await request.json()
    console.log('登录请求参数:', { phone: body.phone, password: '***' })
    
    // 验证请求数据
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      console.log('登录参数验证失败:', result.error.errors[0].message)
      return NextResponse.json(
        { 
          success: false, 
          message: result.error.errors[0].message 
        },
        { status: 400 }
      )
    }

    const { phone, password } = result.data

    // 查找用户
    console.log('开始查询用户:', phone)
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    })

    if (!user) {
      console.log('用户不存在:', phone)
      return NextResponse.json(
        { 
          success: false, 
          message: '手机号或密码错误' 
        },
        { status: 401 }
      )
    }
    
    console.log('找到用户:', user.id, user.phone)
    console.log('用户角色:', user.userRoles.map(ur => `${ur.role.name}(${ur.role.code})`).join(', '))

    // 检查用户状态
    if (user.status !== 1) {
      console.log('用户状态异常:', user.status)
      return NextResponse.json(
        { 
          success: false, 
          message: '账户已被禁用，请联系管理员' 
        },
        { status: 401 }
      )
    }

    // 验证密码
    console.log('开始验证密码')
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      console.log('密码验证失败')
      return NextResponse.json(
        { 
          success: false, 
          message: '手机号或密码错误' 
        },
        { status: 401 }
      )
    }
    
    console.log('密码验证成功')

    // 提取用户角色
    const userRoles = user.userRoles.map(ur => ur.role.code)
    console.log('提取的用户角色:', userRoles)

    // 生成JWT令牌
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      name: user.name || undefined,
      roles: userRoles
    })
    
    console.log('JWT令牌已生成')

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })
    
    console.log('最后登录时间已更新')

    // 设置Cookie
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatar: user.avatar,
          roles: userRoles
        },
        token: token
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: false, // 开发环境强制设为false
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24小时
      path: '/',
      domain: undefined // 开发环境不设置domain
    })
    
    console.log('登录成功，Cookie已设置')

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: '服务器内部错误' 
      },
      { status: 500 }
    )
  }
} 